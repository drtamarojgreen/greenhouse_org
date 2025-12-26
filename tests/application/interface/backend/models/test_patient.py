import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

from application.interface.backend.models.patient import Patient

class TestPatientModel(unittest.TestCase):

    @patch('application.interface.backend.models.patient.get_db')
    def test_get_all_patients(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor

        mock_cursor.fetchall.return_value = [
            (1, 1, datetime.now(), 'Male', datetime.now(), 'Caucasian', '123 Main St', None, 'CA', '12345', 'Anytown'),
            (2, 2, datetime.now(), 'Female', datetime.now(), 'Hispanic', '456 Oak Ave', None, 'NY', '54321', 'Somecity')
        ]

        patients = Patient.get_all()
        self.assertEqual(len(patients), 2)
        self.assertEqual(patients[0].user_id, 1)
        mock_cursor.execute.assert_called_once_with('SELECT * FROM patients;')

    @patch('application.interface.backend.models.patient.get_db')
    def test_get_patient_by_id(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor

        mock_cursor.fetchone.return_value = (1, 1, datetime.now(), 'Male', datetime.now(), 'Caucasian', '123 Main St', None, 'CA', '12345', 'Anytown')

        patient = Patient.get_by_id(1)
        self.assertIsNotNone(patient)
        self.assertEqual(patient.user_id, 1)
        mock_cursor.execute.assert_called_once_with('SELECT * FROM patients WHERE id = %s;', (1,))

    @patch('application.interface.backend.models.patient.get_db')
    def test_create_patient(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor

        mock_cursor.fetchone.return_value = (1, 3, datetime.now(), 'Other', datetime.now(), 'Asian', '789 Pine Ln', None, 'TX', '67890', 'Newplace')

        patient = Patient.create(3, datetime.now(), 'Other')
        self.assertEqual(patient.user_id, 3)
        mock_db.commit.assert_called_once()

    @patch('application.interface.backend.models.patient.get_db')
    def test_update_patient(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor

        patient = Patient(1, 1, datetime.now(), 'Male', datetime.now(), 'Caucasian', '123 Main St', None, 'CA', '12345', 'Anytown')
        patient.state = 'NV'
        patient.update()

        mock_cursor.execute.assert_called_once()
        mock_db.commit.assert_called_once()

    @patch('application.interface.backend.models.patient.get_db')
    def test_delete_patient(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor

        patient = Patient(1, 1, datetime.now(), 'Male', datetime.now(), 'Caucasian', '123 Main St', None, 'CA', '12345', 'Anytown')
        patient.delete()

        mock_cursor.execute.assert_called_with('DELETE FROM patients WHERE id = %s;', (patient.id,))
        mock_db.commit.assert_called_once()


if __name__ == '__main__':
    unittest.main()
