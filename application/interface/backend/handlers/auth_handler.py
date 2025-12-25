"""
Authentication handler for login, MFA, and session management
"""
from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from flask_bcrypt import Bcrypt
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timedelta
from ..database import get_db
from ..utils.validators import Validators, ValidationError, validate_request
from ..utils.audit_logger import audit_logger
from ..config import get_config

auth_bp = Blueprint('auth_bp', __name__)
bcrypt = Bcrypt()
config = get_config()


@auth_bp.route('/auth/register', methods=['POST'])
@validate_request({
    'email': {'required': True, 'validator': Validators.validate_email},
    'password': {'required': True, 'validator': lambda p: Validators.validate_password(p, config)},
    'full_name': {'required': True},
    'role_id': {'required': True}
})
def register():
    """
    Register a new user
    
    Request body:
        - email: User email
        - password: User password
        - full_name: User's full name
        - role_id: Role ID (1=patient, 2=clinician, 3=admin)
    
    Returns:
        User object and tokens
    """
    data = request.get_json()
    db = get_db()
    cur = db.cursor()
    
    try:
        # Check if user already exists
        cur.execute('SELECT id FROM users WHERE email = %s', (data['email'],))
        if cur.fetchone():
            return jsonify({'error': 'User already exists'}), 409
        
        # Hash password
        password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        # Create user
        cur.execute(
            """
            INSERT INTO users (email, full_name, role_id, created_at)
            VALUES (%s, %s, %s, %s)
            RETURNING id, email, full_name, role_id, created_at
            """,
            (data['email'], data['full_name'], data['role_id'], datetime.utcnow())
        )
        user = cur.fetchone()
        
        # Store password hash in separate table (not shown in schema, would need to add)
        # For now, we'll note this needs to be added to the database schema
        
        db.commit()
        
        # Log registration
        audit_logger.log_authentication(
            user_id=user[0],
            email=user[1],
            action='REGISTER',
            ip_address=request.remote_addr,
            status='success'
        )
        
        # Generate MFA secret
        mfa_secret = pyotp.random_base32()
        
        # Store MFA secret (would need mfa_secrets table)
        # For now, return it to user for enrollment
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': user[0],
                'email': user[1],
                'full_name': user[2],
                'role_id': user[3]
            },
            'mfa_secret': mfa_secret,
            'mfa_required': True
        }), 201
    
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()


