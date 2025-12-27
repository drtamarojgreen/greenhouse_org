import unittest
import os
from cryptography.fernet import Fernet

from application.interface.backend.utils.encryption import (
    FieldEncryption,
    DataMasking,
    hash_password,
    verify_password
)

class TestEncryption(unittest.TestCase):

    def setUp(self):
        # Generate a key for testing
        self.key = Fernet.generate_key()
        os.environ['FIELD_ENCRYPTION_KEY'] = self.key.decode()
        self.encryptor = FieldEncryption()

    def test_field_encryption(self):
        plaintext = "This is a secret message."
        encrypted = self.encryptor.encrypt(plaintext)
        self.assertIsNotNone(encrypted)
        self.assertNotEqual(plaintext, encrypted)

        decrypted = self.encryptor.decrypt(encrypted)
        self.assertEqual(plaintext, decrypted)

    def test_encryption_with_none(self):
        self.assertIsNone(self.encryptor.encrypt(None))
        self.assertIsNone(self.encryptor.decrypt(None))

class TestDataMasking(unittest.TestCase):

    def test_mask_email(self):
        self.assertEqual(DataMasking.mask_email('test@example.com'), 't**t@example.com')
        self.assertEqual(DataMasking.mask_email('ab@example.com'), '**@example.com')
        self.assertEqual(DataMasking.mask_email(None), None)

    def test_mask_phone(self):
        self.assertEqual(DataMasking.mask_phone('123-456-7890'), '***-***-7890')
        self.assertEqual(DataMasking.mask_phone(None), None)

    def test_mask_ssn(self):
        self.assertEqual(DataMasking.mask_ssn('123-45-6789'), '***-**-6789')
        self.assertEqual(DataMasking.mask_ssn(None), None)

    def test_mask_name(self):
        self.assertEqual(DataMasking.mask_name("John Doe"), "J*** D**")
        self.assertEqual(DataMasking.mask_name("A"), "*")

    def test_is_phi_field(self):
        self.assertTrue(DataMasking.is_phi_field('ssn'))
        self.assertTrue(DataMasking.is_phi_field('date_of_birth'))
        self.assertFalse(DataMasking.is_phi_field('some_other_field'))

class TestPasswordHashing(unittest.TestCase):

    def test_hash_and_verify_password(self):
        password = "mysecretpassword"
        hashed_password, salt = hash_password(password)

        self.assertTrue(verify_password(password, hashed_password, salt))
        self.assertFalse(verify_password("wrongpassword", hashed_password, salt))

if __name__ == '__main__':
    unittest.main()
