// frontend/js/dashboard.js

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, initSignOut } from "./auth.js"; 
import { initProvisioning } from "./provisioning.js"; 

import { dashboardHTML } from "./views/dashboardView.js";
import { agentsHTML } from "./views/agentsView.js";
import { profileHTML } from "./views/profileView.js";
import { voipHTML } from "./views/voipView.js";




import { initTopology, initCharts, processTelemetryData, updateTables, renderFullAgentsTable } from "./ui_charts.js";
import { listenToFirestore, startWatchdogTimer, allDevicesData } from "./firebase_client.js";

let currentEnvironmentFilter = "ALL"; 
let ENVIRONMENT_KEY = "demo_env_12345"; 
let currentUser = null;

setInterval(() => {
    const timeEl = document.getElementById('current-time');
    if (timeEl) timeEl.innerText = new Date().toLocaleTimeString();
}, 1000);

function initNavigation() {
    const appContent = document.getElementById('app-content');
    const navDashboard = document.getElementById('nav-dashboard');
    const navLocalNode = document.getElementById('nav-local-node'); 
    const navAgents = document.getElementById('nav-agents');
    const navVoip = document.getElementById('nav-voip');
    const btnProfile = document.getElementById('btn-profile');

    function resetSidebarHighlight() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-blue-500/10', 'text-blue-400', 'border-blue-500', 'bg-emerald-500/10', 'text-emerald-300', 'border-emerald-500');
            link.classList.add('text-slate-400', 'border-transparent');
        });
    }



    function loadDashboardView(filterType = "ALL") {
        resetSidebarHighlight();
        appContent.innerHTML = `<div class="p-6 space-y-6 flex-1 block">${dashboardHTML}</div>`;
        
        if (filterType === "LOCAL_NODE") {
            if(navLocalNode) {
                navLocalNode.classList.remove('text-slate-400', 'border-transparent');
                navLocalNode.classList.add('bg-emerald-500/10', 'text-emerald-300', 'border-emerald-500');
            }
        } else {
            if(navDashboard) {
                navDashboard.classList.remove('text-slate-400', 'border-transparent');
                navDashboard.classList.add('bg-blue-500/10', 'text-blue-400', 'border-blue-500');
            }
        }




        initCharts();
        setTimeout(() => {
            initTopology();
        }, 50);
        

        

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
                processTelemetryData(allDevicesData, currentEnvironmentFilter);
                updateTables(allDevicesData, currentEnvironmentFilter); 
            });
        });

        currentEnvironmentFilter = filterType;
        processTelemetryData(allDevicesData, currentEnvironmentFilter);
        updateTables(allDevicesData, currentEnvironmentFilter);
    }

    function loadAgentsView() {
        resetSidebarHighlight();
        appContent.innerHTML = `<div class="p-6 space-y-6 flex-1 flex-col h-full">${agentsHTML}</div>`;
        if(navAgents) {
            navAgents.classList.remove('text-slate-400', 'border-transparent');
            navAgents.classList.add('bg-blue-500/10', 'text-blue-400', 'border-blue-500');
        }
        renderFullAgentsTable(allDevicesData);
    }
    
    function loadProfileView() {
        resetSidebarHighlight();
        appContent.innerHTML = `<div class="p-6 space-y-6 flex-1 flex-col h-full max-w-4xl mx-auto">${profileHTML}</div>`;
        if (currentUser) {
            initProvisioning(currentUser.uid);
            const emailEl = document.getElementById('profile-email');
            const uidEl = document.getElementById('profile-uid');
            if(emailEl) emailEl.innerText = currentUser.email;
            if(uidEl) uidEl.innerText = currentUser.uid;
        }
    }


    function loadVoipView() {
        resetSidebarHighlight();
        appContent.innerHTML = `<div class="p-6 space-y-6 flex-1 flex-col h-full">${voipHTML}</div>`;
        if(navVoip) {
            navVoip.classList.remove('text-slate-400', 'border-transparent');
            navVoip.classList.add('bg-blue-500/10', 'text-blue-400', 'border-blue-500');
        }
    }



    if (navDashboard) navDashboard.addEventListener('click', () => loadDashboardView("ALL"));
    if (navAgents) navAgents.addEventListener('click', loadAgentsView);
    if (navVoip) navVoip.addEventListener('click', loadVoipView);
    if (btnProfile) btnProfile.addEventListener('click', loadProfileView);
    
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

    loadDashboardView("ALL");
}

function handleAuthState() {
    onAuthStateChanged(auth, (user) => {
        const btnDemoLogin = document.getElementById('btn-demo-login');
        const loggedInNav = document.getElementById('logged-in-nav');
        const profileEmail = document.getElementById('profile-email');
        const profileUid = document.getElementById('profile-uid');

        if (user) {
            currentUser = user;
            ENVIRONMENT_KEY = user.uid; 
            
            if(btnDemoLogin) btnDemoLogin.classList.add('hidden');
            if(loggedInNav) loggedInNav.classList.remove('hidden');
            if(profileEmail) profileEmail.innerText = user.email;
            if(profileUid) profileUid.innerText = user.uid;
            
            listenToFirestore(ENVIRONMENT_KEY, currentEnvironmentFilter);
        } else {
            currentUser = null;
            ENVIRONMENT_KEY = "demo_env_12345";
            
            if(btnDemoLogin) btnDemoLogin.classList.remove('hidden');
            if(loggedInNav) loggedInNav.classList.add('hidden');
            
            listenToFirestore(ENVIRONMENT_KEY, currentEnvironmentFilter);
        }
    });
}

function initDashboard() {
    initNavigation();
    initSignOut(); 
    handleAuthState();
    startWatchdogTimer(currentEnvironmentFilter);
}

window.addEventListener('DOMContentLoaded', initDashboard);