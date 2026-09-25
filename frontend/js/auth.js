import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6-5Lpu2Pz8W5VPHB-nO1aR4jt6lAGnTA",
  authDomain: "netpulse-network-monitor.firebaseapp.com",
  projectId: "netpulse-network-monitor",
  storageBucket: "netpulse-network-monitor.firebasestorage.app",
  messagingSenderId: "343464434638",
  appId: "1:343464434638:web:fbeae97be457a97d99699f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Export auth so dashboard.js can use it

// Check if already logged in (Only redirect if they are on the login page)
if (window.location.pathname.includes('login.html')) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = 'index.html'; 
        }
    });
}

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

// Signout functionality triggered from the dashboard header
export const initSignOut = () => {
    const signOutBtn = document.getElementById('btn-signout');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = 'login.html';
            } catch (error) {
                console.error("Error signing out:", error);
            }
        });
    }
}