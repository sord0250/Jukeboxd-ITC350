from datetime import datetime

import bcrypt
import requests
from flask import jsonify, redirect, request, session

from backend.config import DIRECTUS_URL
from backend.helpers.common import _extract_api_error


def register_auth_routes(app):
    @app.route("/logout")
    def logout():
        session.clear()
        return redirect("/")

    @app.route("/api/register", methods=["POST"])
    def api_register():
        data = request.get_json(silent=True) or {}

        first_name = (data.get("firstName") or "").strip()
        last_name = (data.get("lastName") or "").strip()
        username = (data.get("username") or "").strip()
        email = (data.get("email") or "").strip()
        password = data.get("password") or ""

        if not first_name or not last_name or not username or not email or not password:
            return jsonify({"success": False, "message": "All fields are required."}), 400

        if len(username) < 5:
            return jsonify({"success": False, "message": "Username must be at least 5 characters."}), 400

        if len(username) > 12:
            return jsonify({"success": False, "message": "Username must be 12 characters or fewer."}), 400

        if "@" not in email:
            return jsonify({"success": False, "message": "Please enter a valid email address."}), 400

        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        user_data = {
            "U_FName": first_name,
            "U_LName": last_name,
            "U_Username": username,
            "U_Email": email,
            "U_DateCreated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "U_PasswordHash": hashed,
            "U_Role": "user"
        }

        response = requests.post(f"{DIRECTUS_URL}/items/USER", json=user_data)
        result = response.json()

        if response.status_code in (200, 201):
            user_id = result["data"]["U_ID"]
            session["user_id"] = user_id
            session["username"] = username
            return jsonify({
                "success": True,
                "message": "Account created.",
                "data": result.get("data")
            }), response.status_code

        error_message = _extract_api_error(result, "Could not create account.")
        lowered_message = error_message.lower()

        if "u_username" in lowered_message or "username" in lowered_message:
            error_message = "That username is already taken or does not meet the 5-12 character requirement."
        elif "u_email" in lowered_message or "email" in lowered_message:
            error_message = "That email is already in use or invalid."

        return jsonify({
            "success": False,
            "message": error_message,
            "details": result
        }), response.status_code

    @app.route("/api/login", methods=["POST"])
    def api_login():
        data = request.json
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"success": False})

        response = requests.get(
            f"{DIRECTUS_URL}/items/USER",
            params={"filter[U_Email][_eq]": email}
        )

        users = response.json().get("data", [])

        if not users:
            return jsonify({"success": False})

        user = users[0]
        stored_hash = user.get("U_PasswordHash")

        if not stored_hash:
            return jsonify({"success": False})

        if bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
            session["user_id"] = user.get("U_ID")
            session["username"] = user.get("U_Username")

            return jsonify({
                "success": True,
                "user_id": user.get("U_ID"),
                "username": user.get("U_Username"),
                "email": user.get("U_Email")
            })

        return jsonify({"success": False})
