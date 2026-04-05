import requests

from backend.config import DIRECTUS_URL
from backend.helpers.common import _extract_api_error


FRIENDSHIP_FIELDS = "F_ID,U_ID_1,U_ID_2,F_RequestedBy,F_Status,F_DateCreated,F_DateAccepted"
FRIENDSHIP_USER_FIELDS = "U_ID,U_Username,U_FName,U_LName,U_DateCreated"


def _safe_response_json(response):
    try:
        return response.json()
    except ValueError:
        return {}


def _coerce_friendship_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _normalize_friendship_pair(user_id_a, user_id_b):
    normalized_user_id_a = _coerce_friendship_int(user_id_a)
    normalized_user_id_b = _coerce_friendship_int(user_id_b)

    if normalized_user_id_a is None or normalized_user_id_b is None:
        raise ValueError("A valid user is required.")

    if normalized_user_id_a == normalized_user_id_b:
        raise ValueError("You cannot friend yourself.")

    return (
        (normalized_user_id_a, normalized_user_id_b)
        if normalized_user_id_a < normalized_user_id_b
        else (normalized_user_id_b, normalized_user_id_a)
    )


def _normalize_friendship_record(record):
    if not isinstance(record, dict):
        return None

    return {
        "F_ID": _coerce_friendship_int(record.get("F_ID") or record.get("id")),
        "U_ID_1": _coerce_friendship_int(record.get("U_ID_1")),
        "U_ID_2": _coerce_friendship_int(record.get("U_ID_2")),
        "F_RequestedBy": _coerce_friendship_int(record.get("F_RequestedBy")),
        "F_Status": str(record.get("F_Status") or "").strip().lower(),
        "F_DateCreated": record.get("F_DateCreated") or record.get("date_created"),
        "F_DateAccepted": record.get("F_DateAccepted"),
    }


def _serialize_friend_user(user):
    return {
        "U_ID": _coerce_friendship_int(user.get("U_ID") or user.get("id")),
        "U_Username": str(user.get("U_Username") or "").strip(),
        "U_FName": str(user.get("U_FName") or "").strip(),
        "U_LName": str(user.get("U_LName") or "").strip(),
        "U_DateCreated": user.get("U_DateCreated") or user.get("date_created"),
    }


def _fetch_all_friendships():
    response = requests.get(
        f"{DIRECTUS_URL}/items/FRIENDSHIP",
        params={
            "fields": FRIENDSHIP_FIELDS,
            "limit": 1000,
        }
    )
    payload = _safe_response_json(response)

    if response.status_code != 200:
        raise RuntimeError(_extract_api_error(payload, "Could not load friendships right now."))

    normalized_records = []
    for record in payload.get("data", []):
        normalized_record = _normalize_friendship_record(record)
        if normalized_record and normalized_record.get("F_ID") is not None:
            normalized_records.append(normalized_record)

    return normalized_records


def _fetch_friendship_by_id(friendship_id):
    response = requests.get(
        f"{DIRECTUS_URL}/items/FRIENDSHIP/{friendship_id}",
        params={"fields": FRIENDSHIP_FIELDS}
    )
    payload = _safe_response_json(response)

    if response.status_code == 404:
        return None

    if response.status_code != 200:
        raise RuntimeError(_extract_api_error(payload, "Could not load that friendship right now."))

    return _normalize_friendship_record(payload.get("data", {}))


def _fetch_friend_user_lookup():
    response = requests.get(
        f"{DIRECTUS_URL}/items/USER",
        params={
            "fields": FRIENDSHIP_USER_FIELDS,
            "limit": 1000,
        }
    )
    payload = _safe_response_json(response)

    if response.status_code != 200:
        raise RuntimeError(_extract_api_error(payload, "Could not load users right now."))

    user_lookup = {}
    for user in payload.get("data", []):
        serialized_user = _serialize_friend_user(user)
        user_id = serialized_user.get("U_ID")
        if user_id is not None:
            user_lookup[user_id] = serialized_user

    return user_lookup


def _friendship_involves_user(friendship, user_id):
    normalized_user_id = _coerce_friendship_int(user_id)
    if normalized_user_id is None or not friendship:
        return False

    return friendship.get("U_ID_1") == normalized_user_id or friendship.get("U_ID_2") == normalized_user_id


def _get_other_friendship_user_id(friendship, user_id):
    normalized_user_id = _coerce_friendship_int(user_id)
    if normalized_user_id is None or not friendship:
        return None

    if friendship.get("U_ID_1") == normalized_user_id:
        return friendship.get("U_ID_2")
    if friendship.get("U_ID_2") == normalized_user_id:
        return friendship.get("U_ID_1")

    return None


def _find_friendship_between(friendships, user_id_a, user_id_b):
    normalized_pair = _normalize_friendship_pair(user_id_a, user_id_b)

    for friendship in friendships:
        if (
            friendship.get("U_ID_1") == normalized_pair[0]
            and friendship.get("U_ID_2") == normalized_pair[1]
        ):
            return friendship

    return None
