import requests
import bcrypt
from pathlib import Path
from flask import Flask, render_template, request, jsonify, session, redirect

BASE_DIR = Path(__file__).resolve().parent

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static"),
)

# IMPORTANT: Needed for sessions
app.secret_key = "super_secret_key_change_this"

DIRECTUS_URL = "http://64.23.156.15:8055"


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

        errors = payload.get("errors")
        if isinstance(errors, list) and errors:
            first_error = errors[0]
            if isinstance(first_error, dict):
                error_message = first_error.get("message")
                if isinstance(error_message, str) and error_message.strip():
                    return error_message.strip()

    return default_message


# -----------------------
# PAGE ROUTES
# -----------------------
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/search")
def search():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template("search.html")


@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect('/login')

    return render_template(
        'profile.html',
        user_id=session['user_id'],
        username=session['username']
    )


@app.route("/add")
def add():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template("add.html")


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/register")
def register():
    return render_template("register.html")


@app.route("/stats")
def stats():
    return render_template("stats.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")


# -----------------------
# TABLE ENDPOINTS
# -----------------------
@app.route("/api/artists")
def get_artists():
    r = requests.get(f"{DIRECTUS_URL}/items/ARTIST")
    return jsonify(r.json())


@app.route("/api/albums")
def get_albums():
    r = requests.get(f"{DIRECTUS_URL}/items/ALBUM")
    return jsonify(r.json())


@app.route("/api/users")
def get_users():
    r = requests.get(f"{DIRECTUS_URL}/items/USER")
    return jsonify(r.json())


@app.route("/api/reviews")
def get_reviews():
    r = requests.get(f"{DIRECTUS_URL}/items/REVIEW")
    return jsonify(r.json())


@app.route("/api/songs")
def get_songs():
    r = requests.get(f"{DIRECTUS_URL}/items/SONG")
    return jsonify(r.json())


# -----------------------
# SEARCH
# -----------------------
@app.route("/api/search")
def api_search():
    if 'user_id' not in session:
        return jsonify({"error": "login required"}), 401

    q = request.args.get("q")

    if not q:
        return jsonify([])

    try:
        r = requests.get(f"{DIRECTUS_URL}/search", params={"q": q})
        data = r.json()
        return jsonify(data)

    except Exception as e:
        print("Search error:", e)
        return jsonify([])


# -----------------------
# REVIEWS BY TYPE
# -----------------------
@app.route("/api/song_reviews")
def song_reviews():
    r = requests.get(f"{DIRECTUS_URL}/song_review/")
    return jsonify(r.json())


@app.route("/api/album_reviews")
def album_reviews():
    r = requests.get(f"{DIRECTUS_URL}/album_reviews/")
    return jsonify(r.json())


@app.route("/api/artist_reviews")
def artist_reviews():
    r = requests.get(f"{DIRECTUS_URL}/artist_review/")
    return jsonify(r.json())


@app.route("/api/user_reviews")
def user_reviews():
    username = request.args.get("username")
    user_id = request.args.get("user_id")
    if not username and "username" in session:
        username = session["username"]

    r = requests.get(f"{DIRECTUS_URL}/user_review/")
    return jsonify(_filter_user_reviews(r.json(), username=username, user_id=user_id))


# Feed review endpoint
@app.route("/api/feed")
def feed():
    r = requests.get(f"{DIRECTUS_URL}/feed_review")
    return jsonify(r.json())


# -----------------------
# ADD REVIEW
# -----------------------
@app.route("/api/add_review", methods=["POST"])
def add_review():
    if 'username' not in session:
        return jsonify({"status": "not logged in"}), 401

    data = request.json
    data["U_Username"] = session['username']

    r = requests.post(f"{DIRECTUS_URL}/items/REVIEW", json=data)
    return jsonify(r.json())


# -----------------------
# REGISTER USER
# -----------------------
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
        "U_PasswordHash": hashed,
        "U_Role": "user"
    }

    r = requests.post(f"{DIRECTUS_URL}/items/USER", json=user_data)
    result = r.json()

    # AUTO LOGIN AFTER REGISTER
    if r.status_code == 200 or r.status_code == 201:
        user_id = result["data"]["U_ID"]
        session['user_id'] = user_id
        session['username'] = username
        return jsonify({"success": True, "message": "Account created.", "data": result.get("data")}), r.status_code

    error_message = _extract_api_error(result, "Could not create account.")
    lowered_message = error_message.lower()

    if "u_username" in lowered_message or "username" in lowered_message:
        error_message = "That username is already taken or does not meet the 5-12 character requirement."
    elif "u_email" in lowered_message or "email" in lowered_message:
        error_message = "That email is already in use or invalid."

    return jsonify({"success": False, "message": error_message, "details": result}), r.status_code


# -----------------------
# LOGIN USER
# -----------------------
@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False})

    r = requests.get(
        f"{DIRECTUS_URL}/items/USER",
        params={"filter[U_Email][_eq]": email}
    )

    users = r.json().get("data", [])

    if not users:
        return jsonify({"success": False})

    user = users[0]
    stored_hash = user.get("U_PasswordHash")

    if not stored_hash:
        return jsonify({"success": False})

    if bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
        # STORE SESSION HERE
        session['user_id'] = user.get("U_ID")
        session['username'] = user.get("U_Username")

        return jsonify({
            "success": True,
            "user_id": user.get("U_ID"),
            "username": user.get("U_Username"),
            "email": user.get("U_Email")
        })

    return jsonify({"success": False})

@app.route("/api/user_reviews/<username>")
def get_user_reviews(username):
    r = requests.get(f"{DIRECTUS_URL}/user_review/")
    return jsonify(_filter_user_reviews(r.json(), username=username))



if __name__ == "__main__":
    app.run(debug=True)
