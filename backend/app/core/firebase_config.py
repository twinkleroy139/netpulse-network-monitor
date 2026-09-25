import os
import firebase_admin
from firebase_admin import credentials, firestore

def initialize_firebase():
    # Prevent initializing multiple times during hot-reloads
    if not firebase_admin._apps:
        # Resolve the absolute path to the renamed json file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        cred_path = os.path.join(current_dir, "serviceAccountKey.json")
        
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        
    return firestore.client()

# Export the database instance for use in our routes
db = initialize_firebase()