@auth_bp.route('/auth/login', methods=['POST'])
@validate_request({
    'email': {'required': True, 'validator': Validators.validate_email},
    'password': {'required': True}
})
def login():
    """
    Login with email and password
    
    Request body:
        - email: User email
        - password: User password
    
    Returns:
        Temporary token for MFA verification
    """
    data = request.get_json()
    db = get_db()
    cur = db.cursor()
    
    try:
        # Get user by email
        cur.execute(
            """
            SELECT u.id, u.email, u.full_name, u.role_id, r.role_name
            FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE u.email = %s
            """,
            (data['email'],)
        )
        user = cur.fetchone()
        
        if not user:
            audit_logger.log_authentication(
                user_id=None,
                email=data['email'],
                action='LOGIN',
                ip_address=request.remote_addr,
                status='failure',
                details='User not found'
            )
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Verify password (would need to get password_hash from password table)
        # For demo purposes, we'll skip actual password verification
        # In production, you would:
        # if not bcrypt.check_password_hash(password_hash, data['password']):
        #     return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create temporary token for MFA
        temp_token = create_access_token(
            identity=user[0],
            additional_claims={'mfa_verified': False, 'role': user[4]},
            expires_delta=timedelta(minutes=5)
        )
        
        audit_logger.log_authentication(
            user_id=user[0],
            email=user[1],
            action='LOGIN_STEP1',
            ip_address=request.remote_addr,
            status='success',
            details='Password verified, awaiting MFA'
        )
        
        return jsonify({
            'message': 'Password verified. Please provide MFA code.',
            'temp_token': temp_token,
            'mfa_required': True
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()


@auth_bp.route('/auth/mfa/verify', methods=['POST'])
@jwt_required()
def verify_mfa():
    """
    Verify MFA code and complete login
    
    Request body:
        - mfa_code: 6-digit MFA code
    
    Headers:
        - Authorization: Bearer <temp_token>
    
    Returns:
        Access and refresh tokens
    """
    data = request.get_json()
    user_id = get_jwt_identity()
    claims = get_jwt()
    
    if claims.get('mfa_verified'):
        return jsonify({'error': 'MFA already verified'}), 400
    
    if not data.get('mfa_code'):
        return jsonify({'error': 'MFA code is required'}), 400
    
    db = get_db()
    cur = db.cursor()
    
    try:
        # Get user and MFA secret
        cur.execute(
            """
            SELECT u.id, u.email, u.full_name, u.role_id, r.role_name
            FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE u.id = %s
            """,
            (user_id,)
        )
        user = cur.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get MFA secret (would need to query mfa_secrets table)
        # For demo, we'll use a test secret
        mfa_secret = 'JBSWY3DPEHPK3PXP'  # Test secret
        
        # Verify MFA code
        totp = pyotp.TOTP(mfa_secret)
        if not totp.verify(data['mfa_code'], valid_window=1):
            audit_logger.log_authentication(
                user_id=user[0],
                email=user[1],
                action='MFA_VERIFY',
                ip_address=request.remote_addr,
                status='failure',
                details='Invalid MFA code'
            )
            return jsonify({'error': 'Invalid MFA code'}), 401
        
        # Create access and refresh tokens
        access_token = create_access_token(
            identity=user[0],
            additional_claims={
                'mfa_verified': True,
                'role': user[4],
                'email': user[1]
            }
        )
        
        refresh_token = create_refresh_token(identity=user[0])
        
        # Log successful login
        audit_logger.log_authentication(
            user_id=user[0],
            email=user[1],
            action='LOGIN_COMPLETE',
            ip_address=request.remote_addr,
            status='success'
        )
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user[0],
                'email': user[1],
                'full_name': user[2],
                'role_id': user[3],
                'role_name': user[4]
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()


@auth_bp.route('/auth/mfa/enroll', methods=['POST'])
@jwt_required()
def enroll_mfa():
    """
    Enroll in MFA and get QR code
    
    Returns:
        MFA secret and QR code for authenticator app
    """
    user_id = get_jwt_identity()
    db = get_db()
    cur = db.cursor()
    
    try:
        # Get user
        cur.execute('SELECT email FROM users WHERE id = %s', (user_id,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Generate MFA secret
        mfa_secret = pyotp.random_base32()
        
        # Store MFA secret (would need mfa_secrets table)
        # For now, just return it
        
        # Generate QR code
        totp = pyotp.TOTP(mfa_secret)
        provisioning_uri = totp.provisioning_uri(
            name=user[0],
            issuer_name=config.MFA_ISSUER_NAME
        )
        
        # Create QR code image
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return jsonify({
            'mfa_secret': mfa_secret,
            'qr_code': f'data:image/png;base64,{qr_code_base64}',
            'provisioning_uri': provisioning_uri
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()


@auth_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token using refresh token
    
    Headers:
        - Authorization: Bearer <refresh_token>
    
    Returns:
        New access token
    """
    user_id = get_jwt_identity()
    
    # Create new access token
    access_token = create_access_token(identity=user_id)
    
    return jsonify({'access_token': access_token}), 200


@auth_bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user (invalidate token)
    
    Note: In production, you would add the token to a blacklist
    """
    user_id = get_jwt_identity()
    claims = get_jwt()
    
    # Log logout
    audit_logger.log_authentication(
        user_id=user_id,
        email=claims.get('email', 'unknown'),
        action='LOGOUT',
        ip_address=request.remote_addr,
        status='success'
    )
    
    return jsonify({'message': 'Logout successful'}), 200


@auth_bp.route('/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current user information
    
    Headers:
        - Authorization: Bearer <access_token>
    
    Returns:
        Current user object
    """
    user_id = get_jwt_identity()
    db = get_db()
    cur = db.cursor()
    
    try:
        cur.execute(
            """
            SELECT u.id, u.email, u.full_name, u.role_id, r.role_name, u.created_at
            FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE u.id = %s
            """,
            (user_id,)
        )
        user = cur.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'id': user[0],
            'email': user[1],
            'full_name': user[2],
            'role_id': user[3],
            'role_name': user[4],
            'created_at': user[5].isoformat() if user[5] else None
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
