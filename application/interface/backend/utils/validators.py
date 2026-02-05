"""
Validation utilities for input validation and business rules
"""
import re
from datetime import datetime, date
from functools import wraps
from flask import request, jsonify


class ValidationError(Exception):
    """Custom exception for validation errors"""
    def __init__(self, message, field=None):
        self.message = message
        self.field = field
        super().__init__(self.message)


class Validators:
    """Collection of validation functions"""
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        if not email:
            raise ValidationError("Email is required", "email")
        
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValidationError("Invalid email format", "email")
        
        return True
    
    @staticmethod
    def validate_password(password, config=None):
        """
        Validate password against policy
        
        Args:
            password: Password to validate
            config: Configuration object with password policy settings
        """
        if not password:
            raise ValidationError("Password is required", "password")
        
        # Default policy
        min_length = 12
        require_special = True
        require_number = True
        require_uppercase = True
        
        # Override with config if provided
        if config:
            min_length = getattr(config, 'PASSWORD_MIN_LENGTH', 12)
            require_special = getattr(config, 'PASSWORD_REQUIRE_SPECIAL', True)
            require_number = getattr(config, 'PASSWORD_REQUIRE_NUMBER', True)
            require_uppercase = getattr(config, 'PASSWORD_REQUIRE_UPPERCASE', True)
        
        if len(password) < min_length:
            raise ValidationError(f"Password must be at least {min_length} characters", "password")
        
        if require_uppercase and not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter", "password")
        
        if require_number and not re.search(r'\d', password):
            raise ValidationError("Password must contain at least one number", "password")
        
        if require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("Password must contain at least one special character", "password")
        
        return True
    
    @staticmethod
    def validate_date_of_birth(dob):
        """Validate date of birth (cannot be in future)"""
        if not dob:
            raise ValidationError("Date of birth is required", "date_of_birth")
        
        if isinstance(dob, str):
            try:
                dob = datetime.strptime(dob, '%Y-%m-%d').date()
            except ValueError:
                raise ValidationError("Invalid date format. Use YYYY-MM-DD", "date_of_birth")
        
        if dob > date.today():
            raise ValidationError("Date of birth cannot be in the future", "date_of_birth")
        
        # Check if age is reasonable (0-150 years)
        age = (date.today() - dob).days // 365
        if age > 150:
            raise ValidationError("Invalid date of birth", "date_of_birth")
        
        return True
    
    @staticmethod
    def validate_phone(phone):
        """Validate phone number format"""
        if not phone:
            return True  # Phone is optional in many cases
        
        # Remove common formatting characters
        digits = re.sub(r'[^\d]', '', phone)
        
        if len(digits) < 10 or len(digits) > 15:
            raise ValidationError("Invalid phone number", "phone")
        
        return True
    
    @staticmethod
    def validate_heart_rate(heart_rate):
        """Validate heart rate is within acceptable range"""
        if heart_rate is None:
            return True  # Optional field
        
        if not isinstance(heart_rate, int):
            raise ValidationError("Heart rate must be an integer", "heart_rate")
        
        if heart_rate < 30 or heart_rate > 220:
            raise ValidationError("Heart rate must be between 30 and 220 bpm", "heart_rate")
        
        return True
    
    @staticmethod
    def validate_blood_pressure(bp):
        """Validate blood pressure format (e.g., 120/80)"""
        if not bp:
            return True  # Optional field
        
        pattern = r'^\d{2,3}/\d{2,3}$'
        if not re.match(pattern, bp):
            raise ValidationError("Invalid blood pressure format. Use format: 120/80", "blood_pressure")
        
        systolic, diastolic = map(int, bp.split('/'))
        
        if systolic < 70 or systolic > 250:
            raise ValidationError("Systolic pressure must be between 70 and 250", "blood_pressure")
        
        if diastolic < 40 or diastolic > 150:
            raise ValidationError("Diastolic pressure must be between 40 and 150", "blood_pressure")
        
        if systolic <= diastolic:
            raise ValidationError("Systolic pressure must be greater than diastolic", "blood_pressure")
        
        return True
    
    @staticmethod
    def validate_score_range(score, min_score, max_score, field_name="score"):
        """Validate score is within allowed range"""
        if score is None:
            raise ValidationError(f"{field_name} is required", field_name)
        
        if not isinstance(score, (int, float)):
            raise ValidationError(f"{field_name} must be a number", field_name)
        
        if score < min_score or score > max_score:
            raise ValidationError(
                f"{field_name} must be between {min_score} and {max_score}",
                field_name
            )
        
        return True
    
    @staticmethod
    def validate_gender(gender):
        """Validate gender value"""
        if not gender:
            return True  # Optional field
        
        valid_genders = ['male', 'female', 'other']
        if gender.lower() not in valid_genders:
            raise ValidationError(
                f"Gender must be one of: {', '.join(valid_genders)}",
                "gender"
            )
        
        return True
    
    @staticmethod
    def validate_appointment_time(appointment_time):
        """Validate appointment time is in the future"""
        if not appointment_time:
            raise ValidationError("Appointment time is required", "appointment_time")
        
        if isinstance(appointment_time, str):
            try:
                appointment_time = datetime.fromisoformat(appointment_time)
            except ValueError:
                raise ValidationError("Invalid datetime format", "appointment_time")
        
        if appointment_time <= datetime.now():
            raise ValidationError("Appointment time must be in the future", "appointment_time")
        
        return True
    
    @staticmethod
    def validate_duration(duration_minutes):
        """Validate session duration"""
        if duration_minutes is None:
            return True  # Optional field
        
        if not isinstance(duration_minutes, int):
            raise ValidationError("Duration must be an integer", "duration_minutes")
        
        if duration_minutes <= 0:
            raise ValidationError("Duration must be greater than 0", "duration_minutes")
        
        if duration_minutes > 480:  # 8 hours max
            raise ValidationError("Duration cannot exceed 480 minutes (8 hours)", "duration_minutes")
        
        return True

    @staticmethod
    def validate_role_id(role_id):
        """Validate role ID format"""
        if role_id is None:
            raise ValidationError("Role ID is required", "role_id")

        try:
            int(role_id)
        except (ValueError, TypeError):
            raise ValidationError("Role ID must be an integer", "role_id")

        return True


