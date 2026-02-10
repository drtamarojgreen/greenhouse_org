from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from .auth_handler import mfa_required
from ..models.user import User
from ..utils.audit_logger import audit_log

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/users', methods=['GET'])
@jwt_required()
@mfa_required
def get_users():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin privileges required'}), 403

    users = User.get_all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@mfa_required
def get_user(user_id):
    current_user_id = get_jwt_identity()
    claims = get_jwt()

    # Allow admin or self-access
    if str(current_user_id) != str(user_id) and claims.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized access'}), 403

    user = User.get_by_id(user_id)
    if user:
        return jsonify(user.to_dict())
    return jsonify({'message': 'User not found'}), 404

@user_bp.route('/users', methods=['POST'])
@jwt_required()
@mfa_required
@audit_log('CREATE', 'user')
def create_user():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin privileges required'}), 403

    data = request.get_json()
    user = User.create(data['email'], data['full_name'], data['role_id'], data.get('manager_id'))
    return jsonify(user.to_dict()), 201
