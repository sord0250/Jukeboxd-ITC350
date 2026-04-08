import csv
import os
import time
from pathlib import Path

import spotipy
from spotipy.oauth2 import SpotifyOAuth

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
SPOTIFY_CACHE_FILE = Path(__file__).resolve().with_name(".spotify-cache")


def load_env_file(env_file):
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


def require_env(name):
    value = os.getenv(name)
    if value:
        return value

    raise RuntimeError(
        f"Missing required environment variable '{name}'. "
        f"Create {ENV_FILE} from .env.example before running this script."
    )


load_env_file(ENV_FILE)

# --- Spotify setup ---
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=require_env("SPOTIFY_CLIENT_ID"),
    client_secret=require_env("SPOTIFY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:8888/callback"),
    scope="user-top-read",
    cache_path=str(SPOTIFY_CACHE_FILE),
))

# --- Helpers ---
def safe_date(raw_date):
    if not raw_date:
        return "2000-01-01"
    if len(raw_date) == 4:
        return f"{raw_date}-01-01"
    elif len(raw_date) == 7:
        return f"{raw_date}-01"
    return raw_date

def get_all_albums(sp, artist_id):
    albums = []
    results = sp.artist_albums(artist_id, include_groups='album', limit=10)
    albums.extend(results['items'])

    while results.get('next'):
        results = sp.next(results)
        albums.extend(results['items'])
        time.sleep(0.2)

    return albums

def get_all_tracks(sp, album_id):
    tracks = []
    results = sp.album_tracks(album_id, limit=50)
    tracks.extend(results['items'])

    while results.get('next'):
        results = sp.next(results)
        tracks.extend(results['items'])
        time.sleep(0.2)

    return tracks

# --- CSV setup ---
artist_csv = open("artists.csv", "w", newline="", encoding="utf-8")
album_csv = open("albums.csv", "w", newline="", encoding="utf-8")
song_csv = open("songs.csv", "w", newline="", encoding="utf-8")
makes_album_csv = open("makes_album.csv", "w", newline="", encoding="utf-8")
makes_song_csv = open("makes_song.csv", "w", newline="", encoding="utf-8")

artist_writer = csv.writer(artist_csv)
album_writer = csv.writer(album_csv)
song_writer = csv.writer(song_csv)
makes_album_writer = csv.writer(makes_album_csv)
makes_song_writer = csv.writer(makes_song_csv)

artist_writer.writerow(["ART_ID", "ART_Name", "ART_Genre", "ART_Image"])
album_writer.writerow(["AL_ID", "AL_Name", "AL_Genre", "AL_DateCreated", "AL_SpotifyID", "AL_Image"])
song_writer.writerow(["S_ID", "S_Name", "S_Length", "S_Genre", "AL_ID", "S_SpotifyID"])
makes_album_writer.writerow(["ART_ID", "AL_ID"])
makes_song_writer.writerow(["ART_ID", "S_ID"])

# --- In-memory maps ---
artist_map = {}        # artist name -> ART_ID
album_map = {}         # album spotify_id -> AL_ID
song_map = {}          # track spotify_id -> S_ID
song_artists_map = {}  # track spotify_id -> list of artist spotify_ids

# Prevent duplicate relationships
makes_album_set = set()
makes_song_set = set()

artist_counter = 1
album_counter = 1
song_counter = 1

# Cache artist API calls
artist_info_map = {}

def get_artist_safe(sp, artist_id):
    if artist_id in artist_info_map:
        return artist_info_map[artist_id]

    try:
        artist = sp.artist(artist_id)
        artist_info_map[artist_id] = artist
        time.sleep(0.1)
        return artist
    except Exception as e:
        print("Error fetching artist:", artist_id, e)
        return None

# --- MAIN ---
results = sp.current_user_top_artists(limit=20)
top_artists = results["items"]

artist_ids_needed = set()

# Add top artists
for a in top_artists:
    artist_ids_needed.add(a["id"])

for artist_item in top_artists:
    artist_name = artist_item["name"]
    artist_spotify_id = artist_item["id"]

    if artist_name not in artist_map:
        artist_map[artist_name] = artist_counter
        artist_counter += 1

    ART_ID = artist_map[artist_name]

    albums = get_all_albums(sp, artist_spotify_id)

    for album in albums:
        album_name = album["name"]
        album_spotify_id = album["id"]
        release_date = safe_date(album.get("release_date"))
        album_image = album["images"][0]["url"] if album.get("images") else ""

        if album_spotify_id not in album_map:
            AL_ID = album_counter
            album_map[album_spotify_id] = AL_ID
            album_writer.writerow([AL_ID, album_name, "unknown", release_date, album_spotify_id, album_image])
            album_counter += 1
        else:
            AL_ID = album_map[album_spotify_id]

        if (ART_ID, AL_ID) not in makes_album_set:
            makes_album_writer.writerow([ART_ID, AL_ID])
            makes_album_set.add((ART_ID, AL_ID))

        tracks = get_all_tracks(sp, album_spotify_id)

        for track in tracks:
            track_name = track["name"]
            track_spotify_id = track["id"]
            track_length = track["duration_ms"] // 1000

            if track_spotify_id not in song_map:
                S_ID = song_counter
                song_map[track_spotify_id] = S_ID
                song_writer.writerow([S_ID, track_name, track_length, "unknown", AL_ID, track_spotify_id])
                song_counter += 1
            else:
                S_ID = song_map[track_spotify_id]

            artist_ids_for_track = []

            for track_artist in track["artists"]:
                a_id = track_artist["id"]
                artist_ids_needed.add(a_id)
                artist_ids_for_track.append(a_id)

            song_artists_map[track_spotify_id] = artist_ids_for_track

# --- Write artists ---
for spotify_id in artist_ids_needed:
    artist_info = get_artist_safe(sp, spotify_id)
    if not artist_info:
        continue

    name = artist_info["name"]
    genres = ", ".join(artist_info.get("genres", []))
    image = artist_info["images"][0]["url"] if artist_info.get("images") else ""

    if name not in artist_map:
        artist_map[name] = artist_counter
        artist_counter += 1

    ART_ID = artist_map[name]
    artist_writer.writerow([ART_ID, name, genres, image])

# --- Write makes_song ---
for track_spotify_id, S_ID in song_map.items():
    artist_ids_for_track = song_artists_map.get(track_spotify_id, [])

    for a_id in artist_ids_for_track:
        artist_info = get_artist_safe(sp, a_id)
        if not artist_info:
            continue

        name = artist_info["name"]
        ART_ID = artist_map[name]

        if (ART_ID, S_ID) not in makes_song_set:
            makes_song_writer.writerow([ART_ID, S_ID])
            makes_song_set.add((ART_ID, S_ID))

# --- Close CSVs ---
artist_csv.close()
album_csv.close()
song_csv.close()
makes_album_csv.close()
makes_song_csv.close()

print("✅ CSV export complete (images + genres + no duplicates + no 403s)")
