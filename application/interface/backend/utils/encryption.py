"""
Encryption utilities for protecting sensitive data (PHI/PII)
Implements field-level encryption for HIPAA compliance
"""
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os


class FieldEncryption:
    """Field-level encryption for sensitive data"""
    
    def __init__(self, encryption_key=None):
        """
        Initialize encryption with a key
        
        Args:
            encryption_key: Base64-encoded Fernet key. If None, uses environment variable.
        """
        if encryption_key is None:
            encryption_key = os.environ.get('FIELD_ENCRYPTION_KEY')
        
        if not encryption_key:
            raise ValueError("Encryption key not provided. Set FIELD_ENCRYPTION_KEY environment variable.")
        
        self.cipher = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
    
    def encrypt(self, plaintext):
        """
        Encrypt plaintext data
        
        Args:
            plaintext: String or bytes to encrypt
            
        Returns:
            Base64-encoded encrypted string
        """
        if plaintext is None:
            return None
        
        if isinstance(plaintext, str):
            plaintext = plaintext.encode('utf-8')
        
        encrypted = self.cipher.encrypt(plaintext)
        return base64.b64encode(encrypted).decode('utf-8')
    
    def decrypt(self, ciphertext):
        """
        Decrypt encrypted data
        
        Args:
            ciphertext: Base64-encoded encrypted string
            
        Returns:
            Decrypted string
        """
        if ciphertext is None:
            return None
        
        if isinstance(ciphertext, str):
            ciphertext = base64.b64decode(ciphertext.encode('utf-8'))
        
        decrypted = self.cipher.decrypt(ciphertext)
        return decrypted.decode('utf-8')
    
    @staticmethod
    def generate_key():
        """
        Generate a new Fernet encryption key
        
        Returns:
            Base64-encoded encryption key as string
        """
        return Fernet.generate_key().decode('utf-8')


class DataMasking:
    """Utilities for masking sensitive data in logs and displays"""
    
    @staticmethod
    def mask_email(email):
        """
        Mask email address for display
        
        Args:
            email: Email address to mask
            
        Returns:
            Masked email (e.g., j***@example.com)
        """
        if not email or '@' not in email:
            return email
        
        local, domain = email.split('@', 1)
        if len(local) <= 2:
            masked_local = '*' * len(local)
        else:
            masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
        
        return f"{masked_local}@{domain}"
    
    @staticmethod
    def mask_phone(phone):
        """
        Mask phone number for display
        
        Args:
            phone: Phone number to mask
            
        Returns:
            Masked phone (e.g., ***-***-1234)
        """
        if not phone:
            return phone
        
        # Remove non-digit characters
        digits = ''.join(c for c in phone if c.isdigit())
        
        if len(digits) < 4:
            return '*' * len(digits)
        
        return '***-***-' + digits[-4:]
    
    @staticmethod
    def mask_ssn(ssn):
        """
        Mask Social Security Number
        
        Args:
            ssn: SSN to mask
            
        Returns:
            Masked SSN (e.g., ***-**-1234)
        """
        if not ssn:
            return ssn
        
        # Remove non-digit characters
        digits = ''.join(c for c in ssn if c.isdigit())
        
        if len(digits) != 9:
            return '*' * len(digits)
        
        return f"***-**-{digits[-4:]}"
    
    @staticmethod
    def mask_name(name):
        """
        Mask name for display
        
        Args:
            name: Full name to mask
            
        Returns:
            Masked name (e.g., J*** D**)
        """
        if not name:
            return name
        
        parts = name.split()
        masked_parts = []
        
        for part in parts:
            if len(part) <= 1:
                masked_parts.append('*')
            else:
                masked_parts.append(part[0] + '*' * (len(part) - 1))
        
        return ' '.join(masked_parts)
    
    @staticmethod
    def mask_address(address):
        """
        Mask address for display
        
        Args:
            address: Address to mask
            
        Returns:
            Masked address
        """
        if not address:
            return address
        
        return '*' * len(address)
    
    @staticmethod
    def is_phi_field(field_name):
        """
        Check if a field name indicates PHI (Protected Health Information)
        
        Args:
            field_name: Name of the field to check
            
        Returns:
            Boolean indicating if field contains PHI
        """
        phi_indicators = [
            'ssn', 'social_security', 'dob', 'date_of_birth', 'birth_date',
            'phone', 'email', 'address', 'name', 'first_name', 'last_name',
            'full_name', 'medical_record', 'mrn', 'patient_id', 'diagnosis',
            'medication', 'treatment', 'insurance', 'policy_number'
        ]
        
        field_lower = field_name.lower()
        return any(indicator in field_lower for indicator in phi_indicators)


def hash_password(password, salt=None):
    """
    Hash a password using PBKDF2
    
    Args:
        password: Password to hash
        salt: Optional salt (generated if not provided)
        
    Returns:
        Tuple of (hashed_password, salt) as base64-encoded strings
    """
    if salt is None:
        salt = os.urandom(16)
    elif isinstance(salt, str):
        salt = base64.b64decode(salt)
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000
    )
    
    key = kdf.derive(password.encode('utf-8'))
    
    return (
        base64.b64encode(key).decode('utf-8'),
        base64.b64encode(salt).decode('utf-8')
    )


def verify_password(password, hashed_password, salt):
    """
    Verify a password against a hash
    
    Args:
        password: Password to verify
        hashed_password: Base64-encoded hashed password
        salt: Base64-encoded salt
        
    Returns:
        Boolean indicating if password matches
    """
    new_hash, _ = hash_password(password, salt)
    return new_hash == hashed_password
