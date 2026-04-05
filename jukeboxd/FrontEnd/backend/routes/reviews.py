import requests
from flask import jsonify, request, session

from backend.config import COMMENT_TEXT_LIMIT, DIRECTUS_URL
from backend.helpers.comments import (
    _add_review_comment,
    _attach_comment_summaries,
    _get_comment_summary_map,
    _get_review_comments,
)
from backend.helpers.common import (
    _coerce_like_count,
    _extract_api_error,
    _extract_payload_list,
    _filter_user_reviews,
    _normalize_search_item_type,
)
from backend.helpers.payloads import (
    _fetch_review_reference_payloads,
    _fetch_review_view_payloads,
    _fetch_search_reference_payloads,
)
from backend.helpers.review_normalization import (
    _filter_normalized_reviews,
    _normalize_feed_payload,
    _normalize_review_records,
    _normalize_search_results,
    _normalize_user_profile_reviews,
)


def _get_normalized_reviews():
    review_payload, song_payload, album_payload, artist_payload, makes_song_payload, makes_album_payload = _fetch_review_reference_payloads()
    return _normalize_review_records(
        review_payload,
        song_payload,
        album_payload,
        artist_payload,
        makes_song_payload,
        makes_album_payload
    )


def _get_normalized_profile_reviews(filtered_user_reviews):
    review_payload, song_payload, album_payload, artist_payload, makes_song_payload, makes_album_payload = _fetch_review_reference_payloads()
    song_review_payload, album_review_payload, artist_review_payload = _fetch_review_view_payloads()

    return _normalize_user_profile_reviews(
        filtered_user_reviews,
        review_payload,
        song_payload,
        album_payload,
        artist_payload,
        makes_song_payload,
        makes_album_payload,
        song_review_payload,
        album_review_payload,
        artist_review_payload
    )


