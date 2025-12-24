from ..database import get_db

class Vital:
    def __init__(self, id, patient_id, heart_rate, blood_pressure, recorded_at):
        self.id = id
        self.patient_id = patient_id
        self.heart_rate = heart_rate
        self.blood_pressure = blood_pressure
        self.recorded_at = recorded_at

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "heart_rate": self.heart_rate,
            "blood_pressure": self.blood_pressure,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None
        }

    @staticmethod
    def get_all_for_patient(patient_id):
        db = get_db()
        cur = db.cursor()
        cur.execute('SELECT * FROM vitals WHERE patient_id = %s;', (patient_id,))
        vitals = cur.fetchall()
        cur.close()
        return [Vital(*vital) for vital in vitals]

    @staticmethod
    def create(patient_id, heart_rate, blood_pressure, recorded_at):
        db = get_db()
        cur = db.cursor()
        cur.execute(
            'INSERT INTO vitals (patient_id, heart_rate, blood_pressure, recorded_at) VALUES (%s, %s, %s, %s) RETURNING *;',
            (patient_id, heart_rate, blood_pressure, recorded_at)
        )
        vital = cur.fetchone()
        db.commit()
        cur.close()
        return Vital(*vital)
