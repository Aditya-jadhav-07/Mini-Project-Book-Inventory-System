
from flask import Flask
from pathlib import Path

FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIR),
    static_url_path="/assets"
)

from . import routes
