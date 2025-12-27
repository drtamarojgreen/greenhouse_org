import unittest
from unittest.mock import patch
import os

from application.interface.backend.config import get_config, ProductionConfig

class TestConfig(unittest.TestCase):

    def test_development_config(self):
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            config = get_config()
            self.assertTrue(config.DEBUG)
            self.assertFalse(config.TESTING)

    def test_testing_config(self):
        with patch.dict(os.environ, {'FLASK_ENV': 'testing'}):
            config = get_config()
            self.assertTrue(config.TESTING)
            self.assertTrue(config.DEBUG)
            self.assertIn('wellness_test', config.SQLALCHEMY_DATABASE_URI)

    @patch('application.interface.backend.config.ProductionConfig.validate')
    def test_production_config(self, mock_validate):
        with patch.dict(os.environ, {
            'FLASK_ENV': 'production',
            'SECRET_KEY': 'prod-secret',
            'JWT_SECRET_KEY': 'prod-jwt-secret',
            'DB_PASSWORD': 'prod-db-password',
            'FIELD_ENCRYPTION_KEY': 'prod-encryption-key'
        }):
            config = get_config()
            self.assertFalse(config.DEBUG)
            self.assertFalse(config.TESTING)
            mock_validate.assert_called_once()


    def test_production_config_validation(self):
        with patch.dict(os.environ, {'FLASK_ENV': 'production'}):
            with self.assertRaises(ValueError):
                get_config()

        with patch.dict(os.environ, {
            'FLASK_ENV': 'production',
            'SECRET_KEY': 'dev-secret-key-change-in-production' # Invalid key
        }):
            with self.assertRaises(ValueError):
                get_config()

if __name__ == '__main__':
    unittest.main()
