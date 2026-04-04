import requests
import bcrypt
from datetime import datetime
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


def _coerce_like_count(value):
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def _resolve_media_url(value):
    media_url = str(value or "").strip()
    if not media_url:
        return None

    if media_url.startswith(("http://", "https://")):
        return media_url

    if media_url.startswith("/"):
        return f"{DIRECTUS_URL}{media_url}"

    return media_url


def _build_review_enrichment(review_payload, song_payload, album_payload, artist_payload):
    review_rows, _ = _extract_payload_list(review_payload)
    song_rows, _ = _extract_payload_list(song_payload)
    album_rows, _ = _extract_payload_list(album_payload)
    artist_rows, _ = _extract_payload_list(artist_payload)

    song_album_map = {}
    for song in song_rows:
        song_id = song.get("S_ID") or song.get("id")
        if song_id is None:
            continue
        song_album_map[str(song_id)] = song.get("AL_ID")

    album_map = {}
    for album in album_rows:
        album_id = album.get("AL_ID") or album.get("id")
        if album_id is None:
            continue
        album_map[str(album_id)] = album

    artist_map = {}
    for artist in artist_rows:
        artist_id = artist.get("ART_ID") or artist.get("id")
        if artist_id is None:
            continue
        artist_map[str(artist_id)] = artist

    review_enrichment = {}
    for review in review_rows:
        review_id = review.get("R_ID") or review.get("review_id")
        if review_id is None:
            continue

        album_id = review.get("AL_ID")
        song_id = review.get("S_ID")
        artist_id = review.get("ART_ID")

        if not album_id and song_id is not None:
            album_id = song_album_map.get(str(song_id))

        album = album_map.get(str(album_id), {}) if album_id is not None else {}
        artist = artist_map.get(str(artist_id), {}) if artist_id is not None else {}

        review_enrichment[str(review_id)] = {
            "num_likes": _coerce_like_count(review.get("R_NumOfLikes")),
            "artwork_url": _resolve_media_url(album.get("AL_Image")) or _resolve_media_url(artist.get("ART_Image")),
            "artwork_alt": album.get("AL_Name") or artist.get("ART_Name")
        }

    return review_enrichment


def _normalize_feed_payload(feed_payload, review_payload, song_payload, album_payload, artist_payload):
    feed_rows, container_key = _extract_payload_list(feed_payload)
    review_enrichment = _build_review_enrichment(
        review_payload,
        song_payload,
        album_payload,
        artist_payload
    )

    normalized_rows = []
    for row in feed_rows:
        review_id = row.get("review_id") or row.get("R_ID")
        normalized_row = dict(row)

        if review_id is not None:
            enrichment = review_enrichment.get(str(review_id), {})
            normalized_row["review_id"] = review_id
            normalized_row["num_likes"] = enrichment.get(
                "num_likes",
                _coerce_like_count(
                    row.get("num_likes", row.get("review_num_likes", row.get("R_NumOfLikes")))
                )
            )
            normalized_row["artwork_url"] = enrichment.get("artwork_url")
            normalized_row["artwork_alt"] = enrichment.get("artwork_alt") or row.get("title")
        else:
            normalized_row["num_likes"] = _coerce_like_count(
                row.get("num_likes", row.get("review_num_likes", row.get("R_NumOfLikes")))
            )
            normalized_row["artwork_url"] = None
            normalized_row["artwork_alt"] = row.get("title")

        normalized_rows.append(normalized_row)

    if container_key == "data":
        result = dict(feed_payload)
        result["data"] = normalized_rows
        return result

    return normalized_rows


def _normalize_user_feed_payload(user_payload, normalized_feed_payload):
    user_rows, container_key = _extract_payload_list(user_payload)
    feed_rows, _ = _extract_payload_list(normalized_feed_payload)

    user_review_map = {}
    for review in user_rows:
        review_id = review.get("R_ID") or review.get("review_id")
        if review_id is None:
            continue
        user_review_map[str(review_id)] = review

    normalized_rows = []
    for row in feed_rows:
        review_id = row.get("review_id") or row.get("R_ID")
        matched_user_review = user_review_map.get(str(review_id))
        if not matched_user_review:
            continue

        normalized_row = dict(row)
        normalized_row["review_id"] = review_id
        normalized_row["username"] = matched_user_review.get("U_Username", row.get("username"))
        normalized_row["U_Username"] = matched_user_review.get("U_Username")
        normalized_row["U_ID"] = matched_user_review.get("U_ID", matched_user_review.get("id"))
        normalized_row["review_text"] = row.get("review_text", matched_user_review.get("R_Text", ""))
        normalized_row["review_rating"] = row.get("review_rating", matched_user_review.get("R_Rating", ""))
        normalized_row["time_created"] = row.get("time_created", matched_user_review.get("R_TimeCreated"))
        normalized_row["num_likes"] = _coerce_like_count(
            row.get("num_likes", matched_user_review.get("R_NumOfLikes"))
        )
        normalized_rows.append(normalized_row)

    normalized_rows.sort(
        key=lambda review: str(review.get("time_created") or ""),
        reverse=True
    )

    if container_key == "data":
        result = dict(user_payload)
        result["data"] = normalized_rows
        return result

    return normalized_rows


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


