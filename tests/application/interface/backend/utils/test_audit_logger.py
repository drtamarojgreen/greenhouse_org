import unittest
from unittest.mock import patch, MagicMock
import logging
from datetime import datetime

from application.interface.backend.utils.audit_logger import AuditLogger

class TestAuditLogger(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Disable logging for the duration of this test class
        logging.disable(logging.CRITICAL)

    @classmethod
    def tearDownClass(cls):
        # Re-enable logging after the test class has run
        logging.disable(logging.NOTSET)

    def setUp(self):
        # Create a new logger for each test to ensure isolation
        self.logger = AuditLogger()
        self.logger.logger = MagicMock()

    def tearDown(self):
        # Clean up any patches to avoid side effects between tests
        patch.stopall()

    @patch('application.interface.backend.utils.audit_logger.get_db')
    def test_log_access_with_db(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor

        self.logger.log_access(
            user_id='test_user',
            action='VIEW',
            resource_type='patient',
            resource_id='123',
            ip_address='127.0.0.1',
            user_agent='test_agent',
            status='success',
            details='test details'
        )
        self.logger.logger.info.assert_called_once()
        mock_cursor.execute.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_log_authentication(self):
        self.logger.log_authentication(
            user_id='test_user',
            email='test@example.com',
            action='LOGIN',
            ip_address='127.0.0.1',
            status='success'
        )
        self.logger.logger.info.assert_called_once()

    def test_log_data_export(self):
        self.logger.log_data_export(
            user_id='test_user',
            export_type='patient_data',
            record_count=10,
            ip_address='127.0.0.1'
        )
        self.logger.logger.info.assert_called_once()

    def test_log_consent_change(self):
        self.logger.log_consent_change(
            patient_id='patient_123',
            consent_type='data_sharing',
            granted=True,
            user_id='user_456',
            ip_address='127.0.0.1'
        )
        self.logger.logger.info.assert_called_once()

    def test_log_security_event(self):
        self.logger.log_security_event(
            event_type='FAILED_LOGIN',
            user_id='user_789',
            ip_address='127.0.0.1',
            details='Invalid password'
        )
        self.logger.logger.warning.assert_called_once()

if __name__ == '__main__':
    unittest.main()