class BusinessRules:
    """Implementation of business rules from specification"""
    
    @staticmethod
    def check_assessment_retake_interval(patient_id, instrument_code, last_assessment_date, min_interval_days):
        """
        BR1: Assessments cannot be retaken before minimum interval
        
        Args:
            patient_id: ID of patient
            instrument_code: Code of assessment instrument
            last_assessment_date: Date of last assessment
            min_interval_days: Minimum days between assessments
            
        Returns:
            Boolean indicating if retake is allowed
        """
        if not last_assessment_date or not min_interval_days:
            return True
        
        days_since_last = (datetime.now().date() - last_assessment_date).days
        
        if days_since_last < min_interval_days:
            raise ValidationError(
                f"Assessment can only be retaken after {min_interval_days} days. "
                f"Last assessment was {days_since_last} days ago.",
                "assessment"
            )
        
        return True
    
    @staticmethod
    def check_clinician_patient_assignment(clinician_id, patient_id, db):
        """
        BR2: Only assigned clinicians may modify patient records
        BR5: Clinicians may only view patients linked to their clinic
        
        Args:
            clinician_id: ID of clinician
            patient_id: ID of patient
            db: Database connection
            
        Returns:
            Boolean indicating if clinician is assigned to patient
        """
        cur = db.cursor()
        cur.execute(
            """
            SELECT 1 FROM patient_clinician
            WHERE patient_id = %s AND clinician_id = %s
            """,
            (patient_id, clinician_id)
        )
        result = cur.fetchone()
        cur.close()
        
        if not result:
            raise ValidationError(
                "Clinician is not assigned to this patient",
                "authorization"
            )
        
        return True
    
    @staticmethod
    def check_appointment_overlap(clinician_id, appointment_time, db, exclude_appointment_id=None):
        """
        BR8: Appointments cannot overlap for the same clinician
        
        Args:
            clinician_id: ID of clinician
            appointment_time: Proposed appointment time
            db: Database connection
            exclude_appointment_id: ID of appointment to exclude (for updates)
            
        Returns:
            Boolean indicating if time slot is available
        """
        cur = db.cursor()
        
        # Check for overlapping appointments (within 1 hour window)
        query = """
            SELECT 1 FROM appointments
            WHERE clinician_id = %s
            AND status != 'cancelled'
            AND appointment_time BETWEEN %s - INTERVAL '1 hour' AND %s + INTERVAL '1 hour'
        """
        params = [clinician_id, appointment_time, appointment_time]
        
        if exclude_appointment_id:
            query += " AND id != %s"
            params.append(exclude_appointment_id)
        
        cur.execute(query, params)
        result = cur.fetchone()
        cur.close()
        
        if result:
            raise ValidationError(
                "Clinician has a conflicting appointment at this time",
                "appointment_time"
            )
        
        return True
    
    @staticmethod
    def check_cancelled_appointment_edit(appointment_id, db):
        """
        BR9: Cancelled appointments cannot be edited
        
        Args:
            appointment_id: ID of appointment
            db: Database connection
            
        Returns:
            Boolean indicating if appointment can be edited
        """
        cur = db.cursor()
        cur.execute(
            "SELECT status FROM appointments WHERE id = %s",
            (appointment_id,)
        )
        result = cur.fetchone()
        cur.close()
        
        if result and result[0] == 'cancelled':
            raise ValidationError(
                "Cannot edit cancelled appointment",
                "appointment"
            )
        
        return True


def validate_request(schema):
    """
    Decorator for validating request data against a schema
    
    Args:
        schema: Dictionary defining required and optional fields with validators
        
    Usage:
        @validate_request({
            'email': {'required': True, 'validator': Validators.validate_email},
            'password': {'required': True, 'validator': Validators.validate_password}
        })
        def create_user():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'Request body is required'}), 400
            
            errors = {}
            
            # Check required fields
            for field, rules in schema.items():
                if rules.get('required', False) and field not in data:
                    errors[field] = f"{field} is required"
                
                # Run validator if field is present
                if field in data and 'validator' in rules:
                    try:
                        rules['validator'](data[field])
                    except ValidationError as e:
                        errors[field] = e.message
            
            if errors:
                return jsonify({'errors': errors}), 400
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
