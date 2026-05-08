from pathlib import Path
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env.local"

if not ENV_PATH.exists():
    ENV_PATH = BASE_DIR.parent / "worker" / ".env.local"

load_dotenv(dotenv_path=ENV_PATH, override=True)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:tamilskaya11@localhost:5432/cot_db")
engine = create_engine(DATABASE_URL)