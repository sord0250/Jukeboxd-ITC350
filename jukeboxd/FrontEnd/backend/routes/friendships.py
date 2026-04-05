from datetime import datetime

import requests
from flask import jsonify, request, session

from backend.config import DIRECTUS_URL
from backend.helpers.common import _extract_api_error
from backend.helpers.friendships import (
    _fetch_all_friendships,
    _fetch_friend_user_lookup,
    _fetch_friendship_by_id,
    _find_friendship_between,
    _friendship_involves_user,
    _get_other_friendship_user_id,
    _normalize_friendship_pair,
    _normalize_friendship_record,
    _safe_response_json,
)
from backend.helpers.input_sanitization import _sanitize_existing_username
from backend.helpers.profile import _get_user_by_username


def _serialize_relationship(friendship, viewer_user_id):
    if not friendship:
        return {
            "friendship_id": None,
            "status": "none",
            "direction": None,
            "requested_by": None,
        }

    status = friendship.get("F_Status") or "none"
    direction = None

    if status == "pending":
        direction = "outgoing" if friendship.get("F_RequestedBy") == viewer_user_id else "incoming"
    elif status == "accepted":
        direction = "accepted"
    elif status == "blocked":
        direction = "blocked"

    return {
        "friendship_id": friendship.get("F_ID"),
        "status": status,
        "direction": direction,
        "requested_by": friendship.get("F_RequestedBy"),
    }


def _build_friend_list(friendships, user_lookup, viewed_user_id):
    friend_list = []
    seen_friend_ids = set()

    for friendship in friendships:
        if friendship.get("F_Status") != "accepted":
            continue

        if not _friendship_involves_user(friendship, viewed_user_id):
            continue

        other_user_id = _get_other_friendship_user_id(friendship, viewed_user_id)
        if other_user_id in seen_friend_ids:
            continue

        friend_user = user_lookup.get(other_user_id)
        if not friend_user:
            continue

        seen_friend_ids.add(other_user_id)
        friend_list.append(friend_user)

    return sorted(
        friend_list,
        key=lambda friend: str(friend.get("U_Username") or "").lower()
    )


def _build_incoming_requests(friendships, user_lookup, viewer_user_id):
    incoming_requests = []

    for friendship in friendships:
        if friendship.get("F_Status") != "pending":
            continue

        if friendship.get("F_RequestedBy") == viewer_user_id:
            continue

        if not _friendship_involves_user(friendship, viewer_user_id):
            continue

        requester_user_id = _get_other_friendship_user_id(friendship, viewer_user_id)
        requester_user = user_lookup.get(requester_user_id)
        if not requester_user:
            continue

        incoming_requests.append({
            "friendship_id": friendship.get("F_ID"),
            "date_created": friendship.get("F_DateCreated"),
            "user": requester_user,
        })

    return sorted(
        incoming_requests,
        key=lambda item: str(item.get("date_created") or ""),
        reverse=True
    )


