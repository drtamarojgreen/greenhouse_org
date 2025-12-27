import unittest
import json
from flask import Flask

from application.interface.backend.app import app

class TestApp(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_health_check(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data)['status'], 'healthy')

    def test_index(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('MediTrack Patient Portal API', json.loads(response.data)['message'])

    def test_not_found_error(self):
        response = self.client.get('/nonexistent')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(json.loads(response.data)['error'], 'Resource not found')

if __name__ == '__main__':
    unittest.main()
