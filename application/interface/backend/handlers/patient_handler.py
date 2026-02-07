from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from .auth_handler import mfa_required
from ..models.patient import Patient

patient_bp = Blueprint('patient_bp', __name__)

@patient_bp.route('/patients', methods=['GET'])
@jwt_required()
@mfa_required
def get_patients():
    claims = get_jwt()
    if claims.get('role') not in ['clinician', 'admin']:
        return jsonify({'error': 'Clinician or Admin privileges required'}), 403

    patients = Patient.get_all()
    return jsonify([patient.to_dict() for patient in patients])

@patient_bp.route('/patients/<int:patient_id>', methods=['GET'])
@jwt_required()
@mfa_required
def get_patient(patient_id):
    current_user_id = get_jwt_identity()
    claims = get_jwt()

    patient = Patient.get_by_id(patient_id)
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404

    # Allow clinician, admin, or the patient themselves
    if str(current_user_id) != str(patient.user_id) and claims.get('role') not in ['clinician', 'admin']:
        return jsonify({'error': 'Unauthorized access'}), 403

    return jsonify(patient.to_dict())

@patient_bp.route('/patients', methods=['POST'])
@jwt_required()
@mfa_required
def create_patient():
    claims = get_jwt()
    if claims.get('role') not in ['clinician', 'admin']:
        return jsonify({'error': 'Clinician or Admin privileges required'}), 403

    data = request.get_json()
    patient = Patient.create(
        data['user_id'],
        data['date_of_birth'],
        data['gender'],
        data.get('ethnicity'),
        data.get('address_line_1'),
        data.get('address_line_2'),
        data.get('state'),
        data.get('zip'),
        data.get('city')
    )
    return jsonify(patient.to_dict()), 201
