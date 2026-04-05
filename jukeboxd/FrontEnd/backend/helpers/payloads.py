import requests

from backend.config import DIRECTUS_URL


def _fetch_review_reference_payloads():
    review_response = requests.get(
        f"{DIRECTUS_URL}/items/REVIEW",
        params={
            "fields": "R_ID,R_Text,R_Rating,R_TimeCreated,R_NumOfLikes,S_ID,AL_ID,ART_ID,U_Username",
            "limit": -1
        }
    )
    song_response = requests.get(
        f"{DIRECTUS_URL}/items/SONG",
        params={"fields": "S_ID,S_Name,S_Genre,AL_ID", "limit": -1}
    )
    album_response = requests.get(
        f"{DIRECTUS_URL}/items/ALBUM",
        params={"fields": "AL_ID,AL_Name,AL_Genre,AL_Image", "limit": -1}
    )
    artist_response = requests.get(
        f"{DIRECTUS_URL}/items/ARTIST",
        params={"fields": "ART_ID,ART_Name,ART_Genre,ART_Image", "limit": -1}
    )
    makes_song_response = requests.get(
        f"{DIRECTUS_URL}/items/MAKES_SONG",
        params={"fields": "S_ID,ART_ID", "limit": -1}
    )
    makes_album_response = requests.get(
        f"{DIRECTUS_URL}/items/MAKES_ALBUM",
        params={"fields": "AL_ID,ART_ID", "limit": -1}
    )
    return (
        review_response.json(),
        song_response.json(),
        album_response.json(),
        artist_response.json(),
        makes_song_response.json(),
        makes_album_response.json()
    )


def _fetch_search_reference_payloads():
    song_response = requests.get(
        f"{DIRECTUS_URL}/items/SONG",
        params={"fields": "S_ID,S_Name,AL_ID", "limit": -1}
    )
    album_response = requests.get(
        f"{DIRECTUS_URL}/items/ALBUM",
        params={"fields": "AL_ID,AL_Name,AL_Image", "limit": -1}
    )
    artist_response = requests.get(
        f"{DIRECTUS_URL}/items/ARTIST",
        params={"fields": "ART_ID,ART_Name,ART_Genre,ART_Image", "limit": -1}
    )
    makes_song_response = requests.get(
        f"{DIRECTUS_URL}/items/MAKES_SONG",
        params={"fields": "S_ID,ART_ID", "limit": -1}
    )
    makes_album_response = requests.get(
        f"{DIRECTUS_URL}/items/MAKES_ALBUM",
        params={"fields": "AL_ID,ART_ID", "limit": -1}
    )
    return (
        song_response.json(),
        album_response.json(),
        artist_response.json(),
        makes_song_response.json(),
        makes_album_response.json()
    )


def _fetch_review_view_payloads():
    song_review_response = requests.get(f"{DIRECTUS_URL}/song_review/")
    album_review_response = requests.get(f"{DIRECTUS_URL}/album_reviews/")
    artist_review_response = requests.get(f"{DIRECTUS_URL}/artist_review/")

    return (
        song_review_response.json(),
        album_review_response.json(),
        artist_review_response.json()
    )
