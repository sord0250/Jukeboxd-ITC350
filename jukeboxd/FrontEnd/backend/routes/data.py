import requests
from flask import jsonify

from backend.config import DIRECTUS_URL


def register_data_routes(app):
    @app.route("/api/artists")
    def get_artists():
        response = requests.get(f"{DIRECTUS_URL}/items/ARTIST")
        return jsonify(response.json())

    @app.route("/api/albums")
    def get_albums():
        response = requests.get(f"{DIRECTUS_URL}/items/ALBUM")
        return jsonify(response.json())

    @app.route("/api/users")
    def get_users():
        response = requests.get(f"{DIRECTUS_URL}/items/USER")
        return jsonify(response.json())

    @app.route("/api/reviews")
    def get_reviews():
        response = requests.get(f"{DIRECTUS_URL}/items/REVIEW")
        return jsonify(response.json())

    @app.route("/api/songs")
    def get_songs():
        response = requests.get(f"{DIRECTUS_URL}/items/SONG")
        return jsonify(response.json())
