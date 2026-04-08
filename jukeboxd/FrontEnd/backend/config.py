import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR.parent.parent / ".env"


def _load_env_file(env_file):
    if not env_file.exists():
        return

    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()

        if not key:
            continue

        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]

        os.environ.setdefault(key, value)


def _require_env(name):
    value = os.getenv(name)
    if value:
        return value

    raise RuntimeError(
        f"Missing required environment variable '{name}'. "
        f"Create {ENV_FILE} from .env.example before starting the app."
    )


_load_env_file(ENV_FILE)

SECRET_KEY = _require_env("FLASK_SECRET_KEY")
DIRECTUS_URL = _require_env("DIRECTUS_URL").rstrip("/")
NAME_TEXT_LIMIT = 40
EMAIL_TEXT_LIMIT = 120
USERNAME_MIN_LENGTH = 5
USERNAME_MAX_LENGTH = 12
REVIEW_TEXT_LIMIT = 300
COMMENT_TEXT_LIMIT = 280
DIRECTUS_COMMENT_COLLECTION = "COMMENT"
DIRECTUS_COMMENT_FIELDS = "C_ID,C_Text,C_TimeCreated,R_ID,U_Username"
