import unittest
import json
import os
import pyotp
from cryptography.fernet import Fernet
from application.interface.backend.app import app
from application.interface.backend.database import get_db
from application.interface.backend.utils.encryption import FieldEncryption
from flask_jwt_extended import create_access_token

class TestSecurityHardening(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not os.environ.get('FIELD_ENCRYPTION_KEY'):
            os.environ['FIELD_ENCRYPTION_KEY'] = Fernet.generate_key().decode()

        app.config['TESTING'] = True
        app.config['DB_NAME'] = os.environ.get('DB_NAME', 'wellness')
        app.config['DB_USER'] = os.environ.get('DB_USER', 'postgres')
        app.config['DB_PASSWORD'] = os.environ.get('DB_PASSWORD', 'postgres')
        app.config['DB_HOST'] = os.environ.get('DB_HOST', 'localhost')

        cls.client = app.test_client()
        cls.field_encryption = FieldEncryption()

    def setUp(self):
        self.app_context = app.app_context()
        self.app_context.push()
        self.db = get_db()
        self.cur = self.db.cursor()

        # Clean up patients first due to FK constraints
        self.cur.execute("DELETE FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'sec_%@example.com')")
        self.cur.execute("DELETE FROM users WHERE email LIKE 'sec_%@example.com'")
        self.db.commit()

    def tearDown(self):
        if self.cur:
            self.cur.close()
        if self.app_context:
            self.app_context.pop()

    def test_registration_role_locking(self):
        """Test that public registration forces patient role (id=1)"""
        reg_data = {
            'email': 'sec_admin@example.com',
            'password': 'Password123!',
            'full_name': 'Hacker',
            'role_id': 3 # Attempting to register as admin
        }

        response = self.client.post('/api/auth/register',
                                    data=json.dumps(reg_data),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)

        # Verify role_id is 1, not 3
        self.assertEqual(data['user']['role_id'], 1)

        # Verify in DB
        self.cur.execute("SELECT role_id FROM users WHERE email = %s", (reg_data['email'],))
        self.assertEqual(self.cur.fetchone()[0], 1)

    def test_mfa_enforcement(self):
        """Test that protected endpoints require mfa_verified=True"""
        # Create a token with mfa_verified=False
        with app.app_context():
            token = create_access_token(identity='1', additional_claims={'mfa_verified': False, 'role': 'patient'})

        response = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.data)['error'], 'MFA verification required')

    def test_rbac_user_management(self):
        """Test that only admins can access user list"""
        # 1. Access as patient (blocked)
        with app.app_context():
            patient_token = create_access_token(identity='1', additional_claims={'mfa_verified': True, 'role': 'patient'})

        response = self.client.get('/api/users', headers={'Authorization': f'Bearer {patient_token}'})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.data)['error'], 'Admin privileges required')

        # 2. Access as admin (allowed)
        with app.app_context():
            admin_token = create_access_token(identity='1', additional_claims={'mfa_verified': True, 'role': 'admin'})

        response = self.client.get('/api/users', headers={'Authorization': f'Bearer {admin_token}'})
        self.assertEqual(response.status_code, 200)

    def test_rbac_patient_data(self):
        """Test that patients cannot access other patients' data"""
        # Create two patients
        self.cur.execute("INSERT INTO users (email, full_name, role_id) VALUES ('sec_p1@example.com', 'P1', 1) RETURNING id")
        p1_user_id = self.cur.fetchone()[0]
        self.cur.execute("INSERT INTO users (email, full_name, role_id) VALUES ('sec_p2@example.com', 'P2', 1) RETURNING id")
        p2_user_id = self.cur.fetchone()[0]

        self.cur.execute("INSERT INTO patients (user_id, date_of_birth, gender) VALUES (%s, '1990-01-01', 'other') RETURNING id", (p1_user_id,))
        p1_patient_id = self.cur.fetchone()[0]
        self.cur.execute("INSERT INTO patients (user_id, date_of_birth, gender) VALUES (%s, '1990-01-01', 'other') RETURNING id", (p2_user_id,))
        p2_patient_id = self.cur.fetchone()[0]
        self.db.commit()

        # Patient 1 tries to access Patient 2 data
        with app.app_context():
            p1_token = create_access_token(identity=str(p1_user_id), additional_claims={'mfa_verified': True, 'role': 'patient'})

        response = self.client.get(f'/api/patients/{p2_patient_id}', headers={'Authorization': f'Bearer {p1_token}'})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(json.loads(response.data)['error'], 'Unauthorized access')

        # Patient 1 tries to access their own data (allowed)
        response = self.client.get(f'/api/patients/{p1_patient_id}', headers={'Authorization': f'Bearer {p1_token}'})
        self.assertEqual(response.status_code, 200)

    def test_refresh_token_claims_preservation(self):
        """Test that refresh token preserves claims"""
        # Register a user
        reg_data = {'email': 'sec_refresh@example.com', 'password': 'Password123!', 'full_name': 'Refresher', 'role_id': 1}
        self.client.post('/api/auth/register', data=json.dumps(reg_data), content_type='application/json')

        # Login and get tokens
        login_data = {'email': reg_data['email'], 'password': reg_data['password']}
        resp = self.client.post('/api/auth/login', data=json.dumps(login_data), content_type='application/json')
        temp_token = json.loads(resp.data)['temp_token']

        # Verify MFA
        self.cur.execute("SELECT id FROM users WHERE email = %s", (reg_data['email'],))
        user_id = self.cur.fetchone()[0]
        self.cur.execute("SELECT secret FROM mfa_secrets WHERE user_id = %s", (user_id,))
        mfa_secret = self.field_encryption.decrypt(self.cur.fetchone()[0])
        mfa_code = pyotp.TOTP(mfa_secret).now()

        resp = self.client.post('/api/auth/mfa/verify', data=json.dumps({'mfa_code': mfa_code}),
                                content_type='application/json',
                                headers={'Authorization': f'Bearer {temp_token}'})
        refresh_token = json.loads(resp.data)['refresh_token']

        # Refresh access token
        resp = self.client.post('/api/auth/refresh', headers={'Authorization': f'Bearer {refresh_token}'})
        self.assertEqual(resp.status_code, 200)
        new_access_token = json.loads(resp.data)['access_token']

        # Verify new access token can be used on MFA-protected endpoint
        resp = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {new_access_token}'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(json.loads(resp.data)['email'], reg_data['email'])

if __name__ == '__main__':
    unittest.main()
