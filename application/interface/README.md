# MediTrack Patient Portal

A HIPAA and GDPR compliant healthcare application for managing patient records, appointments, therapy sessions, and medical assessments.

## Overview

MediTrack Patient Portal is a comprehensive healthcare management system that integrates with a PostgreSQL database to provide secure access to patient health information, clinical assessments, imaging data, and therapy tracking.

## Features

### Security & Compliance
- ✅ Multi-factor authentication (MFA) using TOTP
- ✅ JWT-based authentication with access and refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Field-level encryption for sensitive data (PHI/PII)
- ✅ Comprehensive audit logging for HIPAA compliance
- ✅ Rate limiting to prevent abuse
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Password policy enforcement
- ✅ Data masking for logs and displays

### User Roles
- **Patient**: View personal health records, schedule appointments, complete assessments
- **Clinician**: Manage assigned patients, review assessments, document therapy sessions
- **Admin**: System configuration, user management, audit log review

### Core Functionality
- Patient demographics and profile management
- Appointment scheduling with conflict detection
- Vital signs tracking (heart rate, blood pressure)
- Therapy session documentation
- Homework assignment and tracking
- Secure messaging between patients and clinicians
- Medical imaging management (fMRI, PET scans)
- Clinical assessment instruments (PHQ-9, GAD-7, etc.)
- Medication adherence tracking

## Technology Stack

### Backend
- **Framework**: Flask 3.0
- **Database**: PostgreSQL 18.1
- **Authentication**: Flask-JWT-Extended, PyOTP
- **Security**: Flask-Bcrypt, Flask-Limiter, Flask-Talisman
- **Validation**: Custom validators with business rule enforcement

### Frontend
- **Core**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with responsive design
- **Accessibility**: WCAG 2.1 AA compliant

## Installation

### Prerequisites
- Python 3.9+
- PostgreSQL 18.1+
- pip (Python package manager)

### Setup

1. **Clone the repository**
   ```bash
   cd application/interface
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up database**
   ```bash
   # Create database
   createdb wellness
   
   # Run schema script
   psql -d wellness -f ../../scripts/postgresql/wellness.sql
   ```

5. **Configure environment variables**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env and set your values
   # IMPORTANT: Generate secure keys for production:
   # - SECRET_KEY: python -c "import secrets; print(secrets.token_hex(32))"
   # - JWT_SECRET_KEY: python -c "import secrets; print(secrets.token_hex(32))"
   # - FIELD_ENCRYPTION_KEY: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

6. **Run the application**
   ```bash
   # Development mode
   export FLASK_ENV=development
   python -m backend.app
   
   # Or using Flask CLI
   flask run
   ```

7. **Access the application**
   - Backend API: http://localhost:5000
   - Frontend: Open `frontend/index.html` in a browser or serve with a static file server

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "role_id": 1
}
```

#### Login (Step 1)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Verify MFA (Step 2)
```http
POST /api/auth/mfa/verify
Authorization: Bearer <temp_token>
Content-Type: application/json

{
  "mfa_code": "123456"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

### Patient Endpoints

#### Get All Patients
```http
GET /api/patients
Authorization: Bearer <access_token>
```

#### Get Patient by ID
```http
GET /api/patients/{patient_id}
Authorization: Bearer <access_token>
```

#### Create Patient
```http
POST /api/patients
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "user_id": 1,
  "date_of_birth": "1990-05-12",
  "gender": "male",
  "ethnicity": "Hispanic",
  "address_line_1": "123 Main St",
  "city": "Denver",
  "state": "CO",
  "zip": "80202"
}
```

### User Endpoints

#### Get All Users
```http
GET /api/users
Authorization: Bearer <access_token>
```

#### Get User by ID
```http
GET /api/users/{user_id}
Authorization: Bearer <access_token>
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options.

**Critical Settings:**
- `SECRET_KEY`: Flask secret key (generate securely)
- `JWT_SECRET_KEY`: JWT signing key (generate securely)
- `FIELD_ENCRYPTION_KEY`: Fernet key for field encryption (generate securely)
- `DB_PASSWORD`: Database password
- `MFA_ISSUER_NAME`: Name shown in authenticator apps

**Security Settings:**
- `PASSWORD_MIN_LENGTH`: Minimum password length (default: 12)
- `SESSION_TIMEOUT_MINUTES`: Session timeout (default: 30)
- `HIPAA_AUDIT_ENABLED`: Enable HIPAA audit logging (default: True)
- `GDPR_CONSENT_REQUIRED`: Require GDPR consent (default: True)

## Development

### Project Structure
```
application/interface/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── config.py              # Configuration management
│   ├── database.py            # Database connection
│   ├── handlers/              # API route handlers
│   │   ├── auth_handler.py    # Authentication endpoints
│   │   ├── user_handler.py    # User management
│   │   └── patient_handler.py # Patient management
│   ├── models/                # Database models
│   └── utils/                 # Utility functions
│       ├── encryption.py      # Encryption & masking
│       ├── audit_logger.py    # Audit logging
│       └── validators.py      # Input validation
├── frontend/
│   ├── index.html             # Main HTML file
│   ├── css/
│   │   └── styles.css         # Stylesheets
│   └── js/
│       ├── app.js             # Router and main app
│       └── pages/             # Page components
├── requirements.txt           # Python dependencies
├── .env.example               # Environment template
└── README.md                  # This file
```

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-cov pytest-flask

# Run tests
pytest

# Run with coverage
pytest --cov=backend --cov-report=html
```

### Code Style
- Follow PEP 8 for Python code
- Use ESLint for JavaScript code
- Document all functions with docstrings
- Add type hints where applicable

## Security Considerations

### HIPAA Compliance
- All PHI access is logged to `access_log` table
- Audit logs are immutable (append-only)
- Field-level encryption for sensitive data
- Automatic session timeout after 30 minutes
- MFA required for all users

### GDPR Compliance
- Consent management system
- Right to access (data export)
- Right to erasure (data deletion)
- Right to rectification (data correction)
- Data portability features

### Best Practices
- Never commit `.env` file to version control
- Rotate encryption keys regularly
- Review audit logs for suspicious activity
- Keep dependencies updated
- Use HTTPS in production
- Implement IP allowlisting for admin access

## Deployment

### Production Checklist
- [ ] Set `FLASK_ENV=production`
- [ ] Generate secure keys for all secrets
- [ ] Configure SSL/TLS certificates
- [ ] Set up database connection pooling
- [ ] Enable HTTPS enforcement
- [ ] Configure backup automation
- [ ] Set up monitoring and alerting
- [ ] Review and test disaster recovery procedures
- [ ] Conduct security audit
- [ ] Complete HIPAA compliance checklist

### Deployment Options
- **Docker**: Use provided Dockerfile (to be created)
- **Cloud**: AWS, GCP, Azure with managed PostgreSQL
- **On-Premise**: Linux server with Nginx + Gunicorn

## Troubleshooting

### Common Issues

**Database Connection Error**
```
Solution: Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in .env
```

**MFA Code Invalid**
```
Solution: Ensure system time is synchronized (TOTP is time-based)
```

**Rate Limit Exceeded**
```
Solution: Wait before retrying or adjust RATELIMIT_DEFAULT in config
```

**Token Expired**
```
Solution: Use refresh token endpoint to get new access token
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions:
- Email: support@meditrack.com
- Documentation: https://docs.meditrack.com
- Issue Tracker: https://github.com/meditrack/portal/issues

## Acknowledgments

- TaskFlow Learning Platforms Inc. for design specifications
- Development team for implementation
- Security auditors for compliance review
