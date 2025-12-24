from ..database import get_db

class Appointment:
    def __init__(self, id, patient_id, clinician_id, appointment_time, status):
        self.id = id
        self.patient_id = patient_id
        self.clinician_id = clinician_id
        self.appointment_time = appointment_time
        self.status = status

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "clinician_id": self.clinician_id,
            "appointment_time": self.appointment_time.isoformat() if self.appointment_time else None,
            "status": self.status
        }

    @staticmethod
    def get_all_for_patient(patient_id):
        db = get_db()
        cur = db.cursor()
        cur.execute('SELECT * FROM appointments WHERE patient_id = %s;', (patient_id,))
        appointments = cur.fetchall()
        cur.close()
        return [Appointment(*appointment) for appointment in appointments]

    @staticmethod
    def create(patient_id, clinician_id, appointment_time, status):
        db = get_db()
        cur = db.cursor()
        cur.execute(
            'INSERT INTO appointments (patient_id, clinician_id, appointment_time, status) VALUES (%s, %s, %s, %s) RETURNING *;',
            (patient_id, clinician_id, appointment_time, status)
        )
        appointment = cur.fetchone()
        db.commit()
        cur.close()
        return Appointment(*appointment)
