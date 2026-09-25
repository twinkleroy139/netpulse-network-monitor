import os
import firebase_admin
from firebase_admin import credentials, firestore

def initialize_firebase():
    # Render stores secret files in /etc/secrets/
    render_path = '/etc/secrets/serviceAccountKey.json'
    local_path = 'backend/app/core/serviceAccountKey.json'

    # Check which environment we are in
    if os.path.exists(render_path):
        cred_path = render_path
    else:
        cred_path = local_path

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

db = initialize_firebase()