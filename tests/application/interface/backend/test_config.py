import unittest
from unittest.mock import patch
import os

from application.interface.backend.config import get_config, ProductionConfig

class TestConfig(unittest.TestCase):

    def test_development_config(self):
        with patch.dict(os.environ, {
            'FLASK_ENV': 'development',
            'SECRET_KEY': 'dev-secret-key-at-least-32-chars-long',
            'JWT_SECRET_KEY': 'dev-jwt-secret-at-least-32-chars-long'
        }):
            config = get_config()
            self.assertTrue(config.DEBUG)
            self.assertFalse(config.TESTING)

    def test_testing_config(self):
        with patch.dict(os.environ, {
            'FLASK_ENV': 'testing',
            'SECRET_KEY': 'test-secret-key-at-least-32-chars-long',
            'JWT_SECRET_KEY': 'test-jwt-secret-at-least-32-chars-long'
        }):
            config = get_config()
            self.assertTrue(config.TESTING)
            self.assertTrue(config.DEBUG)
            self.assertIn('wellness_test', config.SQLALCHEMY_DATABASE_URI)

    @patch('application.interface.backend.config.ProductionConfig.validate')
    def test_production_config(self, mock_validate):
        with patch.dict(os.environ, {
            'FLASK_ENV': 'production',
            'SECRET_KEY': 'prod-secret-key-at-least-32-chars-long',
            'JWT_SECRET_KEY': 'prod-jwt-secret-at-least-32-chars-long',
            'DB_PASSWORD': 'prod-db-password',
            'FIELD_ENCRYPTION_KEY': 'prod-encryption-key'
        }):
            config = get_config()
            self.assertFalse(config.DEBUG)
            self.assertFalse(config.TESTING)
            mock_validate.assert_called_once()


    def test_production_config_validation(self):
        # Missing keys
        with patch.dict(os.environ, {'FLASK_ENV': 'production'}, clear=True):
            # Manually trigger validation with empty config to simulate missing env vars
            with patch('application.interface.backend.config.ProductionConfig.SECRET_KEY', None):
                with patch('application.interface.backend.config.ProductionConfig.JWT_SECRET_KEY', None):
                    with self.assertRaises(ValueError):
                        get_config()

        # Key too short
        with patch.dict(os.environ, {'FLASK_ENV': 'production'}):
            with patch('application.interface.backend.config.ProductionConfig.SECRET_KEY', 'short'):
                with patch('application.interface.backend.config.ProductionConfig.JWT_SECRET_KEY', 'also-short'):
                    with patch('application.interface.backend.config.ProductionConfig.DB_PASSWORD', 'pass'):
                        with patch('application.interface.backend.config.ProductionConfig.FIELD_ENCRYPTION_KEY', 'key'):
                            with self.assertRaises(ValueError) as cm:
                                get_config()
                            self.assertIn("SECRET_KEY_too_short", str(cm.exception))

        # Insecure rate limit default
        with patch.dict(os.environ, {'FLASK_ENV': 'production'}):
            with patch('application.interface.backend.config.ProductionConfig.SECRET_KEY', 'a' * 32):
                with patch('application.interface.backend.config.ProductionConfig.JWT_SECRET_KEY', 'b' * 32):
                    with patch('application.interface.backend.config.ProductionConfig.DB_PASSWORD', 'pass'):
                        with patch('application.interface.backend.config.ProductionConfig.FIELD_ENCRYPTION_KEY', 'key'):
                            with patch('application.interface.backend.config.ProductionConfig.RATELIMIT_STORAGE_URL', 'memory://'):
                                with self.assertRaises(ValueError) as cm:
                                    get_config()
                                self.assertIn("RATELIMIT_STORAGE_URL_INSECURE_DEFAULT", str(cm.exception))

if __name__ == '__main__':
    unittest.main()
