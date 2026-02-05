import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
from application.interface.backend.models.message import Message

class TestMessage(unittest.TestCase):
    def setUp(self):
        self.message_data = (1, 101, 201, 'Hello', datetime(2023, 10, 27, 10, 0))
        self.message = Message(*self.message_data)

    def test_init(self):
        self.assertEqual(self.message.id, 1)
        self.assertEqual(self.message.sender_id, 101)
        self.assertEqual(self.message.receiver_id, 201)
        self.assertEqual(self.message.message, 'Hello')
        self.assertEqual(self.message.sent_at, datetime(2023, 10, 27, 10, 0))

    def test_to_dict(self):
        expected_dict = {
            "id": 1,
            "sender_id": 101,
            "receiver_id": 201,
            "message": 'Hello',
            "sent_at": "2023-10-27T10:00:00"
        }
        self.assertEqual(self.message.to_dict(), expected_dict)

    @patch('application.interface.backend.models.message.get_db')
    def test_get_all_for_user(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = [self.message_data]

        results = Message.get_all_for_user(101)

        self.assertEqual(len(results), 1)
        self.assertIsInstance(results[0], Message)
        self.assertEqual(results[0].sender_id, 101)
        mock_cursor.execute.assert_called_once()

    @patch('application.interface.backend.models.message.get_db')
    def test_create(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = self.message_data

        new_message = Message.create(101, 201, 'Hello')

        self.assertIsInstance(new_message, Message)
        self.assertEqual(new_message.sender_id, 101)
        mock_db.commit.assert_called_once()

if __name__ == '__main__':
    unittest.main()