@app.route("/api/reviews/<int:review_id>/like", methods=["POST", "DELETE"])
def like_review(review_id):
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Please log in to like reviews."}), 401

    review_response = requests.get(f"{DIRECTUS_URL}/items/REVIEW/{review_id}")

    if review_response.status_code != 200:
        review_error = review_response.json()
        return jsonify({
            "success": False,
            "message": _extract_api_error(review_error, "Could not find that review.")
        }), review_response.status_code

    review_data = review_response.json().get("data", {})
    current_like_count = _coerce_like_count(review_data.get("R_NumOfLikes"))
    like_delta = 1 if request.method == "POST" else -1
    updated_like_count = max(0, current_like_count + like_delta)

    update_response = requests.patch(
        f"{DIRECTUS_URL}/items/REVIEW/{review_id}",
        json={"R_NumOfLikes": updated_like_count}
    )
    update_result = update_response.json()

    if update_response.status_code not in (200, 201):
        return jsonify({
            "success": False,
            "message": _extract_api_error(update_result, "Could not update likes right now.")
        }), update_response.status_code

    return jsonify({
        "success": True,
        "review_id": review_id,
        "likes": updated_like_count,
        "liked": request.method == "POST"
    })


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

    user_review_response = requests.get(f"{DIRECTUS_URL}/user_review/")
    filtered_user_reviews = _filter_user_reviews(
        user_review_response.json(),
        username=username,
        user_id=user_id
    )
    feed_response = requests.get(f"{DIRECTUS_URL}/feed_review")
    review_response = requests.get(
        f"{DIRECTUS_URL}/items/REVIEW",
        params={"fields": "R_ID,R_NumOfLikes,S_ID,AL_ID,ART_ID"}
    )
    song_response = requests.get(
        f"{DIRECTUS_URL}/items/SONG",
        params={"fields": "S_ID,AL_ID"}
    )
    album_response = requests.get(
        f"{DIRECTUS_URL}/items/ALBUM",
        params={"fields": "AL_ID,AL_Name,AL_Image"}
    )
    artist_response = requests.get(
        f"{DIRECTUS_URL}/items/ARTIST",
        params={"fields": "ART_ID,ART_Name,ART_Image"}
    )
    normalized_feed_payload = _normalize_feed_payload(
        feed_response.json(),
        review_response.json(),
        song_response.json(),
        album_response.json(),
        artist_response.json()
    )

    return jsonify(_normalize_user_feed_payload(
        filtered_user_reviews,
        normalized_feed_payload
    ))


# Feed review endpoint
@app.route("/api/feed")
def feed():
    feed_response = requests.get(f"{DIRECTUS_URL}/feed_review")
    review_response = requests.get(
        f"{DIRECTUS_URL}/items/REVIEW",
        params={"fields": "R_ID,R_NumOfLikes,S_ID,AL_ID,ART_ID"}
    )
    song_response = requests.get(
        f"{DIRECTUS_URL}/items/SONG",
        params={"fields": "S_ID,AL_ID"}
    )
    album_response = requests.get(
        f"{DIRECTUS_URL}/items/ALBUM",
        params={"fields": "AL_ID,AL_Name,AL_Image"}
    )
    artist_response = requests.get(
        f"{DIRECTUS_URL}/items/ARTIST",
        params={"fields": "ART_ID,ART_Name,ART_Image"}
    )

    return jsonify(_normalize_feed_payload(
        feed_response.json(),
        review_response.json(),
        song_response.json(),
        album_response.json(),
        artist_response.json()
    ))


# -----------------------
# ADD REVIEW
# -----------------------
@app.route("/api/add_review", methods=["POST"])
def add_review():
    if 'username' not in session:
        return jsonify({"status": "not logged in"}), 401

    data = request.json
    data["U_Username"] = session['username']
    data.setdefault("R_NumOfLikes", 0)

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
        "U_DateCreated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
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
    user_review_response = requests.get(f"{DIRECTUS_URL}/user_review/")
    filtered_user_reviews = _filter_user_reviews(user_review_response.json(), username=username)
    feed_response = requests.get(f"{DIRECTUS_URL}/feed_review")
    review_response = requests.get(
        f"{DIRECTUS_URL}/items/REVIEW",
        params={"fields": "R_ID,R_NumOfLikes,S_ID,AL_ID,ART_ID"}
    )
    song_response = requests.get(
        f"{DIRECTUS_URL}/items/SONG",
        params={"fields": "S_ID,AL_ID"}
    )
    album_response = requests.get(
        f"{DIRECTUS_URL}/items/ALBUM",
        params={"fields": "AL_ID,AL_Name,AL_Image"}
    )
    artist_response = requests.get(
        f"{DIRECTUS_URL}/items/ARTIST",
        params={"fields": "ART_ID,ART_Name,ART_Image"}
    )
    normalized_feed_payload = _normalize_feed_payload(
        feed_response.json(),
        review_response.json(),
        song_response.json(),
        album_response.json(),
        artist_response.json()
    )

    return jsonify(_normalize_user_feed_payload(
        filtered_user_reviews,
        normalized_feed_payload
    ))



if __name__ == "__main__":
    app.run(debug=True)
