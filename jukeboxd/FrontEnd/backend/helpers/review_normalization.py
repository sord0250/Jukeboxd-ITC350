from backend.helpers.common import (
    _coerce_like_count,
    _extract_payload_list,
    _normalize_search_item_type,
    _resolve_media_url,
)


def _build_artist_name_maps(
    song_payload,
    album_payload,
    artist_payload,
    makes_song_payload,
    makes_album_payload,
    review_payload=None
):
    song_rows, _ = _extract_payload_list(song_payload)
    artist_rows, _ = _extract_payload_list(artist_payload)
    makes_song_rows, _ = _extract_payload_list(makes_song_payload)
    makes_album_rows, _ = _extract_payload_list(makes_album_payload)
    review_rows, _ = _extract_payload_list(review_payload)

    artist_name_lookup = {}
    for artist in artist_rows:
        artist_id = artist.get("ART_ID") or artist.get("id")
        if artist_id is None:
            continue
        artist_name_lookup[str(artist_id)] = artist.get("ART_Name")

    song_album_map = {}
    for song in song_rows:
        song_id = song.get("S_ID") or song.get("id")
        if song_id is None:
            continue
        song_album_map[str(song_id)] = song.get("AL_ID")

    album_artist_names_map = {}
    for row in makes_album_rows:
        album_id = row.get("AL_ID")
        artist_id = row.get("ART_ID")
        if album_id is None or artist_id is None:
            continue
        artist_name = artist_name_lookup.get(str(artist_id))
        if not artist_name:
            continue
        album_artist_names_map.setdefault(str(album_id), [])
        if artist_name not in album_artist_names_map[str(album_id)]:
            album_artist_names_map[str(album_id)].append(artist_name)

    song_artist_names_map = {}
    for row in makes_song_rows:
        song_id = row.get("S_ID")
        artist_id = row.get("ART_ID")
        if song_id is None or artist_id is None:
            continue
        artist_name = artist_name_lookup.get(str(artist_id))
        if not artist_name:
            continue
        song_artist_names_map.setdefault(str(song_id), [])
        if artist_name not in song_artist_names_map[str(song_id)]:
            song_artist_names_map[str(song_id)].append(artist_name)

    for review in review_rows:
        artist_id = review.get("ART_ID")
        artist_name = artist_name_lookup.get(str(artist_id))
        if not artist_name:
            continue

        album_id = review.get("AL_ID")
        if album_id is not None:
            album_artist_names_map.setdefault(str(album_id), [])
            if artist_name not in album_artist_names_map[str(album_id)]:
                album_artist_names_map[str(album_id)].append(artist_name)

        song_id = review.get("S_ID")
        if song_id is not None:
            song_artist_names_map.setdefault(str(song_id), [])
            if artist_name not in song_artist_names_map[str(song_id)]:
                song_artist_names_map[str(song_id)].append(artist_name)

    for song_id, album_id in song_album_map.items():
        if song_artist_names_map.get(song_id):
            continue
        if album_id is None:
            continue
        album_artist_names = album_artist_names_map.get(str(album_id), [])
        if album_artist_names:
            song_artist_names_map[song_id] = list(album_artist_names)

    return (
        {
            song_id: ", ".join(names)
            for song_id, names in song_artist_names_map.items()
            if names
        },
        {
            album_id: ", ".join(names)
            for album_id, names in album_artist_names_map.items()
            if names
        }
    )


def _resolve_artist_names(
    song_id,
    album_id,
    artist_id,
    song_artist_names_map,
    album_artist_names_map,
    artist_map
):
    artist_names = None

    if song_id is not None:
        artist_names = song_artist_names_map.get(str(song_id))

    if not artist_names and album_id is not None:
        artist_names = album_artist_names_map.get(str(album_id))

    if not artist_names and artist_id is not None:
        matched_artist = artist_map.get(str(artist_id), {})
        artist_names = matched_artist.get("ART_Name")

    return artist_names


def _build_review_enrichment(
    review_payload,
    song_payload,
    album_payload,
    artist_payload,
    makes_song_payload,
    makes_album_payload
):
    review_rows, _ = _extract_payload_list(review_payload)
    song_rows, _ = _extract_payload_list(song_payload)
    album_rows, _ = _extract_payload_list(album_payload)
    artist_rows, _ = _extract_payload_list(artist_payload)
    song_artist_names_map, album_artist_names_map = _build_artist_name_maps(
        song_payload,
        album_payload,
        artist_payload,
        makes_song_payload,
        makes_album_payload,
        review_payload
    )
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
            "artwork_alt": album.get("AL_Name") or artist.get("ART_Name"),
            "artist_names": _resolve_artist_names(
                song_id,
                album_id,
                artist_id,
                song_artist_names_map,
                album_artist_names_map,
                artist_map
            )
        }

    return review_enrichment


