# Jukeboxd

## Setup

Create a local virtual environment, install the project dependencies, and run the Flask app.

### Windows PowerShell

```powershell
python -m venv .venv --without-pip
python -m pip --python .\.venv install -r requirements.txt
.\.venv\Scripts\Activate.ps1
python .\jukeboxd\FrontEnd\app.py
```

Open `http://127.0.0.1:5000`.

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ./jukeboxd/FrontEnd
python app.py
```

Open `http://127.0.0.1:5000`.
