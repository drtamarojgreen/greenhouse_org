import unittest
from unittest.mock import patch, MagicMock
from application.interface.backend.utils.auth_utils import get_clinician_id

class TestAuthUtils(unittest.TestCase):

    @patch('application.interface.backend.utils.auth_utils.get_db')
    def test_get_clinician_id_found(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = (10,)

        result = get_clinician_id(1)
        self.assertEqual(result, 10)
        mock_cursor.execute.assert_called_once()

    @patch('application.interface.backend.utils.auth_utils.get_db')
    def test_get_clinician_id_not_found(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = None

        result = get_clinician_id(99)
        self.assertIsNone(result)

if __name__ == '__main__':
    unittest.main()