def register_review_routes(app):
    @app.route("/api/reviews/<int:review_id>/comments", methods=["GET", "POST"])
    def review_comments(review_id):
        if request.method == "GET":
            try:
                comments = _get_review_comments(review_id, raise_on_error=True)
            except RuntimeError as error:
                return jsonify({
                    "success": False,
                    "message": str(error)
                }), 502

            return jsonify({
                "success": True,
                "data": comments,
                "total": len(comments)
            })

        if "user_id" not in session:
            return jsonify({"success": False, "message": "Please log in to comment."}), 401

        review_response = requests.get(f"{DIRECTUS_URL}/items/REVIEW/{review_id}")
        if review_response.status_code != 200:
            review_error = review_response.json()
            return jsonify({
                "success": False,
                "message": _extract_api_error(review_error, "Could not find that review.")
            }), review_response.status_code

        data = request.get_json(silent=True) or {}
        comment_text = (data.get("commentText") or "").strip()

        if not comment_text:
            return jsonify({"success": False, "message": "Please write a comment."}), 400

        if len(comment_text) > COMMENT_TEXT_LIMIT:
            return jsonify({
                "success": False,
                "message": f"Comments must be {COMMENT_TEXT_LIMIT} characters or fewer."
            }), 400

        try:
            comment = _add_review_comment(
                review_id,
                session.get("username"),
                session.get("user_id"),
                comment_text
            )
        except ValueError as error:
            return jsonify({"success": False, "message": str(error)}), 400
        except RuntimeError as error:
            return jsonify({"success": False, "message": str(error)}), 502

        summary = _get_comment_summary_map([review_id]).get(str(review_id), {
            "comments_preview": [],
            "comment_count": 0
        })

        return jsonify({
            "success": True,
            "message": "Comment added.",
            "data": comment,
            "comments_preview": summary["comments_preview"],
            "comment_count": summary["comment_count"]
        }), 201

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

    @app.route("/api/search")
    def api_search():
        if "user_id" not in session:
            return jsonify({"error": "login required"}), 401

        query = request.args.get("q")

        if not query:
            return jsonify([])

        try:
            response = requests.get(f"{DIRECTUS_URL}/search", params={"q": query})
            search_payload = response.json()
            song_payload, album_payload, artist_payload, makes_song_payload, makes_album_payload = _fetch_search_reference_payloads()
            return jsonify(_normalize_search_results(
                search_payload,
                song_payload,
                album_payload,
                artist_payload,
                makes_song_payload,
                makes_album_payload
            ))
        except Exception as error:
            print("Search error:", error)
            return jsonify([])

    @app.route("/api/search_related_reviews")
    def search_related_reviews():
        if "user_id" not in session:
            return jsonify({"error": "login required"}), 401

        item_type = _normalize_search_item_type(request.args.get("type"))
        item_id = str(request.args.get("id") or "").strip()
        limit = request.args.get("limit", default=4, type=int)
        limit = max(1, min(limit or 4, 12))

        item_key_map = {
            "song": "S_ID",
            "album": "AL_ID",
            "artist": "ART_ID",
        }
        item_key = item_key_map.get(item_type)

        if not item_key or not item_id:
            return jsonify({
                "data": [],
                "total": 0,
                "message": "A valid item type and id are required."
            }), 400

        normalized_reviews = _get_normalized_reviews()
        review_rows, _ = _extract_payload_list(normalized_reviews)

        matching_reviews = [
            review for review in review_rows
            if _normalize_search_item_type(review.get("review_type")) == item_type
            and str(review.get(item_key, "")).strip() == item_id
        ]
        matching_reviews.sort(
            key=lambda review: (
                _coerce_like_count(review.get("num_likes")),
                str(review.get("time_created") or "")
            ),
            reverse=True
        )

        rated_values = []
        for review in matching_reviews:
            raw_rating = review.get("review_rating")

            try:
                numeric_rating = float(raw_rating)
            except (TypeError, ValueError):
                continue

            if numeric_rating != numeric_rating:
                continue

            rated_values.append(numeric_rating)

        average_rating = None
        if rated_values:
            average_rating = round(sum(rated_values) / len(rated_values), 1)

        return jsonify({
            "data": _attach_comment_summaries(matching_reviews[:limit]),
            "total": len(matching_reviews),
            "average_rating": average_rating,
            "rated_total": len(rated_values),
            "item_type": item_type,
            "item_id": item_id
        })

    @app.route("/api/song_reviews")
    def song_reviews():
        filtered_reviews = _filter_normalized_reviews(_get_normalized_reviews(), review_type="song")
        return jsonify(_attach_comment_summaries(filtered_reviews))

    @app.route("/api/album_reviews")
    def album_reviews():
        filtered_reviews = _filter_normalized_reviews(_get_normalized_reviews(), review_type="album")
        return jsonify(_attach_comment_summaries(filtered_reviews))

    @app.route("/api/artist_reviews")
    def artist_reviews():
        filtered_reviews = _filter_normalized_reviews(_get_normalized_reviews(), review_type="artist")
        return jsonify(_attach_comment_summaries(filtered_reviews))

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
        return jsonify(_attach_comment_summaries(_get_normalized_profile_reviews(filtered_user_reviews)))

    @app.route("/api/feed")
    def feed():
        feed_response = requests.get(f"{DIRECTUS_URL}/feed_review")
        review_response, song_response, album_response, artist_response, makes_song_response, makes_album_response = _fetch_review_reference_payloads()

        normalized_feed = _normalize_feed_payload(
            feed_response.json(),
            review_response,
            song_response,
            album_response,
            artist_response,
            makes_song_response,
            makes_album_response
        )

        return jsonify(_attach_comment_summaries(normalized_feed))

    @app.route("/api/add_review", methods=["POST"])
    def add_review():
        if "username" not in session:
            return jsonify({"status": "not logged in"}), 401

        data = request.json
        data["U_Username"] = session["username"]
        data.setdefault("R_NumOfLikes", 0)

        response = requests.post(f"{DIRECTUS_URL}/items/REVIEW", json=data)
        return jsonify(response.json())

    @app.route("/api/user_reviews/<username>")
    def get_user_reviews(username):
        user_review_response = requests.get(f"{DIRECTUS_URL}/user_review/")
        filtered_user_reviews = _filter_user_reviews(user_review_response.json(), username=username)
        return jsonify(_attach_comment_summaries(_get_normalized_profile_reviews(filtered_user_reviews)))
