"""
Audit logging utilities for HIPAA compliance
Logs all access to PHI and critical system operations
"""
import logging
from datetime import datetime, UTC
from flask import request, g
from flask_jwt_extended import get_jwt_identity
from functools import wraps
from ..database import get_db


class AuditLogger:
    """Audit logger for tracking PHI access and system operations"""
    
    def __init__(self):
        self.logger = logging.getLogger('audit')
        self.logger.setLevel(logging.INFO)
        
        # Create file handler for audit logs
        handler = logging.FileHandler('logs/audit.log')
        handler.setLevel(logging.INFO)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        
        self.logger.addHandler(handler)
    
    def log_access(self, user_id, action, resource_type, resource_id, ip_address, user_agent, status='success', details=None):
        """
        Log access to a resource
        
        Args:
            user_id: ID of user performing action
            action: Action performed (VIEW, CREATE, UPDATE, DELETE, etc.)
            resource_type: Type of resource (patient, appointment, etc.)
            resource_id: ID of resource accessed
            ip_address: IP address of request
            user_agent: User agent string
            status: Status of operation (success, failure, denied)
            details: Additional details about the operation
        """
        log_entry = {
            'timestamp': datetime.now(UTC).isoformat(),
            'user_id': user_id,
            'action': action,
            'resource_type': resource_type,
            'resource_id': resource_id,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'status': status,
            'details': details
        }
        
        self.logger.info(f"AUDIT: {log_entry}")
        
        # Also write to database access_log table
        try:
            db = get_db()
            cur = db.cursor()
            cur.execute(
                """
                INSERT INTO access_log (user_id, action, ip_address, user_agent, accessed_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, f"{action}_{resource_type}_{resource_id}", ip_address, user_agent, datetime.now(UTC))
            )
            db.commit()
            cur.close()
        except Exception as e:
            self.logger.error(f"Failed to write audit log to database: {e}")
    
    def log_authentication(self, user_id, email, action, ip_address, status='success', details=None):
        """
        Log authentication events
        
        Args:
            user_id: ID of user (None if login failed)
            email: Email address used for authentication
            action: Action (LOGIN, LOGOUT, MFA_VERIFY, PASSWORD_RESET, etc.)
            ip_address: IP address of request
            status: Status of operation
            details: Additional details
        """
        log_entry = {
            'timestamp': datetime.now(UTC).isoformat(),
            'user_id': user_id,
            'email': email,
            'action': action,
            'ip_address': ip_address,
            'status': status,
            'details': details
        }
        
        self.logger.info(f"AUTH: {log_entry}")
    
    def log_data_export(self, user_id, export_type, record_count, ip_address, purpose=None):
        """
        Log data export operations (GDPR compliance)
        
        Args:
            user_id: ID of user performing export
            export_type: Type of export (patient_data, report, etc.)
            record_count: Number of records exported
            ip_address: IP address of request
            purpose: Purpose of export
        """
        log_entry = {
            'timestamp': datetime.now(UTC).isoformat(),
            'user_id': user_id,
            'action': 'DATA_EXPORT',
            'export_type': export_type,
            'record_count': record_count,
            'ip_address': ip_address,
            'purpose': purpose
        }
        
        self.logger.info(f"EXPORT: {log_entry}")
    
    def log_consent_change(self, patient_id, consent_type, granted, user_id, ip_address):
        """
        Log consent changes (GDPR compliance)
        
        Args:
            patient_id: ID of patient
            consent_type: Type of consent (data_sharing, marketing, etc.)
            granted: Boolean indicating if consent was granted or revoked
            user_id: ID of user making change
            ip_address: IP address of request
        """
        log_entry = {
            'timestamp': datetime.now(UTC).isoformat(),
            'patient_id': patient_id,
            'consent_type': consent_type,
            'granted': granted,
            'user_id': user_id,
            'ip_address': ip_address
        }
        
        self.logger.info(f"CONSENT: {log_entry}")
    
    def log_security_event(self, event_type, user_id, ip_address, details):
        """
        Log security events (failed logins, suspicious activity, etc.)
        
        Args:
            event_type: Type of security event
            user_id: ID of user (if applicable)
            ip_address: IP address
            details: Details about the event
        """
        log_entry = {
            'timestamp': datetime.now(UTC).isoformat(),
            'event_type': event_type,
            'user_id': user_id,
            'ip_address': ip_address,
            'details': details
        }
        
        self.logger.warning(f"SECURITY: {log_entry}")


# Global audit logger instance
audit_logger = AuditLogger()


def audit_log(action, resource_type):
    """
    Decorator for auditing endpoint access
    
    Args:
        action: Action being performed (VIEW, CREATE, UPDATE, DELETE)
        resource_type: Type of resource being accessed
        
    Usage:
        @audit_log('VIEW', 'patient')
        def get_patient(patient_id):
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get user ID from JWT identity
            user_id = get_jwt_identity()
            
            # Get resource ID from kwargs or args
            resource_id = kwargs.get('patient_id') or kwargs.get('user_id') or kwargs.get('id') or 'unknown'
            
            # Get request details
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent', 'unknown')
            
            try:
                # Execute the function
                result = f(*args, **kwargs)
                
                # Log successful access
                audit_logger.log_access(
                    user_id=user_id,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    status='success'
                )
                
                return result
            
            except Exception as e:
                # Log failed access
                audit_logger.log_access(
                    user_id=user_id,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    status='failure',
                    details=str(e)
                )
                raise
        
        return decorated_function
    return decorator


def log_phi_access(user_id, patient_id, field_name, ip_address):
    """
    Log access to specific PHI fields
    
    Args:
        user_id: ID of user accessing PHI
        patient_id: ID of patient whose PHI is being accessed
        field_name: Name of PHI field accessed
        ip_address: IP address of request
    """
    audit_logger.log_access(
        user_id=user_id,
        action='VIEW_PHI',
        resource_type='patient',
        resource_id=patient_id,
        ip_address=ip_address,
        user_agent=request.headers.get('User-Agent', 'unknown'),
        details=f"Accessed field: {field_name}"
    )
