import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
from application.interface.backend.models.vital import Vital

class TestVital(unittest.TestCase):
    def setUp(self):
        self.vital_data = (1, 101, 72, '120/80', datetime(2023, 10, 27, 10, 0))
        self.vital = Vital(*self.vital_data)

    def test_init(self):
        self.assertEqual(self.vital.id, 1)
        self.assertEqual(self.vital.patient_id, 101)
        self.assertEqual(self.vital.heart_rate, 72)
        self.assertEqual(self.vital.blood_pressure, '120/80')
        self.assertEqual(self.vital.recorded_at, datetime(2023, 10, 27, 10, 0))

    def test_to_dict(self):
        expected_dict = {
            "id": 1,
            "patient_id": 101,
            "heart_rate": 72,
            "blood_pressure": '120/80',
            "recorded_at": "2023-10-27T10:00:00"
        }
        self.assertEqual(self.vital.to_dict(), expected_dict)

    @patch('application.interface.backend.models.vital.get_db')
    def test_get_all_for_patient(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = [self.vital_data]

        results = Vital.get_all_for_patient(101)

        self.assertEqual(len(results), 1)
        self.assertIsInstance(results[0], Vital)
        self.assertEqual(results[0].patient_id, 101)
        mock_cursor.execute.assert_called_once()

    @patch('application.interface.backend.models.vital.get_db')
    def test_create(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = self.vital_data

        new_vital = Vital.create(101, 72, '120/80', datetime(2023, 10, 27, 10, 0))

        self.assertIsInstance(new_vital, Vital)
        self.assertEqual(new_vital.patient_id, 101)
        mock_db.commit.assert_called_once()

if __name__ == '__main__':
    unittest.main()
