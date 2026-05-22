# backend/app/db/connection.py

import psycopg
from psycopg.rows import dict_row
from app.core.config import DB_QUERY_TIMEOUT_SECONDS, settings

def get_connection():
    return psycopg.connect(
        settings.database_url,
        row_factory=dict_row,
        connect_timeout=DB_QUERY_TIMEOUT_SECONDS,
    )
