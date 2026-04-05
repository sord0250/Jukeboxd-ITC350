import html
import re
from datetime import datetime
from html.parser import HTMLParser

from backend.config import (
    COMMENT_TEXT_LIMIT,
    EMAIL_TEXT_LIMIT,
    NAME_TEXT_LIMIT,
    REVIEW_TEXT_LIMIT,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
)


_USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_]+$")
_EMAIL_PATTERN = re.compile(
    r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$"
)
_INLINE_WHITESPACE_PATTERN = re.compile(r"[^\S\n]+")


class _PlainTextSanitizer(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self._parts = []
        self._ignored_tag_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag.lower() in {"script", "style"}:
            self._ignored_tag_depth += 1

    def handle_endtag(self, tag):
        if tag.lower() in {"script", "style"} and self._ignored_tag_depth > 0:
            self._ignored_tag_depth -= 1

    def handle_data(self, data):
        if self._ignored_tag_depth == 0:
            self._parts.append(data)

    def get_text(self):
        return "".join(self._parts)


def _strip_html_markup(value):
    parser = _PlainTextSanitizer()
    parser.feed(html.unescape(str(value or "")))
    parser.close()
    return parser.get_text()


def _strip_control_characters(value, allow_newlines=False):
    characters = []

    for character in str(value or ""):
        codepoint = ord(character)

        if character == "\n" and allow_newlines:
            characters.append(character)
            continue

        if character in {"\t", "\f", "\v"}:
            characters.append(" ")
            continue

        if codepoint < 32 or codepoint == 127:
            continue

        characters.append(character)

    return "".join(characters)


def _normalize_text_whitespace(value, allow_newlines=False):
    normalized_value = str(value or "").replace("\r\n", "\n").replace("\r", "\n")

    if not allow_newlines:
        return " ".join(normalized_value.split())

    lines = []
    previous_line_blank = False

    for line in normalized_value.split("\n"):
        normalized_line = _INLINE_WHITESPACE_PATTERN.sub(" ", line).strip()

        if not normalized_line:
            if lines and not previous_line_blank:
                lines.append("")
            previous_line_blank = True
            continue

        lines.append(normalized_line)
        previous_line_blank = False

    return "\n".join(lines).strip()


def _sanitize_plain_text(value, *, field_name, max_length, allow_newlines=False):
    sanitized_value = _strip_html_markup(value)
    sanitized_value = _strip_control_characters(sanitized_value, allow_newlines=allow_newlines)
    sanitized_value = _normalize_text_whitespace(sanitized_value, allow_newlines=allow_newlines)

    if len(sanitized_value) > max_length:
        raise ValueError(f"{field_name} must be {max_length} characters or fewer.")

    return sanitized_value


def _sanitize_name(value, field_name):
    sanitized_value = _sanitize_plain_text(
        value,
        field_name=field_name,
        max_length=NAME_TEXT_LIMIT,
        allow_newlines=False
    )

    if not sanitized_value:
        raise ValueError(f"{field_name} is required.")

    return sanitized_value


def _sanitize_username(value, field_name="Username"):
    sanitized_value = _sanitize_plain_text(
        value,
        field_name=field_name,
        max_length=USERNAME_MAX_LENGTH,
        allow_newlines=False
    )

    if not sanitized_value:
        raise ValueError(f"{field_name} is required.")

    if len(sanitized_value) < USERNAME_MIN_LENGTH or len(sanitized_value) > USERNAME_MAX_LENGTH:
        raise ValueError(
            f"{field_name} must be {USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters."
        )

    if not _USERNAME_PATTERN.fullmatch(sanitized_value):
        raise ValueError(f"{field_name} may only contain letters, numbers, and underscores.")

    return sanitized_value


def _sanitize_email(value):
    sanitized_value = _strip_control_characters(value, allow_newlines=False).strip().lower()

    if not sanitized_value:
        raise ValueError("Email is required.")

    if len(sanitized_value) > EMAIL_TEXT_LIMIT:
        raise ValueError(f"Email must be {EMAIL_TEXT_LIMIT} characters or fewer.")

    if any(character.isspace() for character in sanitized_value):
        raise ValueError("Please enter a valid email address.")

    if not _EMAIL_PATTERN.fullmatch(sanitized_value):
        raise ValueError("Please enter a valid email address.")

    return sanitized_value


def _sanitize_password(value):
    sanitized_value = _strip_control_characters(value, allow_newlines=False)

    if not sanitized_value:
        raise ValueError("Password is required.")

    if len(sanitized_value) > 128:
        raise ValueError("Password must be 128 characters or fewer.")

    return sanitized_value


def _sanitize_comment_text(value):
    sanitized_value = _sanitize_plain_text(
        value,
        field_name="Comment text",
        max_length=COMMENT_TEXT_LIMIT,
        allow_newlines=True
    )

    if not sanitized_value:
        raise ValueError("Please write a comment.")

    return sanitized_value


def _sanitize_review_text(value):
    sanitized_value = _sanitize_plain_text(
        value,
        field_name="Review text",
        max_length=REVIEW_TEXT_LIMIT,
        allow_newlines=True
    )

    if not sanitized_value:
        raise ValueError("Please write a review.")

    return sanitized_value


def _sanitize_review_rating(value):
    try:
        rating = int(value)
    except (TypeError, ValueError):
        raise ValueError("Please select a rating.") from None

    if rating < 1 or rating > 5:
        raise ValueError("Review rating must be between 1 and 5.")

    return rating


def _sanitize_positive_int(value, field_name):
    try:
        normalized_value = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} is invalid.") from None

    if normalized_value <= 0:
        raise ValueError(f"{field_name} is invalid.")

    return normalized_value


def _build_sanitized_review_payload(data, username, user_id):
    sanitized_username = _sanitize_username(username)
    sanitized_user_id = _sanitize_positive_int(user_id, "User")
    sanitized_review_text = _sanitize_review_text((data or {}).get("R_Text"))
    sanitized_review_rating = _sanitize_review_rating((data or {}).get("R_Rating"))

    target_fields = {
        "S_ID": (data or {}).get("S_ID"),
        "AL_ID": (data or {}).get("AL_ID"),
        "ART_ID": (data or {}).get("ART_ID"),
    }
    selected_targets = [
        field_name
        for field_name, field_value in target_fields.items()
        if field_value not in (None, "")
    ]

    if len(selected_targets) != 1:
        raise ValueError("Please select exactly one song, album, or artist to review.")

    selected_field = selected_targets[0]

    return {
        "R_Text": sanitized_review_text,
        "R_Rating": sanitized_review_rating,
        "R_NumOfLikes": 0,
        "U_ID": sanitized_user_id,
        "U_Username": sanitized_username,
        "R_TimeCreated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        selected_field: _sanitize_positive_int(
            target_fields[selected_field],
            selected_field.replace("_", " ")
        ),
    }
