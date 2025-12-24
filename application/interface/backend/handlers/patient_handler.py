from flask import Blueprint, request, jsonify
from ..models.patient import Patient

patient_bp = Blueprint('patient_bp', __name__)

@patient_bp.route('/patients', methods=['GET'])
def get_patients():
    patients = Patient.get_all()
    return jsonify([patient.to_dict() for patient in patients])

@patient_bp.route('/patients/<int:patient_id>', methods=['GET'])
def get_patient(patient_id):
    patient = Patient.get_by_id(patient_id)
    if patient:
        return jsonify(patient.to_dict())
    return jsonify({'message': 'Patient not found'}), 404

@patient_bp.route('/patients', methods=['POST'])
def create_patient():
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
