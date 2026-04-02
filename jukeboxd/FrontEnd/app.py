import requests
from pathlib import Path
from flask import Flask, render_template, request, jsonify

BASE_DIR = Path(__file__).resolve().parent

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static"),
)

#robert change
DIRECTUS_URL = "http://64.23.156.15:8055"


@app.route("/")
def home():
    return render_template("index.html")

@app.route("/search")
def search():
    return render_template("search.html")

@app.route("/profile")
def profile():
    return render_template("profile.html")

@app.route("/add")
def add():
    return render_template("add.html")


@app.route("/stats")
def stats():
    return render_template("stats.html")

# TABLE ENDPOINTS
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

# SEARCH
@app.route("/api/search")
def api_search():
    q = request.args.get("q")
    r = requests.get(f"{DIRECTUS_URL}/search?q={q}")
    return jsonify(r.json())

# REVIEWS BY TYPE
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
    r = requests.get(f"{DIRECTUS_URL}/user_review/")
    return jsonify(r.json())

#Feed review endpoint
@app.route("/api/feed")
def feed():
    r = requests.get(f"{DIRECTUS_URL}/feed_review")
    return jsonify(r.json())

if __name__ == "__main__":
    app.run(debug=True)
