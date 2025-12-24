from ..database import get_db

class User:
    def __init__(self, id, email, full_name, role_id, manager_id, created_at):
        self.id = id
        self.email = email
        self.full_name = full_name
        self.role_id = role_id
        self.manager_id = manager_id
        self.created_at = created_at

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role_id": self.role_id,
            "manager_id": self.manager_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

    @staticmethod
    def get_all():
        db = get_db()
        cur = db.cursor()
        cur.execute('SELECT * FROM users;')
        users = cur.fetchall()
        cur.close()
        return [User(*user) for user in users]

    @staticmethod
    def get_by_id(user_id):
        db = get_db()
        cur = db.cursor()
        cur.execute('SELECT * FROM users WHERE id = %s;', (user_id,))
        user = cur.fetchone()
        cur.close()
        return User(*user) if user else None

    @staticmethod
    def create(email, full_name, role_id, manager_id=None):
        db = get_db()
        cur = db.cursor()
        cur.execute(
            'INSERT INTO users (email, full_name, role_id, manager_id) VALUES (%s, %s, %s, %s) RETURNING *;',
            (email, full_name, role_id, manager_id)
        )
        user = cur.fetchone()
        db.commit()
        cur.close()
        return User(*user)

    def update(self):
        db = get_db()
        cur = db.cursor()
        cur.execute(
            'UPDATE users SET email = %s, full_name = %s, role_id = %s, manager_id = %s WHERE id = %s;',
            (self.email, self.full_name, self.role_id, self.manager_id, self.id)
        )
        db.commit()
        cur.close()

    def delete(self):
        db = get_db()
        cur = db.cursor()
        cur.execute('DELETE FROM users WHERE id = %s;', (self.id,))
        db.commit()
        cur.close()
