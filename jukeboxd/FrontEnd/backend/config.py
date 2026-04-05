from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = "super_secret_key_change_this"
DIRECTUS_URL = "http://64.23.156.15:8055"
COMMENT_TEXT_LIMIT = 280
DIRECTUS_COMMENT_COLLECTION = "COMMENT"
DIRECTUS_COMMENT_FIELDS = "C_ID,C_Text,C_TimeCreated,R_ID,U_Username"
