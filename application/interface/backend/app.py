from flask import Flask
from flask_cors import CORS
from .handlers.user_handler import user_bp
from .handlers.patient_handler import patient_bp
from . import database

app = Flask(__name__)
CORS(app)

database.init_app(app)

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(patient_bp, url_prefix='/api')

@app.route('/')
def hello_world():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True)
