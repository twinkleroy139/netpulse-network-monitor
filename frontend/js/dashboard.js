import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, initSignOut } from "./auth.js"; 
import { initProvisioning } from "./provisioning.js"; 

// 1. IMPORT THE HTML VIEWS
import { dashboardHTML } from "./views/dashboardView.js";
import { agentsHTML } from "./views/agentsView.js";
import { profileHTML } from "./views/profileView.js";

import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentEnvironmentFilter = "ALL"; 
let ENVIRONMENT_KEY = "demo_env_12345"; 
let firestoreUnsubscribe = null; 
let currentUser = null;

let healthChart = null;
let latencyChart = null;
let networkTopology = null;
let allDevicesMap = new Map(); 
let allDevicesData = [];

setInterval(() => {
    const timeEl = document.getElementById('current-time');
    if (timeEl) timeEl.innerText = new Date().toLocaleTimeString();
}, 1000);

// --- NEW DYNAMIC NAVIGATION LOGIC ---
function initNavigation() {
    const appContent = document.getElementById('app-content');
    
    // Sidebar Links
    const navDashboard = document.getElementById('nav-dashboard');
    const navLocalNode = document.getElementById('nav-local-node'); 
    const navAgents = document.getElementById('nav-agents');
    const btnProfile = document.getElementById('btn-profile');

    function resetSidebarHighlight() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-blue-500/10', 'text-blue-400', 'border-blue-500', 'bg-emerald-500/10', 'text-emerald-300', 'border-emerald-500');
            link.classList.add('text-slate-400', 'border-transparent');
        });
    }

    function loadDashboardView(filterType = "ALL") {
        resetSidebarHighlight();
        
        // Inject HTML
        appContent.innerHTML = `<div class="p-6 space-y-6 flex-1 block">${dashboardHTML}</div>`;
        
        // Setup Active UI Highlight
        if (filterType === "LOCAL_NODE") {
            navLocalNode.classList.remove('text-slate-400', 'border-transparent');
            navLocalNode.classList.add('bg-emerald-500/10', 'text-emerald-300', 'border-emerald-500');
        } else {
            navDashboard.classList.remove('text-slate-400', 'border-transparent');
            navDashboard.classList.add('bg-blue-500/10', 'text-blue-400', 'border-blue-500');
        }

        // Re-initialize Charts & Topology inside the newly injected HTML
        initTopology();
        initCharts();
        
        // Setup Environment Tabs inside newly injected HTML
        const envTabs = document.querySelectorAll('.env-tab');
        envTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                envTabs.forEach(t => {
                    t.classList.remove('bg-blue-500/20', 'text-blue-400', 'border-blue-500/30');
                    t.classList.add('bg-slate-800/50', 'text-slate-400', 'border-transparent');
                });
                const clickedTab = e.target;
                clickedTab.classList.remove('bg-slate-800/50', 'text-slate-400', 'border-transparent');
                clickedTab.classList.add('bg-blue-500/20', 'text-blue-400', 'border-blue-500/30');
                
                currentEnvironmentFilter = clickedTab.getAttribute('data-env');
                processTelemetryData(allDevicesData);
                updateTables(); 
            });
        });

        currentEnvironmentFilter = filterType;
        processTelemetryData(allDevicesData);
        updateTables();
    }

    function loadAgentsView() {
        resetSidebarHighlight();
        appContent.innerHTML = `<div class="p-6 space-y-6 flex-1 flex-col h-full">${agentsHTML}</div>`;
        navAgents.classList.remove('text-slate-400', 'border-transparent');
        navAgents.classList.add('bg-blue-500/10', 'text-blue-400', 'border-blue-500');
        renderFullAgentsTable();
    }
    
    function loadProfileView() {
        resetSidebarHighlight();
        appContent.innerHTML = `<div class="p-6 space-y-6 flex-1 flex-col h-full max-w-4xl mx-auto">${profileHTML}</div>`;
        
        // Must re-initialize provisioning script logic when profile HTML is injected
        if (currentUser) {
            initProvisioning(currentUser.uid);
            document.getElementById('profile-email').innerText = currentUser.email;
            document.getElementById('profile-uid').innerText = currentUser.uid;
        }
    }

    // Attach Sidebar Click Listeners
    if (navDashboard) navDashboard.addEventListener('click', () => loadDashboardView("ALL"));
    if (navAgents) navAgents.addEventListener('click', loadAgentsView);
    if (btnProfile) btnProfile.addEventListener('click', loadProfileView);
    
    // View All Agents shortcut button (lives inside dashboardView HTML)
    document.addEventListener('click', function(e){
        if(e.target && e.target.id == 'btn-view-all'){
            loadAgentsView();
        }
    });

    if (navLocalNode) {
        navLocalNode.addEventListener('click', () => {
            const myNodeId = localStorage.getItem('my_local_node_id');
            if (!myNodeId) {
                alert("You haven't configured a local script yet! Go to the Profile Hub first.");
                return;
            }
            loadDashboardView("LOCAL_NODE");
        });
    }

    // Load Default View on Startup
    loadDashboardView("ALL");
}

// ... Keep initTopology(), initCharts(), processTelemetryData(), etc. exactly as they are below ...