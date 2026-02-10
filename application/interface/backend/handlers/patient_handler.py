from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from .auth_handler import mfa_required
from ..models.patient import Patient
from ..utils.audit_logger import audit_log
from ..database import get_db
from ..utils.auth_utils import get_clinician_id

patient_bp = Blueprint('patient_bp', __name__)

@patient_bp.route('/patients', methods=['GET'])
@jwt_required()
@mfa_required
@audit_log('VIEW', 'patient_list')
def get_patients():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')

    if role not in ['clinician', 'admin']:
        return jsonify({'error': 'Clinician or Admin privileges required'}), 403

    clinician_id = None
    if role == 'clinician':
        clinician_id = get_clinician_id(user_id)

    patients = Patient.get_all(clinician_id=clinician_id)
    # Administrative view (admin or clinician assigned to these patients)
    # see full data for patients they manage.
    mask = (role not in ['admin', 'clinician'])
    return jsonify([patient.to_dict(mask=mask) for patient in patients])

@patient_bp.route('/patients/<int:patient_id>', methods=['GET'])
@jwt_required()
@mfa_required
@audit_log('VIEW', 'patient')
def get_patient(patient_id):
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')

    patient = Patient.get_by_id(patient_id)
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404

    # Authorization and Scoping Check
    is_own_record = str(current_user_id) == str(patient.user_id)

    if role == 'admin':
        authorized = True
    elif role == 'clinician':
        clinician_id = get_clinician_id(current_user_id)
        # Check assignment link
        db = get_db()
        cur = db.cursor()
        cur.execute(
            'SELECT 1 FROM patient_clinician WHERE patient_id = %s AND clinician_id = %s',
            (patient.id, clinician_id)
        )
        authorized = cur.fetchone() is not None
        cur.close()
    elif is_own_record:
        authorized = True
    else:
        authorized = False

    if not authorized:
        return jsonify({'error': 'Unauthorized access'}), 403

    # Masking Logic: Patient sees own data, Clinician/Admin sees data for patients they manage
    mask = (role not in ['admin', 'clinician']) and not is_own_record
    return jsonify(patient.to_dict(mask=mask))

@patient_bp.route('/patients', methods=['POST'])
@jwt_required()
@mfa_required
@audit_log('CREATE', 'patient')
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
    mask = (claims.get('role') not in ['admin', 'clinician'])
    return jsonify(patient.to_dict(mask=mask)), 201
