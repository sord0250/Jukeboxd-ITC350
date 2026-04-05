from backend.config import DIRECTUS_URL


def _extract_payload_list(payload):
    if isinstance(payload, dict):
        data = payload.get("data")
        if isinstance(data, list):
            return data, "data"
    if isinstance(payload, list):
        return payload, None
    return [], None


def _filter_user_reviews(payload, username=None, user_id=None):
    reviews, container_key = _extract_payload_list(payload)

    normalized_username = (username or "").strip()
    normalized_user_id = str(user_id).strip() if user_id is not None else ""

    filtered = reviews

    if normalized_username:
        filtered = [
            review for review in filtered
            if str(review.get("U_Username", "")).strip() == normalized_username
        ]

    if normalized_user_id:
        filtered = [
            review for review in filtered
            if str(review.get("U_ID", review.get("id", ""))).strip() == normalized_user_id
        ]

    if container_key == "data":
        result = dict(payload)
        result["data"] = filtered
        return result

    return filtered


def _extract_api_error(payload, default_message):
    if isinstance(payload, dict):
        message = payload.get("message")
        if isinstance(message, str) and message.strip():
            return message.strip()

        detail = payload.get("detail")
        if isinstance(detail, str) and detail.strip():
            return detail.strip()

        error = payload.get("error")
        if isinstance(error, str) and error.strip():
            return error.strip()
        if isinstance(error, dict):
            error_message = error.get("message") or error.get("detail")
            if isinstance(error_message, str) and error_message.strip():
                return error_message.strip()

        errors = payload.get("errors")
        if isinstance(errors, list) and errors:
            first_error = errors[0]
            if isinstance(first_error, str) and first_error.strip():
                return first_error.strip()
            if isinstance(first_error, dict):
                error_message = first_error.get("message")
                if isinstance(error_message, str) and error_message.strip():
                    return error_message.strip()

                error_detail = first_error.get("detail")
                if isinstance(error_detail, str) and error_detail.strip():
                    return error_detail.strip()

                extensions = first_error.get("extensions")
                if isinstance(extensions, dict):
                    extension_message = extensions.get("message") or extensions.get("detail") or extensions.get("reason")
                    if isinstance(extension_message, str) and extension_message.strip():
                        return extension_message.strip()

                    field_name = extensions.get("field")
                    code = extensions.get("code")
                    if isinstance(field_name, str) and field_name.strip() and isinstance(code, str) and code.strip():
                        return f"{field_name.strip()}: {code.strip()}"

    return default_message


def _coerce_like_count(value):
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def _normalize_search_item_type(value):
    normalized_value = str(value or "").strip().lower()

    if normalized_value.startswith("song"):
        return "song"
    if normalized_value.startswith("album"):
        return "album"
    if normalized_value.startswith("artist"):
        return "artist"

    return normalized_value


def _resolve_media_url(value):
    media_url = str(value or "").strip()
    if not media_url:
        return None

    if media_url.startswith(("http://", "https://")):
        return media_url

    if media_url.startswith("/"):
        return f"{DIRECTUS_URL}{media_url}"

    return media_url
