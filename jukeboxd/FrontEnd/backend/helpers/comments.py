from datetime import datetime

import requests

from backend.config import (
    COMMENT_TEXT_LIMIT,
    DIRECTUS_COMMENT_COLLECTION,
    DIRECTUS_COMMENT_FIELDS,
    DIRECTUS_URL,
)
from backend.helpers.common import _extract_api_error, _extract_payload_list
from backend.helpers.input_sanitization import _sanitize_comment_text, _sanitize_existing_username


def _safe_json(response):
    try:
        return response.json()
    except ValueError:
        return {}


def _extract_comment_review_id(row):
    value = row.get("review_id") or row.get("R_ID")
    if isinstance(value, dict):
        return value.get("R_ID") or value.get("review_id") or value.get("id")
    return value


def _extract_comment_username(row):
    value = row.get("username") or row.get("U_Username")
    if isinstance(value, dict):
        return value.get("U_Username") or value.get("username") or value.get("id")
    return value


def _normalize_comment_item(row):
    return {
        "comment_id": row.get("comment_id") or row.get("C_ID") or row.get("id"),
        "review_id": _extract_comment_review_id(row),
        "username": str(_extract_comment_username(row) or "user").strip() or "user",
        "comment_text": str(row.get("comment_text") or row.get("C_Text") or "").strip(),
        "time_created": str(
            row.get("time_created")
            or row.get("C_TimeCreated")
            or row.get("date_created")
            or ""
        ).strip(),
    }


def _comment_sort_key(comment):
    time_created = str(comment.get("time_created") or "")

    try:
        comment_id = int(comment.get("comment_id") or 0)
    except (TypeError, ValueError):
        comment_id = 0

    return (time_created, comment_id)


def _sort_comments(comments):
    return sorted(comments, key=_comment_sort_key, reverse=True)


def _fetch_comment_items(raise_on_error=False):
    response = requests.get(
        f"{DIRECTUS_URL}/items/{DIRECTUS_COMMENT_COLLECTION}",
        params={
            "fields": DIRECTUS_COMMENT_FIELDS,
            "limit": -1,
            "sort": "-C_TimeCreated,-C_ID",
        }
    )
    payload = _safe_json(response)

    if response.status_code != 200:
        if raise_on_error:
            raise RuntimeError(
                _extract_api_error(payload, "Could not load comments from Directus.")
            )
        return []

    rows, _ = _extract_payload_list(payload)
    return [
        normalized_comment
        for normalized_comment in (
            _normalize_comment_item(row) for row in rows
        )
        if normalized_comment["comment_text"]
    ]


def _get_review_comments(review_id, limit=None, raise_on_error=False):
    normalized_review_id = int(review_id)
    matching_comments = [
        comment
        for comment in _fetch_comment_items(raise_on_error=raise_on_error)
        if str(comment.get("review_id")) == str(normalized_review_id)
    ]
    sorted_comments = _sort_comments(matching_comments)

    if isinstance(limit, int) and limit > 0:
        return sorted_comments[:limit]

    return sorted_comments


def _add_review_comment(review_id, username, _user_id, comment_text):
    normalized_text = _sanitize_comment_text(comment_text)
    normalized_review_id = int(review_id)
    normalized_username = _sanitize_existing_username(username)

    payload = {
        "R_ID": normalized_review_id,
        "U_Username": normalized_username,
        "C_Text": normalized_text,
        "C_TimeCreated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    response = requests.post(
        f"{DIRECTUS_URL}/items/{DIRECTUS_COMMENT_COLLECTION}",
        json=payload
    )
    result = _safe_json(response)

    if response.status_code not in (200, 201):
        raise RuntimeError(
            _extract_api_error(result, "Could not save comment to Directus.")
        )

    data = result.get("data") if isinstance(result, dict) else {}
    return _normalize_comment_item(data or payload)


def _get_comment_summary_map(review_ids, preview_limit=3):
    normalized_ids = []
    for review_id in review_ids:
        if review_id is None:
            continue

        try:
            normalized_ids.append(int(review_id))
        except (TypeError, ValueError):
            continue

    if not normalized_ids:
        return {}

    summary_map = {
        str(review_id): {
            "comments_preview": [],
            "comment_count": 0
        }
        for review_id in sorted(set(normalized_ids))
    }

    for comment in _sort_comments(_fetch_comment_items(raise_on_error=False)):
        review_key = str(comment.get("review_id"))
        if review_key not in summary_map:
            continue

        summary = summary_map[review_key]
        summary["comment_count"] += 1

        if len(summary["comments_preview"]) < preview_limit:
            summary["comments_preview"].append(comment)

    return summary_map


def _attach_comment_summaries(payload, preview_limit=3):
    rows, container_key = _extract_payload_list(payload)
    review_ids = [
        row.get("review_id") or row.get("R_ID") or row.get("id")
        for row in rows
    ]
    summary_map = _get_comment_summary_map(review_ids, preview_limit=preview_limit)

    normalized_rows = []
    for row in rows:
        review_id = row.get("review_id") or row.get("R_ID") or row.get("id")
        summary = summary_map.get(str(review_id), {
            "comments_preview": [],
            "comment_count": 0
        })
        normalized_row = dict(row)
        normalized_row["comments_preview"] = summary["comments_preview"]
        normalized_row["comment_count"] = summary["comment_count"]
        normalized_rows.append(normalized_row)

    if container_key == "data":
        result = dict(payload)
        result["data"] = normalized_rows
        return result

    return normalized_rows
