from ..database import get_db

class Patient:
    def __init__(self, id, user_id, date_of_birth, gender, created_at, ethnicity, address_line_1, address_line_2, state, zip, city):
        self.id = id
        self.user_id = user_id
        self.date_of_birth = date_of_birth
        self.gender = gender
        self.created_at = created_at
        self.ethnicity = ethnicity
        self.address_line_1 = address_line_1
        self.address_line_2 = address_line_2
        self.state = state
        self.zip = zip
        self.city = city

    def to_dict(self, mask=False):
        from ..utils.encryption import DataMasking

        data = {
            "id": self.id,
            "user_id": self.user_id,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "gender": self.gender,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "ethnicity": self.ethnicity,
            "address_line_1": self.address_line_1,
            "address_line_2": self.address_line_2,
            "state": self.state,
            "zip": self.zip,
            "city": self.city
        }

        if mask:
            data['date_of_birth'] = DataMasking.mask_dob(data['date_of_birth'])
            data['gender'] = DataMasking.mask_generic(data['gender'])
            data['ethnicity'] = DataMasking.mask_generic(data['ethnicity'])
            data['address_line_1'] = DataMasking.mask_address(data['address_line_1'])
            data['address_line_2'] = DataMasking.mask_address(data['address_line_2'])
            data['state'] = DataMasking.mask_generic(data['state'])
            data['zip'] = DataMasking.mask_generic(data['zip'])
            data['city'] = DataMasking.mask_generic(data['city'])

        return data

    @staticmethod
    def get_all(clinician_id=None):
        db = get_db()
        cur = db.cursor()
        if clinician_id:
            cur.execute('''
                SELECT p.* FROM patients p
                JOIN patient_clinician pc ON pc.patient_id = p.id
                WHERE pc.clinician_id = %s;
            ''', (clinician_id,))
        else:
            cur.execute('SELECT * FROM patients;')
        patients = cur.fetchall()
        cur.close()
        return [Patient(*patient) for patient in patients]

    @staticmethod
    def get_by_id(patient_id):
        db = get_db()
        cur = db.cursor()
        cur.execute('SELECT * FROM patients WHERE id = %s;', (patient_id,))
        patient = cur.fetchone()
        cur.close()
        return Patient(*patient) if patient else None

    @staticmethod
    def create(user_id, date_of_birth, gender, ethnicity=None, address_line_1=None, address_line_2=None, state=None, zip=None, city=None):
        db = get_db()
        cur = db.cursor()
        cur.execute(
            'INSERT INTO patients (user_id, date_of_birth, gender, ethnicity, address_line_1, address_line_2, state, zip, city) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *;',
            (user_id, date_of_birth, gender, ethnicity, address_line_1, address_line_2, state, zip, city)
        )
        patient = cur.fetchone()
        db.commit()
        cur.close()
        return Patient(*patient)

    def update(self):
        db = get_db()
        cur = db.cursor()
        cur.execute(
            'UPDATE patients SET user_id = %s, date_of_birth = %s, gender = %s, ethnicity = %s, address_line_1 = %s, address_line_2 = %s, state = %s, zip = %s, city = %s WHERE id = %s;',
            (self.user_id, self.date_of_birth, self.gender, self.ethnicity, self.address_line_1, self.address_line_2, self.state, self.zip, self.city, self.id)
        )
        db.commit()
        cur.close()

    def delete(self):
        db = get_db()
        cur = db.cursor()
        cur.execute('DELETE FROM patients WHERE id = %s;', (self.id,))
        db.commit()
        cur.close()
