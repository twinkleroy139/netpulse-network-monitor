import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// TODO: Replace this with your actual config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyC6-5Lpu2Pz8W5VPHB-nO1aR4jt6lAGnTA",
  authDomain: "netpulse-network-monitor.firebaseapp.com",
  projectId: "netpulse-network-monitor",
  storageBucket: "netpulse-network-monitor.firebasestorage.app",
  messagingSenderId: "343464434638",
  appId: "1:343464434638:web:fbeae97be457a97d99699f"
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Check if already logged in
onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html'; // Redirect to dashboard
    }
});

const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('error-msg');
const signupLink = document.getElementById('signup-link');

let isLoginMode = true;

if (signupLink) {
    signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        document.querySelector('button[type="submit"]').innerHTML = isLoginMode 
            ? 'Initialize Session <i class="fas fa-arrow-right ml-2 text-sm"></i>' 
            : 'Provision Environment <i class="fas fa-plus ml-2 text-sm"></i>';
        signupLink.innerText = isLoginMode ? "Provision one" : "Back to login";
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        errorMsg.classList.add('hidden');

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            window.location.href = 'index.html';
        } catch (error) {
            errorMsg.innerText = error.message.replace('Firebase: ', '');
            errorMsg.classList.remove('hidden');
        }
    });
}