import os
import sqlite3
import time
from typing import Callable, Any

CACHE_DB_DEFAULT = os.path.join(os.path.dirname(__file__), 'cache.db')


def get_cache_connection(db_path: str = CACHE_DB_DEFAULT) -> sqlite3.Connection:
    """Return a SQLite connection, creating the DB file and its directory if needed.
    The cache schema mirrors the one used in v6‑v9 for PubMed queries.
    """
    # Ensure the parent directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    # Ensure table exists
    conn.execute('''
        CREATE TABLE IF NOT EXISTS pubmed_cache (
            term TEXT PRIMARY KEY,
            count INTEGER,
            related TEXT
        )
    ''')
    conn.commit()
    return conn
    """Return a SQLite connection, creating the DB file if it does not exist.
    The cache schema mirrors the one used in v6‑v9 for PubMed queries.
    """
    conn = sqlite3.connect(db_path)
    # Ensure table exists
    conn.execute('''
        CREATE TABLE IF NOT EXISTS pubmed_cache (
            query TEXT PRIMARY KEY,
            response TEXT,
            timestamp INTEGER
        )
    ''')
    conn.commit()
    return conn


def cached_query(query: str, fetch_func: Callable[[], Any], ttl_seconds: int = 86400, db_path: str = CACHE_DB_DEFAULT) -> Any:
    """Simple cache wrapper.
    - `query` is a string uniquely identifying the API request.
    - `fetch_func` is a zero‑argument callable that performs the actual request.
    - `ttl_seconds` defines how long cached entries are considered fresh.
    Returns the cached or freshly fetched result.
    """
    conn = get_cache_connection(db_path)
    cur = conn.cursor()
    cur.execute('SELECT response, timestamp FROM pubmed_cache WHERE query = ?', (query,))
    row = cur.fetchone()
    now = int(time.time())
    if row:
        response, ts = row
        if now - ts < ttl_seconds:
            conn.close()
            return response
    # Cache miss or stale
    result = fetch_func()
    cur.execute('REPLACE INTO pubmed_cache (query, response, timestamp) VALUES (?,?,?)', (query, result, now))
    conn.commit()
    conn.close()
    return result


def rate_limited(min_interval: float = 1.0):
    """Decorator to enforce a minimum interval between successive calls.
    Useful for respecting NCBI rate limits.
    """
    def decorator(func: Callable):
        last_time = [0.0]
        def wrapper(*args, **kwargs):
            elapsed = time.time() - last_time[0]
            if elapsed < min_interval:
                time.sleep(min_interval - elapsed)
            result = func(*args, **kwargs)
            last_time[0] = time.time()
            return result
        return wrapper
    return decorator
