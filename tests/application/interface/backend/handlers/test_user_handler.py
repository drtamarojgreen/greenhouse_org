import unittest
import json
from unittest.mock import patch, MagicMock
from flask import Flask
from datetime import datetime
from flask_jwt_extended import JWTManager, create_access_token

from application.interface.backend.handlers.user_handler import user_bp
from application.interface.backend.models.user import User

class TestUserHandler(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['JWT_SECRET_KEY'] = 'test-secret'
        self.app.config['JWT_TOKEN_LOCATION'] = ['headers']
        self.app.register_blueprint(user_bp, url_prefix='/api')
        self.jwt = JWTManager(self.app)
        self.client = self.app.test_client()

        with self.app.app_context():
            self.admin_token = create_access_token(
                identity='1',
                additional_claims={'mfa_verified': True, 'role': 'admin'}
            )

    @patch('application.interface.backend.models.user.User.get_all')
    def test_get_all_users(self, mock_get_all):
        mock_user = User(1, 'test@example.com', 'Test User', 1, None, datetime.now())
        mock_get_all.return_value = [mock_user]

        response = self.client.get('/api/users', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(json.loads(response.data)), 1)

    @patch('application.interface.backend.models.user.User.get_by_id')
    def test_get_user_by_id(self, mock_get_by_id):
        mock_user = User(1, 'test@example.com', 'Test User', 1, None, datetime.now())
        mock_get_by_id.return_value = mock_user

        response = self.client.get('/api/users/1', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data)['email'], 'test@example.com')

    @patch('application.interface.backend.models.user.User.create')
    def test_create_user(self, mock_create):
        mock_user = User(1, 'new@example.com', 'New User', 2, None, datetime.now())
        mock_create.return_value = mock_user

        data = {'email': 'new@example.com', 'full_name': 'New User', 'role_id': 2}
        response = self.client.post('/api/users',
                                    data=json.dumps(data),
                                    content_type='application/json',
                                    headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(json.loads(response.data)['email'], 'new@example.com')


if __name__ == '__main__':
    unittest.main()
