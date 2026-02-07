import unittest
import json
import os
import pyotp
from cryptography.fernet import Fernet
from application.interface.backend.app import app
from application.interface.backend.database import get_db
from application.interface.backend.utils.encryption import FieldEncryption

class TestLoginIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Generate a field encryption key for testing if not set
        if not os.environ.get('FIELD_ENCRYPTION_KEY'):
            os.environ['FIELD_ENCRYPTION_KEY'] = Fernet.generate_key().decode()

        app.config['TESTING'] = True
        # Ensure we use the right DB config
        app.config['DB_NAME'] = os.environ.get('DB_NAME', 'wellness')
        app.config['DB_USER'] = os.environ.get('DB_USER', 'postgres')
        app.config['DB_PASSWORD'] = os.environ.get('DB_PASSWORD', '')
        app.config['DB_HOST'] = os.environ.get('DB_HOST', 'localhost')

        cls.client = app.test_client()
        # Initialize FieldEncryption with the key from environment
        cls.field_encryption = FieldEncryption()

    def setUp(self):
        self.app_context = app.app_context()
        self.app_context.push()
        self.db = get_db()
        self.cur = self.db.cursor()

        # Clean up test users to ensure repeatability
        self.cur.execute("DELETE FROM users WHERE email LIKE 'test_%@example.com'")
        self.db.commit()

    def tearDown(self):
        if self.cur:
            self.cur.close()
        if self.app_context:
            self.app_context.pop()

    def test_successful_login_flow(self):
        """Test full login flow including password and MFA"""
        # 1. Register a user
        email = "test_success@example.com"
        password = "Password123!"
        full_name = "Test User"
        role_id = 1 # patient

        reg_data = {
            'email': email,
            'password': password,
            'full_name': full_name,
            'role_id': role_id
        }

        response = self.client.post('/api/auth/register',
                                    data=json.dumps(reg_data),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['mfa_required'])
        user_id = data['user']['id']

        # 2. Get MFA secret from DB to generate a valid TOTP code
        self.cur.execute("SELECT secret FROM mfa_secrets WHERE user_id = %s AND is_active = TRUE", (user_id,))
        encrypted_secret = self.cur.fetchone()[0]
        mfa_secret = self.field_encryption.decrypt(encrypted_secret)

        totp = pyotp.TOTP(mfa_secret)
        mfa_code = totp.now()

        # 3. Login Step 1: Provide correct email and password
        login_data = {
            'email': email,
            'password': password
        }
        response = self.client.post('/api/auth/login',
                                    data=json.dumps(login_data),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('temp_token', data)
        temp_token = data['temp_token']

        # 4. Login Step 2: Provide correct MFA code
        mfa_data = {
            'mfa_code': mfa_code
        }
        response = self.client.post('/api/auth/mfa/verify',
                                    data=json.dumps(mfa_data),
                                    content_type='application/json',
                                    headers={'Authorization': f'Bearer {temp_token}'})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('access_token', data)
        self.assertIn('refresh_token', data)
        self.assertEqual(data['user']['email'], email)

    def test_login_invalid_password(self):
        """Test login failure with an incorrect password"""
        # Register a user first
        email = "test_wrong_pass@example.com"
        password = "Password123!"
        reg_data = {'email': email, 'password': password, 'full_name': 'Test User', 'role_id': 1}
        self.client.post('/api/auth/register', data=json.dumps(reg_data), content_type='application/json')

        # Attempt login with incorrect password
        login_data = {'email': email, 'password': 'WrongPassword!'}
        response = self.client.post('/api/auth/login', data=json.dumps(login_data), content_type='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(json.loads(response.data)['error'], 'Invalid credentials')

    def test_login_invalid_email(self):
        """Test login failure with a non-existent email"""
        login_data = {'email': 'nonexistent@example.com', 'password': 'Password123!'}
        response = self.client.post('/api/auth/login', data=json.dumps(login_data), content_type='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(json.loads(response.data)['error'], 'Invalid credentials')

    def test_login_invalid_mfa(self):
        """Test MFA verification failure with an incorrect code"""
        # Register and get temp_token
        email = "test_wrong_mfa@example.com"
        password = "Password123!"
        reg_data = {'email': email, 'password': password, 'full_name': 'Test User', 'role_id': 1}
        self.client.post('/api/auth/register', data=json.dumps(reg_data), content_type='application/json')

        login_data = {'email': email, 'password': password}
        response = self.client.post('/api/auth/login', data=json.dumps(login_data), content_type='application/json')
        temp_token = json.loads(response.data)['temp_token']

        # Verify MFA with incorrect 6-digit code
        mfa_data = {'mfa_code': '000000'}
        response = self.client.post('/api/auth/mfa/verify',
                                    data=json.dumps(mfa_data),
                                    content_type='application/json',
                                    headers={'Authorization': f'Bearer {temp_token}'})
        self.assertEqual(response.status_code, 401)
        self.assertEqual(json.loads(response.data)['error'], 'Invalid MFA code')

if __name__ == '__main__':
    unittest.main()
