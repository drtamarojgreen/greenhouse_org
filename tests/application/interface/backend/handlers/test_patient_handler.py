import unittest
import json
from unittest.mock import patch, MagicMock
from flask import Flask
from datetime import datetime
from flask_jwt_extended import JWTManager, create_access_token

from application.interface.backend.handlers.patient_handler import patient_bp
from application.interface.backend.models.patient import Patient

class TestPatientHandler(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['JWT_SECRET_KEY'] = 'test-secret'
        self.app.config['JWT_TOKEN_LOCATION'] = ['headers']
        self.app.register_blueprint(patient_bp, url_prefix='/api')
        self.jwt = JWTManager(self.app)
        self.client = self.app.test_client()

        with self.app.app_context():
            self.clinician_token = create_access_token(
                identity='1',
                additional_claims={'mfa_verified': True, 'role': 'clinician'}
            )

    @patch('application.interface.backend.models.patient.Patient.get_all')
    @patch('application.interface.backend.handlers.patient_handler.get_clinician_id')
    def test_get_all_patients(self, mock_get_clinician_id, mock_get_all):
        mock_get_clinician_id.return_value = 1
        mock_patient = Patient(1, 1, datetime.now(), 'Male', datetime.now(), 'Caucasian', '123 Main St', None, 'CA', '12345', 'Anytown')
        mock_get_all.return_value = [mock_patient]

        response = self.client.get('/api/patients', headers={'Authorization': f'Bearer {self.clinician_token}'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(json.loads(response.data)), 1)

    @patch('application.interface.backend.models.patient.Patient.get_by_id')
    @patch('application.interface.backend.handlers.patient_handler.get_clinician_id')
    @patch('application.interface.backend.handlers.patient_handler.get_db')
    def test_get_patient_by_id(self, mock_get_db, mock_get_clinician_id, mock_get_by_id):
        mock_get_clinician_id.return_value = 1
        mock_cursor = MagicMock()
        mock_get_db.return_value.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = (1,) # Assignment link exists
        mock_patient = Patient(1, 1, datetime.now(), 'Male', datetime.now(), 'Caucasian', '123 Main St', None, 'CA', '12345', 'Anytown')
        mock_get_by_id.return_value = mock_patient

        response = self.client.get('/api/patients/1', headers={'Authorization': f'Bearer {self.clinician_token}'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data)['user_id'], 1)

    @patch('application.interface.backend.models.patient.Patient.create')
    def test_create_patient(self, mock_create):
        mock_patient = Patient(1, 3, datetime.now(), 'Other', datetime.now(), 'Asian', '789 Pine Ln', None, 'TX', '67890', 'Newplace')
        mock_create.return_value = mock_patient

        data = {
            'user_id': 3,
            'date_of_birth': '2000-01-01',
            'gender': 'Other'
        }
        response = self.client.post('/api/patients',
                                    data=json.dumps(data),
                                    content_type='application/json',
                                    headers={'Authorization': f'Bearer {self.clinician_token}'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(json.loads(response.data)['user_id'], 3)

    @patch('application.interface.backend.models.patient.Patient.get_by_id')
    @patch('application.interface.backend.handlers.patient_handler.get_clinician_id')
    @patch('application.interface.backend.handlers.patient_handler.get_db')
    def test_get_patient_unauthorized(self, mock_get_db, mock_get_clinician_id, mock_get_by_id):
        mock_get_clinician_id.return_value = 1
        mock_cursor = MagicMock()
        mock_get_db.return_value.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = None # Assignment link DOES NOT exist

        mock_patient = Patient(2, 2, datetime.now(), 'Female', datetime.now(), 'Hispanic', '456 Oak Ave', None, 'NY', '54321', 'Somecity')
        mock_get_by_id.return_value = mock_patient

        response = self.client.get('/api/patients/2', headers={'Authorization': f'Bearer {self.clinician_token}'})
        self.assertEqual(response.status_code, 403)


if __name__ == '__main__':
    unittest.main()
