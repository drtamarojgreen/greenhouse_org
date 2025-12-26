import unittest
import json
from unittest.mock import patch, MagicMock
from flask import Flask
from datetime import datetime

from application.interface.backend.handlers.patient_handler import patient_bp
from application.interface.backend.models.patient import Patient

class TestPatientHandler(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)
        self.app.register_blueprint(patient_bp, url_prefix='/api')
        self.client = self.app.test_client()

    @patch('application.interface.backend.models.patient.Patient.get_all')
    def test_get_all_patients(self, mock_get_all):
        mock_patient = Patient(1, 1, datetime.now(), 'Male', datetime.now(), 'Caucasian', '123 Main St', None, 'CA', '12345', 'Anytown')
        mock_get_all.return_value = [mock_patient]

        response = self.client.get('/api/patients')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(json.loads(response.data)), 1)

    @patch('application.interface.backend.models.patient.Patient.get_by_id')
    def test_get_patient_by_id(self, mock_get_by_id):
        mock_patient = Patient(1, 1, datetime.now(), 'Male', datetime.now(), 'Caucasian', '123 Main St', None, 'CA', '12345', 'Anytown')
        mock_get_by_id.return_value = mock_patient

        response = self.client.get('/api/patients/1')
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
        response = self.client.post('/api/patients', data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(json.loads(response.data)['user_id'], 3)


if __name__ == '__main__':
    unittest.main()
