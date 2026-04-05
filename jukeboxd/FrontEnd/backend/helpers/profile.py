import requests

from backend.config import DIRECTUS_URL
from backend.helpers.common import _extract_api_error


def _serialize_profile_user(user):
    return {
        "U_ID": user.get("U_ID") or user.get("id"),
        "U_FName": user.get("U_FName", ""),
        "U_LName": user.get("U_LName", ""),
        "U_Username": user.get("U_Username", ""),
        "U_Email": user.get("U_Email", ""),
        "U_DateCreated": user.get("U_DateCreated") or user.get("date_created"),
    }


def _profile_update_error_message(payload, default_message):
    error_message = _extract_api_error(payload, default_message)
    lowered_message = error_message.lower()

    if "don't have permission" in lowered_message or "forbidden" in lowered_message:
        return "Profile editing is not enabled on the server yet. Directus update access for the USER collection is currently blocked."
    if "u_username" in lowered_message or "username" in lowered_message:
        return "That username is already taken or must be 5-12 characters."
    if "u_email" in lowered_message or "email" in lowered_message:
        return "That email is already in use or invalid."

    return error_message


def _is_user_field_taken(field_name, value, current_user_id):
    response = requests.get(
        f"{DIRECTUS_URL}/items/USER",
        params={
            f"filter[{field_name}][_eq]": value,
            "limit": 1
        }
    )

    if response.status_code != 200:
        return False

    users = response.json().get("data", [])
    for user in users:
        user_id = user.get("U_ID") or user.get("id")
        if str(user_id) != str(current_user_id):
            return True

    return False
