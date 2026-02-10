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
        mock_cursor.execute.assert_any_call('SELECT * FROM patients;')

    @patch('application.interface.backend.models.patient.get_db')
    def test_get_all_patients_scoped(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor

        mock_cursor.fetchall.return_value = [
            (1, 1, datetime.now(), 'Male', datetime.now(), 'Caucasian', '123 Main St', None, 'CA', '12345', 'Anytown')
        ]

        patients = Patient.get_all(clinician_id=5)
        self.assertEqual(len(patients), 1)
        self.assertIn('pc.clinician_id = %s', mock_cursor.execute.call_args[0][0])
        self.assertEqual(mock_cursor.execute.call_args[0][1], (5,))

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

    def test_to_dict_masking(self):
        patient = Patient(1, 1, datetime(1990, 1, 1), 'Male', datetime.now(), 'Caucasian', '123 Main St', None, 'CA', '12345', 'Anytown')

        # Test without masking
        data = patient.to_dict(mask=False)
        self.assertEqual(data['date_of_birth'], '1990-01-01T00:00:00')
        self.assertEqual(data['gender'], 'Male')
        self.assertEqual(data['address_line_1'], '123 Main St')

        # Test with masking
        masked_data = patient.to_dict(mask=True)
        self.assertEqual(masked_data['date_of_birth'], '****-**-**')
        self.assertEqual(masked_data['gender'], '****')
        self.assertEqual(masked_data['ethnicity'], '****')
        self.assertTrue(all(c == '*' for c in masked_data['address_line_1']))


if __name__ == '__main__':
    unittest.main()
