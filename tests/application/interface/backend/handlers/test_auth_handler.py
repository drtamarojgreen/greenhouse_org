import unittest
import json
from unittest.mock import patch, MagicMock
from flask import Flask
from datetime import datetime
from flask_jwt_extended import JWTManager

from application.interface.backend.handlers.auth_handler import auth_bp
from application.interface.backend.utils.validators import Validators, ValidationError

class TestAuthHandler(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['JWT_SECRET_KEY'] = 'test-secret'
        self.app.config['JWT_TOKEN_LOCATION'] = ['headers']
        self.app.register_blueprint(auth_bp, url_prefix='/api')
        self.jwt = JWTManager(self.app)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    @patch('application.interface.backend.handlers.auth_handler.get_db')
    @patch('application.interface.backend.handlers.auth_handler.bcrypt')
    @patch('application.interface.backend.handlers.auth_handler.datetime')
    def test_register(self, mock_datetime, mock_bcrypt, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = None
        mock_bcrypt.generate_password_hash.return_value = b'hashed_password'
        mock_datetime.now.return_value = datetime.now()

        # Mock the return value of the INSERT query
        mock_cursor.fetchone.side_effect = [
            None, # For the initial check if the user exists
            (1, 'test@example.com', 'Test User', 1, datetime.now()) # For the RETURNING clause
        ]

        data = {'email': 'test@example.com', 'password': 'Password123!', 'full_name': 'Test User', 'role_id': 1}
        response = self.client.post('/api/auth/register', data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertIn('mfa_secret', json.loads(response.data))

    @patch('application.interface.backend.handlers.auth_handler.get_db')
    def test_login(self, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = (1, 'test@example.com', 'Test User', 1, 'patient')

        data = {'email': 'test@example.com', 'password': 'Password123!'}
        response = self.client.post('/api/auth/login', data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('temp_token', json.loads(response.data))

    @patch('application.interface.backend.handlers.auth_handler.get_db')
    @patch('application.interface.backend.handlers.auth_handler.pyotp.TOTP')
    def test_verify_mfa(self, mock_totp, mock_get_db):
        mock_db = MagicMock()
        mock_cursor = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = (1, 'test@example.com', 'Test User', 1, 'patient')

        mock_totp_instance = MagicMock()
        mock_totp.return_value = mock_totp_instance
        mock_totp_instance.verify.return_value = True

        with self.app.test_request_context():
            from flask_jwt_extended import create_access_token
            temp_token = create_access_token(identity=1, additional_claims={'mfa_verified': False})

        data = {'mfa_code': '123456'}
        response = self.client.post('/api/auth/mfa/verify', data=json.dumps(data), content_type='application/json', headers={'Authorization': f'Bearer {temp_token}'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('access_token', json.loads(response.data))


if __name__ == '__main__':
    unittest.main()
