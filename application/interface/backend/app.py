from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
import os
from .config import get_config
from .handlers.user_handler import user_bp
from .handlers.patient_handler import patient_bp
from .handlers.auth_handler import auth_bp
from . import database

# Get configuration
config = get_config()

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(config)

# Initialize CORS
CORS(app, origins=config.CORS_ORIGINS, supports_credentials=True)

# Initialize JWT
jwt = JWTManager(app)

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[config.RATELIMIT_DEFAULT],
    storage_uri=config.RATELIMIT_STORAGE_URL
)

# Initialize Talisman (security headers) - only in production
if not app.config['DEBUG']:
    Talisman(
        app,
        force_https=config.TALISMAN_FORCE_HTTPS,
        strict_transport_security=config.TALISMAN_STRICT_TRANSPORT_SECURITY,
        content_security_policy=config.TALISMAN_CONTENT_SECURITY_POLICY
    )

# Initialize database
database.init_app(app)

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload['jti']
    db = database.get_db()
    cur = db.cursor()
    try:
        cur.execute("SELECT 1 FROM token_blacklist WHERE jti = %s", (jti,))
        return cur.fetchone() is not None
    except Exception:
        return False
    finally:
        cur.close()

# Create logs directory if it doesn't exist
os.makedirs('logs', exist_ok=True)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(patient_bp, url_prefix='/api')

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token is missing'}), 401

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'MediTrack Patient Portal API',
        'version': '1.0.0'
    }), 200

@app.route('/')
def index():
    return jsonify({
        'message': 'MediTrack Patient Portal API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/health',
            'auth': '/api/auth/*',
            'users': '/api/users/*',
            'patients': '/api/patients/*'
        }
    }), 200

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=app.config['DEBUG']
    )
