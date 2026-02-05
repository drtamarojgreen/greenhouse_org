import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
from application.interface.backend.models.appointment import Appointment

class TestAppointment(unittest.TestCase):
    def setUp(self):
        self.appointment_data = (1, 101, 201, datetime(2023, 10, 27, 10, 0), 'scheduled')
        self.appointment = Appointment(*self.appointment_data)

    def test_init(self):
        self.assertEqual(self.appointment.id, 1)
        self.assertEqual(self.appointment.patient_id, 101)
        self.assertEqual(self.appointment.clinician_id, 201)
        self.assertEqual(self.appointment.appointment_time, datetime(2023, 10, 27, 10, 0))
        self.assertEqual(self.appointment.status, 'scheduled')

    def test_to_dict(self):
        expected_dict = {
            "id": 1,
            "patient_id": 101,
            "clinician_id": 201,
            "appointment_time": "2023-10-27T10:00:00",
            "status": 'scheduled'
        }
        self.assertEqual(self.appointment.to_dict(), expected_dict)

    @patch('application.interface.backend.models.appointment.get_db')
    def test_get_all_for_patient(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = [self.appointment_data]

        results = Appointment.get_all_for_patient(101)

        self.assertEqual(len(results), 1)
        self.assertIsInstance(results[0], Appointment)
        self.assertEqual(results[0].patient_id, 101)
        mock_cursor.execute.assert_called_once()

    @patch('application.interface.backend.models.appointment.get_db')
    def test_create(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = self.appointment_data

        new_appointment = Appointment.create(101, 201, datetime(2023, 10, 27, 10, 0), 'scheduled')

        self.assertIsInstance(new_appointment, Appointment)
        self.assertEqual(new_appointment.patient_id, 101)
        mock_db.commit.assert_called_once()

if __name__ == '__main__':
    unittest.main()
