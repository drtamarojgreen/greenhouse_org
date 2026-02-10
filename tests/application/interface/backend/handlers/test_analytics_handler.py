import unittest
import json
from unittest.mock import patch, MagicMock
from flask import Flask
from datetime import datetime
from flask_jwt_extended import JWTManager

from application.interface.backend.handlers.analytics_handler import analytics_bp

class TestAnalyticsHandler(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['JWT_SECRET_KEY'] = 'test-secret'
        self.app.config['JWT_TOKEN_LOCATION'] = ['headers']
        self.app.register_blueprint(analytics_bp, url_prefix='/api')
        self.jwt = JWTManager(self.app)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    @patch('application.interface.backend.handlers.analytics_handler.get_jwt_identity')
    @patch('application.interface.backend.handlers.auth_handler.get_jwt')
    @patch('application.interface.backend.handlers.analytics_handler.get_jwt')
    @patch('application.interface.backend.handlers.analytics_handler.get_db')
    def test_get_dashboard_metrics(self, mock_get_db, mock_get_jwt_analytics, mock_get_jwt_auth, mock_get_jwt_identity):
        mock_get_jwt_identity.return_value = 'test_user'
        mock_get_jwt_auth.return_value = {'role': 'admin', 'mfa_verified': True}
        mock_get_jwt_analytics.return_value = {'role': 'admin', 'mfa_verified': True}
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = [0, 0, 0, 0]
        mock_cursor.fetchall.return_value = []

        with self.app.test_request_context():
            from flask_jwt_extended import create_access_token
            access_token = create_access_token(identity='test_user')

        response = self.client.get('/api/analytics/dashboard', headers={'Authorization': f'Bearer {access_token}'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('metrics', json.loads(response.data))

    @patch('application.interface.backend.handlers.analytics_handler.get_jwt_identity')
    @patch('application.interface.backend.handlers.auth_handler.get_jwt')
    @patch('application.interface.backend.handlers.analytics_handler.get_jwt')
    @patch('application.interface.backend.handlers.analytics_handler.get_db')
    def test_get_trends(self, mock_get_db, mock_get_jwt_analytics, mock_get_jwt_auth, mock_get_jwt_identity):
        mock_get_jwt_identity.return_value = 'test_user'
        mock_get_jwt_auth.return_value = {'role': 'admin', 'mfa_verified': True}
        mock_get_jwt_analytics.return_value = {'role': 'admin', 'mfa_verified': True}
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = []

        with self.app.test_request_context():
            from flask_jwt_extended import create_access_token
            access_token = create_access_token(identity='test_user')

        response = self.client.get('/api/analytics/trends', headers={'Authorization': f'Bearer {access_token}'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('data', json.loads(response.data))

    @patch('application.interface.backend.handlers.analytics_handler.get_jwt_identity')
    @patch('application.interface.backend.handlers.auth_handler.get_jwt')
    @patch('application.interface.backend.handlers.analytics_handler.get_jwt')
    @patch('application.interface.backend.handlers.analytics_handler.get_db')
    def test_generate_report(self, mock_get_db, mock_get_jwt_analytics, mock_get_jwt_auth, mock_get_jwt_identity):
        mock_get_jwt_identity.return_value = 'test_user'
        mock_get_jwt_auth.return_value = {'role': 'admin', 'mfa_verified': True}
        mock_get_jwt_analytics.return_value = {'role': 'admin', 'mfa_verified': True}
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = []

        with self.app.test_request_context():
            from flask_jwt_extended import create_access_token
            access_token = create_access_token(identity='test_user')

        data = {'report_type': 'patient_summary'}
        response = self.client.post('/api/analytics/reports/generate', data=json.dumps(data), content_type='application/json', headers={'Authorization': f'Bearer {access_token}'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('data', json.loads(response.data))

    @patch('application.interface.backend.handlers.analytics_handler.get_jwt_identity')
    @patch('application.interface.backend.handlers.auth_handler.get_jwt')
    @patch('application.interface.backend.handlers.analytics_handler.get_jwt')
    @patch('application.interface.backend.handlers.analytics_handler.get_db')
    def test_get_trends_clamping(self, mock_get_db, mock_get_jwt_analytics, mock_get_jwt_auth, mock_get_jwt_identity):
        mock_get_jwt_identity.return_value = 'test_user'
        mock_get_jwt_auth.return_value = {'role': 'admin', 'mfa_verified': True}
        mock_get_jwt_analytics.return_value = {'role': 'admin', 'mfa_verified': True}
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = []

        with self.app.test_request_context():
            from flask_jwt_extended import create_access_token
            access_token = create_access_token(identity='test_user')

        # Test too many days
        response = self.client.get('/api/analytics/trends?days=1000', headers={'Authorization': f'Bearer {access_token}'})
        self.assertEqual(response.status_code, 200)
        # Clamped to 365 days ago
        call_args = mock_cursor.execute.call_args[0]
        start_date = call_args[1][0]
        self.assertTrue((datetime.now() - start_date).days >= 365)

    @patch('application.interface.backend.handlers.analytics_handler.get_jwt_identity')
    @patch('application.interface.backend.handlers.auth_handler.get_jwt')
    @patch('application.interface.backend.handlers.analytics_handler.get_jwt')
    def test_generate_report_validation(self, mock_get_jwt_analytics, mock_get_jwt_auth, mock_get_jwt_identity):
        mock_get_jwt_identity.return_value = 'test_user'
        mock_get_jwt_auth.return_value = {'role': 'admin', 'mfa_verified': True}
        mock_get_jwt_analytics.return_value = {'role': 'admin', 'mfa_verified': True}

        with self.app.test_request_context():
            from flask_jwt_extended import create_access_token
            access_token = create_access_token(identity='test_user')

        # Test invalid report type
        data = {'report_type': 'invalid'}
        response = self.client.post('/api/analytics/reports/generate', data=json.dumps(data), content_type='application/json', headers={'Authorization': f'Bearer {access_token}'})
        self.assertEqual(response.status_code, 400)

        # Test invalid date range
        data = {'report_type': 'patient_summary', 'start_date': '2026-01-01', 'end_date': '2024-01-01'}
        response = self.client.post('/api/analytics/reports/generate', data=json.dumps(data), content_type='application/json', headers={'Authorization': f'Bearer {access_token}'})
        self.assertEqual(response.status_code, 400)


if __name__ == '__main__':
    unittest.main()
