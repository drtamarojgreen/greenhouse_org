from ..database import get_db

class TherapySession:
    def __init__(self, id, appointment_id, clinic_id, notes, duration_minutes):
        self.id = id
        self.appointment_id = appointment_id
        self.clinic_id = clinic_id
        self.notes = notes
        self.duration_minutes = duration_minutes

    def to_dict(self):
        return {
            "id": self.id,
            "appointment_id": self.appointment_id,
            "clinic_id": self.clinic_id,
            "notes": self.notes,
            "duration_minutes": self.duration_minutes
        }

    @staticmethod
    def get_all_for_appointment(appointment_id):
        db = get_db()
        cur = db.cursor()
        cur.execute('SELECT * FROM therapy_sessions WHERE appointment_id = %s;', (appointment_id,))
        sessions = cur.fetchall()
        cur.close()
        return [TherapySession(*session) for session in sessions]

    @staticmethod
    def create(appointment_id, clinic_id, notes, duration_minutes):
        db = get_db()
        cur = db.cursor()
        cur.execute(
            'INSERT INTO therapy_sessions (appointment_id, clinic_id, notes, duration_minutes) VALUES (%s, %s, %s, %s) RETURNING *;',
            (appointment_id, clinic_id, notes, duration_minutes)
        )
        session = cur.fetchone()
        db.commit()
        cur.close()
        return TherapySession(*session)
