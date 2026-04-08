# Jukeboxd
Jukeboxd is a music review app. Using the website, users can write reviews for their favorite songs

## Setup

Create a local virtual environment, install the project dependencies, and run the Flask app.

Before starting the app, copy `.env.example` to `.env` and fill in the secret values. The repo's `.gitignore` keeps `.env` out of Git so local secrets do not get committed.

### Windows PowerShell

```powershell
python -m venv .venv --without-pip
python -m pip --python .\.venv install -r requirements.txt
.\.venv\Scripts\Activate.ps1
Copy-Item .env.example .env
python .\jukeboxd\FrontEnd\app.py
```

Open `http://127.0.0.1:5000`.

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
python ./jukeboxd/FrontEnd/app.py
```

Open `http://127.0.0.1:5000`.
