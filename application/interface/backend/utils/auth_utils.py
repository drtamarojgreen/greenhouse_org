from ..database import get_db

def get_clinician_id(user_id):
    """
    Get clinician ID from user ID

    Args:
        user_id: ID of the user

    Returns:
        clinician_id or None
    """
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute('SELECT id FROM clinicians WHERE user_id = %s', (user_id,))
        row = cur.fetchone()
        return row[0] if row else None
    finally:
        cur.close()
