import requests
from flask import jsonify, request, session

from backend.config import DIRECTUS_URL
from backend.helpers.common import _extract_api_error
from backend.helpers.profile import (
    _is_user_field_taken,
    _profile_update_error_message,
    _serialize_profile_user,
)


def register_profile_routes(app):
    @app.route("/api/profile", methods=["GET", "PATCH"])
    def api_profile():
        if "user_id" not in session:
            return jsonify({"success": False, "message": "Please log in again."}), 401

        user_id = session["user_id"]
        user_response = requests.get(f"{DIRECTUS_URL}/items/USER/{user_id}")
        user_payload = user_response.json()

        if user_response.status_code != 200:
            return jsonify({
                "success": False,
                "message": _extract_api_error(user_payload, "Could not load your profile right now.")
            }), user_response.status_code

        current_user = user_payload.get("data", {})

        if request.method == "GET":
            return jsonify({
                "success": True,
                "data": _serialize_profile_user(current_user)
            })

        data = request.get_json(silent=True) or {}
        first_name = (data.get("firstName") or "").strip()
        last_name = (data.get("lastName") or "").strip()
        username = (data.get("username") or "").strip()
        email = (data.get("email") or "").strip()

        if not first_name or not last_name or not username or not email:
            return jsonify({"success": False, "message": "All profile fields are required."}), 400

        if len(username) < 5 or len(username) > 12:
            return jsonify({"success": False, "message": "Username must be 5-12 characters."}), 400

        if "@" not in email:
            return jsonify({"success": False, "message": "Please enter a valid email address."}), 400

        current_username = str(current_user.get("U_Username") or "").strip()
        if username != current_username:
            return jsonify({
                "success": False,
                "message": "Username changes are not supported yet."
            }), 400

        if _is_user_field_taken("U_Email", email, user_id):
            return jsonify({"success": False, "message": "That email is already in use."}), 409

        update_payload = {
            "U_FName": first_name,
            "U_LName": last_name,
            "U_Email": email
        }

        update_response = requests.patch(
            f"{DIRECTUS_URL}/items/USER/{user_id}",
            json=update_payload
        )
        update_result = update_response.json()

        if update_response.status_code not in (200, 201):
            return jsonify({
                "success": False,
                "message": _profile_update_error_message(
                    update_result,
                    "Could not update your profile right now."
                )
            }), update_response.status_code

        updated_user = update_result.get("data")
        if not isinstance(updated_user, dict):
            updated_user = dict(current_user)
            updated_user.update(update_payload)
            updated_user["U_ID"] = current_user.get("U_ID", user_id)

        session["username"] = current_username

        return jsonify({
            "success": True,
            "message": "Profile updated.",
            "data": _serialize_profile_user(updated_user)
        })
