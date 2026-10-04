import os

config_content = f"""export const firebaseConfig = {{
  apiKey: "{os.environ.get('FIREBASE_API_KEY', '')}",
  authDomain: "{os.environ.get('FIREBASE_AUTH_DOMAIN', '')}",
  projectId: "{os.environ.get('FIREBASE_PROJECT_ID', '')}",
  storageBucket: "{os.environ.get('FIREBASE_STORAGE_BUCKET', '')}",
  messagingSenderId: "{os.environ.get('FIREBASE_MESSAGING_SENDER_ID', '')}",
  appId: "{os.environ.get('FIREBASE_APP_ID', '')}"
}};
"""

# Create the file safely on Render's server
os.makedirs('frontend/js', exist_ok=True)
with open('frontend/js/config.js', 'w') as f:
    f.write(config_content)

print("[+] config.js generated securely from Environment Variables!")