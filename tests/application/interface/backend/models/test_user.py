import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

from application.interface.backend.models.user import User

class TestUserModel(unittest.TestCase):

    @patch('application.interface.backend.models.user.get_db')
    def test_get_all_users(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor

        mock_cursor.fetchall.return_value = [
            (1, 'test1@example.com', 'Test User 1', 1, None, datetime.now()),
            (2, 'test2@example.com', 'Test User 2', 2, 1, datetime.now())
        ]

        users = User.get_all()
        self.assertEqual(len(users), 2)
        self.assertEqual(users[0].email, 'test1@example.com')
        mock_cursor.execute.assert_called_once_with('SELECT * FROM users;')

    @patch('application.interface.backend.models.user.get_db')
    def test_get_user_by_id(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor

        mock_cursor.fetchone.return_value = (1, 'test1@example.com', 'Test User 1', 1, None, datetime.now())

        user = User.get_by_id(1)
        self.assertIsNotNone(user)
        self.assertEqual(user.email, 'test1@example.com')
        mock_cursor.execute.assert_called_once_with('SELECT * FROM users WHERE id = %s;', (1,))

    @patch('application.interface.backend.models.user.get_db')
    def test_create_user(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor

        mock_cursor.fetchone.return_value = (1, 'new@example.com', 'New User', 2, None, datetime.now())

        user = User.create('new@example.com', 'New User', 2)
        self.assertEqual(user.email, 'new@example.com')
        mock_db.commit.assert_called_once()

    @patch('application.interface.backend.models.user.get_db')
    def test_update_user(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor

        user = User(1, 'test@example.com', 'Test User', 1, None, datetime.now())
        user.email = 'updated@example.com'
        user.update()

        mock_cursor.execute.assert_called_once()
        mock_db.commit.assert_called_once()

    @patch('application.interface.backend.models.user.get_db')
    def test_delete_user(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor

        user = User(1, 'test@example.com', 'Test User', 1, None, datetime.now())
        user.delete()

        mock_cursor.execute.assert_called_with('DELETE FROM users WHERE id = %s;', (user.id,))
        mock_db.commit.assert_called_once()


if __name__ == '__main__':
    unittest.main()
