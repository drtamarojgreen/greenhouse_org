from ..database import get_db

class Message:
    def __init__(self, id, sender_id, receiver_id, message, sent_at):
        self.id = id
        self.sender_id = sender_id
        self.receiver_id = receiver_id
        self.message = message
        self.sent_at = sent_at

    def to_dict(self):
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "message": self.message,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None
        }

    @staticmethod
def get_all_for_user(user_id):
        db = get_db()
        cur = db.cursor()
        cur.execute('SELECT * FROM messages WHERE sender_id = %s OR receiver_id = %s;', (user_id, user_id))
        messages = cur.fetchall()
        cur.close()
        return [Message(*message) for message in messages]

    @staticmethod
    def create(sender_id, receiver_id, message):
        db = get_db()
        cur = db.cursor()
        cur.execute(
            'INSERT INTO messages (sender_id, receiver_id, message) VALUES (%s, %s, %s) RETURNING *;',
            (sender_id, receiver_id, message)
        )
        message = cur.fetchone()
        db.commit()
        cur.close()
        return Message(*message)
