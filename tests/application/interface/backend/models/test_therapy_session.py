import unittest
from unittest.mock import patch, MagicMock
from application.interface.backend.models.therapy_session import TherapySession

class TestTherapySession(unittest.TestCase):
    def setUp(self):
        self.session_data = (1, 101, 201, 'Test notes', 60)
        self.session = TherapySession(*self.session_data)

    def test_init(self):
        self.assertEqual(self.session.id, 1)
        self.assertEqual(self.session.appointment_id, 101)
        self.assertEqual(self.session.clinic_id, 201)
        self.assertEqual(self.session.notes, 'Test notes')
        self.assertEqual(self.session.duration_minutes, 60)

    def test_to_dict(self):
        expected_dict = {
            "id": 1,
            "appointment_id": 101,
            "clinic_id": 201,
            "notes": 'Test notes',
            "duration_minutes": 60
        }
        self.assertEqual(self.session.to_dict(), expected_dict)

    @patch('application.interface.backend.models.therapy_session.get_db')
    def test_get_all_for_appointment(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = [self.session_data]

        results = TherapySession.get_all_for_appointment(101)

        self.assertEqual(len(results), 1)
        self.assertIsInstance(results[0], TherapySession)
        self.assertEqual(results[0].appointment_id, 101)
        mock_cursor.execute.assert_called_once()

    @patch('application.interface.backend.models.therapy_session.get_db')
    def test_create(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = self.session_data

        new_session = TherapySession.create(101, 201, 'Test notes', 60)

        self.assertIsInstance(new_session, TherapySession)
        self.assertEqual(new_session.appointment_id, 101)
        mock_db.commit.assert_called_once()

if __name__ == '__main__':
    unittest.main()