def register_friendship_routes(app):
    @app.route("/api/friendships", methods=["GET", "POST"])
    def api_friendships():
        if "user_id" not in session:
            return jsonify({"success": False, "message": "Please log in again."}), 401

        viewer_user_id = int(session["user_id"])

        if request.method == "GET":
            requested_username = (request.args.get("username") or session.get("username") or "").strip()
            if not requested_username:
                return jsonify({"success": False, "message": "A username is required."}), 400

            try:
                requested_username = _sanitize_existing_username(requested_username)
            except ValueError as error:
                return jsonify({"success": False, "message": str(error)}), 400

            try:
                viewed_user = _get_user_by_username(requested_username)
                if not viewed_user:
                    return jsonify({"success": False, "message": "We could not find that user."}), 404

                viewed_user_id = int(viewed_user.get("U_ID") or viewed_user.get("id"))
                is_own_profile = viewed_user_id == viewer_user_id
                friendships = _fetch_all_friendships()
                user_lookup = _fetch_friend_user_lookup()

                current_friendship = None
                if not is_own_profile:
                    current_friendship = _find_friendship_between(friendships, viewer_user_id, viewed_user_id)

                friends = _build_friend_list(friendships, user_lookup, viewed_user_id)
                incoming_requests = _build_incoming_requests(friendships, user_lookup, viewer_user_id) if is_own_profile else []

                return jsonify({
                    "success": True,
                    "data": {
                        "is_own_profile": is_own_profile,
                        "friendship": _serialize_relationship(current_friendship, viewer_user_id),
                        "friends": friends,
                        "incoming_requests": incoming_requests,
                        "counts": {
                            "friends": len(friends),
                            "incoming_requests": len(incoming_requests),
                        }
                    }
                })
            except RuntimeError as error:
                return jsonify({"success": False, "message": str(error)}), 502

        data = request.get_json(silent=True) or {}
        try:
            target_username = _sanitize_existing_username(data.get("username"), "Target username")
        except ValueError as error:
            return jsonify({"success": False, "message": str(error)}), 400

        try:
            target_user = _get_user_by_username(target_username)
            if not target_user:
                return jsonify({"success": False, "message": "We could not find that user."}), 404

            target_user_id = int(target_user.get("U_ID") or target_user.get("id"))
            normalized_pair = _normalize_friendship_pair(viewer_user_id, target_user_id)
            existing_friendship = _find_friendship_between(_fetch_all_friendships(), viewer_user_id, target_user_id)

            if existing_friendship:
                existing_relationship = _serialize_relationship(existing_friendship, viewer_user_id)

                if existing_relationship["status"] == "pending":
                    message = (
                        "Friend request already sent."
                        if existing_relationship["direction"] == "outgoing"
                        else "This user already sent you a friend request."
                    )
                elif existing_relationship["status"] == "accepted":
                    message = "You are already friends."
                else:
                    message = "This friendship is unavailable right now."

                return jsonify({
                    "success": False,
                    "message": message,
                    "data": {"friendship": existing_relationship}
                }), 409

            create_response = requests.post(
                f"{DIRECTUS_URL}/items/FRIENDSHIP",
                json={
                    "U_ID_1": normalized_pair[0],
                    "U_ID_2": normalized_pair[1],
                    "F_RequestedBy": viewer_user_id,
                    "F_Status": "pending",
                }
            )
            create_payload = _safe_response_json(create_response)

            if create_response.status_code not in (200, 201):
                return jsonify({
                    "success": False,
                    "message": _extract_api_error(create_payload, "Could not send that friend request right now.")
                }), create_response.status_code

            created_friendship = _normalize_friendship_record(create_payload.get("data", {}))

            return jsonify({
                "success": True,
                "message": "Friend request sent.",
                "data": {
                    "friendship": _serialize_relationship(created_friendship, viewer_user_id)
                }
            }), create_response.status_code
        except ValueError as error:
            return jsonify({"success": False, "message": str(error)}), 400
        except RuntimeError as error:
            return jsonify({"success": False, "message": str(error)}), 502

    @app.route("/api/friendships/<int:friendship_id>", methods=["PATCH", "DELETE"])
    def api_friendship_detail(friendship_id):
        if "user_id" not in session:
            return jsonify({"success": False, "message": "Please log in again."}), 401

        viewer_user_id = int(session["user_id"])

        try:
            friendship = _fetch_friendship_by_id(friendship_id)
        except RuntimeError as error:
            return jsonify({"success": False, "message": str(error)}), 502

        if not friendship:
            return jsonify({"success": False, "message": "That friendship could not be found."}), 404

        if not _friendship_involves_user(friendship, viewer_user_id):
            return jsonify({"success": False, "message": "You do not have permission to change this friendship."}), 403

        if request.method == "PATCH":
            data = request.get_json(silent=True) or {}
            action = str(data.get("action") or "").strip().lower()

            if action != "accept":
                return jsonify({"success": False, "message": "That friendship action is not supported."}), 400

            if friendship.get("F_Status") != "pending":
                return jsonify({"success": False, "message": "That friend request is no longer pending."}), 400

            if friendship.get("F_RequestedBy") == viewer_user_id:
                return jsonify({"success": False, "message": "You cannot accept your own friend request."}), 400

            update_response = requests.patch(
                f"{DIRECTUS_URL}/items/FRIENDSHIP/{friendship_id}",
                json={
                    "F_Status": "accepted",
                    "F_DateAccepted": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            )
            update_payload = _safe_response_json(update_response)

            if update_response.status_code not in (200, 201):
                return jsonify({
                    "success": False,
                    "message": _extract_api_error(update_payload, "Could not accept that friend request right now.")
                }), update_response.status_code

            return jsonify({
                "success": True,
                "message": "Friend request accepted."
            })

        delete_response = requests.delete(f"{DIRECTUS_URL}/items/FRIENDSHIP/{friendship_id}")
        delete_payload = _safe_response_json(delete_response)

        if delete_response.status_code not in (200, 204):
            return jsonify({
                "success": False,
                "message": _extract_api_error(delete_payload, "Could not update that friendship right now.")
            }), delete_response.status_code

        if friendship.get("F_Status") == "accepted":
            message = "Friend removed."
        elif friendship.get("F_RequestedBy") == viewer_user_id:
            message = "Friend request canceled."
        else:
            message = "Friend request declined."

        return jsonify({
            "success": True,
            "message": message
        })
