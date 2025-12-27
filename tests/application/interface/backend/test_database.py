import unittest
from unittest.mock import patch, MagicMock
from flask import Flask

from application.interface.backend.database import get_db, close_db, init_app

class TestDatabase(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)
        init_app(self.app)

    @patch('application.interface.backend.database.psycopg2.connect')
    def test_get_db(self, mock_connect):
        with self.app.app_context():
            mock_conn = MagicMock()
            mock_connect.return_value = mock_conn

            db = get_db()
            self.assertIsNotNone(db)
            self.assertEqual(db, mock_conn)

            # Test that the same connection is returned on subsequent calls
            db2 = get_db()
            self.assertEqual(db, db2)
            mock_connect.assert_called_once()

    def test_close_db(self):
        with self.app.app_context():
            with patch('application.interface.backend.database.psycopg2.connect') as mock_connect:
                mock_conn = MagicMock()
                mock_connect.return_value = mock_conn

                # Get a database connection
                db = get_db()

        # The app context is now closed, which should trigger close_db
        mock_conn.close.assert_called_once()


if __name__ == '__main__':
    unittest.main()