def _normalize_feed_payload(
    feed_payload,
    review_payload,
    song_payload,
    album_payload,
    artist_payload,
    makes_song_payload,
    makes_album_payload
):
    feed_rows, container_key = _extract_payload_list(feed_payload)
    review_enrichment = _build_review_enrichment(
        review_payload,
        song_payload,
        album_payload,
        artist_payload,
        makes_song_payload,
        makes_album_payload
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
            normalized_row["artist_names"] = enrichment.get("artist_names")
        else:
            normalized_row["num_likes"] = _coerce_like_count(
                row.get("num_likes", row.get("review_num_likes", row.get("R_NumOfLikes")))
            )
            normalized_row["artwork_url"] = None
            normalized_row["artwork_alt"] = row.get("title")
            normalized_row["artist_names"] = None

        normalized_rows.append(normalized_row)

    if container_key == "data":
        result = dict(feed_payload)
        result["data"] = normalized_rows
        return result

    return normalized_rows


def _normalize_search_results(
    search_payload,
    song_payload,
    album_payload,
    artist_payload,
    makes_song_payload,
    makes_album_payload
):
    search_rows, container_key = _extract_payload_list(search_payload)
    song_rows, _ = _extract_payload_list(song_payload)
    album_rows, _ = _extract_payload_list(album_payload)
    artist_rows, _ = _extract_payload_list(artist_payload)
    song_artist_names_map, album_artist_names_map = _build_artist_name_maps(
        song_payload,
        album_payload,
        artist_payload,
        makes_song_payload,
        makes_album_payload
    )

    song_map = {}
    for song in song_rows:
        song_id = song.get("S_ID") or song.get("id")
        if song_id is None:
            continue
        song_map[str(song_id)] = song

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

    normalized_rows = []
    for row in search_rows:
        normalized_row = dict(row)
        item_type = _normalize_search_item_type(
            row.get("type") or row.get("collection") or row.get("collection_name")
        )
        item_id = row.get("id") or row.get("S_ID") or row.get("AL_ID") or row.get("ART_ID")
        title = row.get("title") or row.get("name")
        artwork_url = None
        artwork_alt = title or "Search result"
        supporting_text = None

        if item_type == "song" and item_id is not None:
            matched_song = song_map.get(str(item_id), {})
            album_id = matched_song.get("AL_ID")
            matched_album = album_map.get(str(album_id), {}) if album_id is not None else {}
            title = title or matched_song.get("S_Name")
            artwork_url = _resolve_media_url(matched_album.get("AL_Image"))
            artwork_alt = matched_album.get("AL_Name") or matched_song.get("S_Name") or title
            supporting_text = song_artist_names_map.get(str(item_id))
        elif item_type == "album" and item_id is not None:
            matched_album = album_map.get(str(item_id), {})
            title = title or matched_album.get("AL_Name")
            artwork_url = _resolve_media_url(matched_album.get("AL_Image"))
            artwork_alt = matched_album.get("AL_Name") or title
            supporting_text = album_artist_names_map.get(str(item_id))
        elif item_type == "artist" and item_id is not None:
            matched_artist = artist_map.get(str(item_id), {})
            title = title or matched_artist.get("ART_Name")
            artwork_url = _resolve_media_url(matched_artist.get("ART_Image"))
            artwork_alt = matched_artist.get("ART_Name") or title
            supporting_text = matched_artist.get("ART_Genre")

        normalized_row["id"] = item_id
        normalized_row["type"] = item_type
        normalized_row["title"] = title or "Untitled Result"
        normalized_row["artwork_url"] = artwork_url
        normalized_row["artwork_alt"] = artwork_alt or normalized_row["title"]
        normalized_row["supporting_text"] = supporting_text
        normalized_rows.append(normalized_row)

    if container_key == "data":
        result = dict(search_payload)
        result["data"] = normalized_rows
        return result

    return normalized_rows


def _build_review_view_maps(song_review_payload, album_review_payload, artist_review_payload):
    song_rows, _ = _extract_payload_list(song_review_payload)
    album_rows, _ = _extract_payload_list(album_review_payload)
    artist_rows, _ = _extract_payload_list(artist_review_payload)

    song_review_map = {}
    for row in song_rows:
        review_id = row.get("R_ID") or row.get("review_id") or row.get("id")
        if review_id is None:
            continue
        song_review_map[str(review_id)] = row

    album_review_map = {}
    for row in album_rows:
        review_id = row.get("R_ID") or row.get("review_id") or row.get("id")
        if review_id is None:
            continue
        album_review_map[str(review_id)] = row

    artist_review_map = {}
    for row in artist_rows:
        review_id = row.get("R_ID") or row.get("review_id") or row.get("id")
        if review_id is None:
            continue
        artist_review_map[str(review_id)] = row

    return song_review_map, album_review_map, artist_review_map


def _normalize_user_profile_reviews(
    user_payload,
    review_payload,
    song_payload,
    album_payload,
    artist_payload,
    makes_song_payload,
    makes_album_payload,
    song_review_payload,
    album_review_payload,
    artist_review_payload
):
    user_rows, container_key = _extract_payload_list(user_payload)
    review_rows, _ = _extract_payload_list(review_payload)
    song_rows, _ = _extract_payload_list(song_payload)
    album_rows, _ = _extract_payload_list(album_payload)
    artist_rows, _ = _extract_payload_list(artist_payload)
    song_artist_names_map, album_artist_names_map = _build_artist_name_maps(
        song_payload,
        album_payload,
        artist_payload,
        makes_song_payload,
        makes_album_payload,
        review_payload
    )
    review_map = {}
    for review in review_rows:
        review_id = review.get("R_ID") or review.get("review_id")
        if review_id is None:
            continue
        review_map[str(review_id)] = review

    song_map = {}
    for song in song_rows:
        song_id = song.get("S_ID") or song.get("id")
        if song_id is None:
            continue
        song_map[str(song_id)] = song

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

    song_review_map, album_review_map, artist_review_map = _build_review_view_maps(
        song_review_payload,
        album_review_payload,
        artist_review_payload
    )

    normalized_rows = []
    for user_review in user_rows:
        review_id = user_review.get("R_ID") or user_review.get("review_id")
        if review_id is None:
            continue

        review = review_map.get(str(review_id), {})
        fallback_song_review = song_review_map.get(str(review_id), {})
        fallback_album_review = album_review_map.get(str(review_id), {})
        fallback_artist_review = artist_review_map.get(str(review_id), {})

        song_id = review.get("S_ID")
        album_id = review.get("AL_ID")
        artist_id = review.get("ART_ID")

        matched_song = song_map.get(str(song_id), {}) if song_id is not None else {}
        if not album_id and matched_song:
            album_id = matched_song.get("AL_ID")

        matched_album = album_map.get(str(album_id), {}) if album_id is not None else {}
        matched_artist = artist_map.get(str(artist_id), {}) if artist_id is not None else {}

        review_type = "review"
        title = "Untitled Review"
        album_name = None
        artist_names = None
        artwork_url = None
        artwork_alt = None

        if song_id is not None or fallback_song_review:
            review_type = "song"
            title = matched_song.get("S_Name") or fallback_song_review.get("S_Name") or title

            fallback_album_id = fallback_song_review.get("AL_ID")
            if not matched_album and fallback_album_id is not None:
                matched_album = album_map.get(str(fallback_album_id), {})

            album_name = matched_album.get("AL_Name") or fallback_song_review.get("AL_Name")
            artist_names = _resolve_artist_names(
                song_id,
                album_id,
                artist_id,
                song_artist_names_map,
                album_artist_names_map,
                artist_map
            ) or fallback_artist_review.get("ART_Name")
            artwork_url = _resolve_media_url(matched_album.get("AL_Image"))
            artwork_alt = matched_album.get("AL_Name") or fallback_song_review.get("S_Name")
        elif album_id is not None or fallback_album_review:
            review_type = "album"
            title = matched_album.get("AL_Name") or fallback_album_review.get("name") or title
            album_name = matched_album.get("AL_Name") or fallback_album_review.get("name")
            artist_names = _resolve_artist_names(
                song_id,
                album_id,
                artist_id,
                song_artist_names_map,
                album_artist_names_map,
                artist_map
            ) or fallback_artist_review.get("ART_Name")
            artwork_url = _resolve_media_url(matched_album.get("AL_Image"))
            artwork_alt = matched_album.get("AL_Name") or fallback_album_review.get("name")
        elif artist_id is not None or fallback_artist_review:
            review_type = "artist"
            title = matched_artist.get("ART_Name") or fallback_artist_review.get("ART_Name") or title
            artwork_url = _resolve_media_url(matched_artist.get("ART_Image"))
            artwork_alt = matched_artist.get("ART_Name") or fallback_artist_review.get("ART_Name")

        normalized_rows.append({
            "review_id": review_id,
            "username": user_review.get("U_Username"),
            "U_Username": user_review.get("U_Username"),
            "U_ID": user_review.get("U_ID", user_review.get("id")),
            "review_text": user_review.get("R_Text", review.get("R_Text", "")),
            "review_rating": review.get("R_Rating", user_review.get("R_Rating", "")),
            "time_created": review.get("R_TimeCreated", user_review.get("R_TimeCreated")),
            "num_likes": _coerce_like_count(
                review.get("R_NumOfLikes", user_review.get("R_NumOfLikes"))
            ),
            "review_type": review_type,
            "title": title,
            "album_name": album_name,
            "artist_names": artist_names,
            "artwork_url": artwork_url,
            "artwork_alt": artwork_alt or title
        })

    normalized_rows.sort(
        key=lambda review: str(review.get("time_created") or ""),
        reverse=True
    )

    if container_key == "data":
        result = dict(user_payload)
        result["data"] = normalized_rows
        return result

    return normalized_rows


def _normalize_review_records(
    review_payload,
    song_payload,
    album_payload,
    artist_payload,
    makes_song_payload,
    makes_album_payload
):
    review_rows, container_key = _extract_payload_list(review_payload)
    song_rows, _ = _extract_payload_list(song_payload)
    album_rows, _ = _extract_payload_list(album_payload)
    artist_rows, _ = _extract_payload_list(artist_payload)
    song_artist_names_map, album_artist_names_map = _build_artist_name_maps(
        song_payload,
        album_payload,
        artist_payload,
        makes_song_payload,
        makes_album_payload,
        review_payload
    )
    song_map = {}
    for song in song_rows:
        song_id = song.get("S_ID") or song.get("id")
        if song_id is None:
            continue
        song_map[str(song_id)] = song

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

    normalized_rows = []
    for review in review_rows:
        review_id = review.get("R_ID") or review.get("review_id") or review.get("id")
        if review_id is None:
            continue

        song_id = review.get("S_ID")
        album_id = review.get("AL_ID")
        artist_id = review.get("ART_ID")

        matched_song = song_map.get(str(song_id), {}) if song_id is not None else {}
        if not album_id and matched_song:
            album_id = matched_song.get("AL_ID")

        matched_album = album_map.get(str(album_id), {}) if album_id is not None else {}
        matched_artist = artist_map.get(str(artist_id), {}) if artist_id is not None else {}

        review_type = "review"
        title = "Untitled Review"
        genre = None
        album_name = None
        artist_names = None
        artwork_url = None
        artwork_alt = None

        if song_id is not None and matched_song:
            review_type = "song"
            title = matched_song.get("S_Name", title)
            genre = matched_song.get("S_Genre")
            album_name = matched_album.get("AL_Name")
            artist_names = _resolve_artist_names(
                song_id,
                album_id,
                artist_id,
                song_artist_names_map,
                album_artist_names_map,
                artist_map
            )
            artwork_url = _resolve_media_url(matched_album.get("AL_Image"))
            artwork_alt = matched_album.get("AL_Name") or matched_song.get("S_Name")
        elif album_id is not None and matched_album:
            review_type = "album"
            title = matched_album.get("AL_Name", title)
            genre = matched_album.get("AL_Genre")
            album_name = matched_album.get("AL_Name")
            artist_names = _resolve_artist_names(
                song_id,
                album_id,
                artist_id,
                song_artist_names_map,
                album_artist_names_map,
                artist_map
            )
            artwork_url = _resolve_media_url(matched_album.get("AL_Image"))
            artwork_alt = matched_album.get("AL_Name")
        elif artist_id is not None and matched_artist:
            review_type = "artist"
            title = matched_artist.get("ART_Name", title)
            genre = matched_artist.get("ART_Genre")
            artwork_url = _resolve_media_url(matched_artist.get("ART_Image"))
            artwork_alt = matched_artist.get("ART_Name")

        normalized_rows.append({
            "review_id": review_id,
            "title": title,
            "review_type": review_type,
            "genre": genre,
            "review_text": review.get("R_Text", ""),
            "review_rating": review.get("R_Rating"),
            "time_created": review.get("R_TimeCreated"),
            "num_likes": _coerce_like_count(review.get("R_NumOfLikes")),
            "album_name": album_name,
            "artist_names": artist_names,
            "artwork_url": artwork_url,
            "artwork_alt": artwork_alt or title,
            "username": review.get("U_Username"),
            "U_Username": review.get("U_Username"),
            "S_ID": song_id,
            "AL_ID": album_id,
            "ART_ID": artist_id
        })

    normalized_rows.sort(
        key=lambda review: str(review.get("time_created") or ""),
        reverse=True
    )

    if container_key == "data":
        result = dict(review_payload)
        result["data"] = normalized_rows
        return result

    return normalized_rows


def _filter_normalized_reviews(payload, review_type=None):
    rows, container_key = _extract_payload_list(payload)

    filtered_rows = rows
    if review_type:
        filtered_rows = [
            review for review in rows
            if str(review.get("review_type", "")).strip().lower() == review_type
        ]

    if container_key == "data":
        result = dict(payload)
        result["data"] = filtered_rows
        return result

    return filtered_rows
