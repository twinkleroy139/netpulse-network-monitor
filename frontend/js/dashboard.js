import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, initSignOut } from "./auth.js"; 
import { initProvisioning } from "./provisioning.js"; 

const firebaseConfig = {
  apiKey: "AIzaSyC6-5Lpu2Pz8W5VPHB-nO1aR4jt6lAGnTA",
  authDomain: "netpulse-network-monitor.firebaseapp.com",
  projectId: "netpulse-network-monitor",
  storageBucket: "netpulse-network-monitor.firebasestorage.app",
  messagingSenderId: "343464434638",
  appId: "1:343464434638:web:fbeae97be457a97d99699f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentEnvironmentFilter = "ALL"; 
let ENVIRONMENT_KEY = "demo_env_12345"; 
let firestoreUnsubscribe = null; 
let currentUser = null;

let healthChart = null;
let latencyChart = null;
let networkTopology = null;
let allDevicesMap = new Map(); // NEW: Tracking map to include timestamps
let allDevicesData = [];

let topoNodes = new vis.DataSet([]);
let topoEdges = new vis.DataSet([]);

setInterval(() => {
    const timeEl = document.getElementById('current-time');
    if (timeEl) timeEl.innerText = new Date().toLocaleTimeString();
}, 1000);

function initNavigation() {
    const navDashboard = document.getElementById('nav-dashboard');
    const navAgents = document.getElementById('nav-agents');
    const navLocalNode = document.getElementById('nav-local-node'); 
    
    const viewDashboard = document.getElementById('view-dashboard');
    const viewAgents = document.getElementById('view-agents');
    const viewProfile = document.getElementById('view-profile');
    
    const btnViewAll = document.getElementById('btn-view-all');
    const btnProfile = document.getElementById('btn-profile');

    function hideAllViews() {
        if(viewDashboard) { viewDashboard.classList.add('hidden'); viewDashboard.classList.remove('block'); }
        if(viewAgents) { viewAgents.classList.add('hidden'); viewAgents.classList.remove('flex'); }
        if(viewProfile) { viewProfile.classList.add('hidden'); viewProfile.classList.remove('flex'); }
        
        if(navDashboard) navDashboard.classList.remove('bg-blue-500/10', 'text-blue-400', 'border-l-2', 'border-blue-500');
        if(navAgents) navAgents.classList.remove('bg-blue-500/10', 'text-blue-400', 'border-l-2', 'border-blue-500');
        if(navLocalNode) navLocalNode.classList.remove('bg-emerald-500/10', 'text-emerald-300', 'border-emerald-500/30');
    }

    function showDashboard() {
        hideAllViews();
        if(viewDashboard) { viewDashboard.classList.remove('hidden'); viewDashboard.classList.add('block'); }
        if(navDashboard) navDashboard.classList.add('bg-blue-500/10', 'text-blue-400', 'border-l-2', 'border-blue-500');
        
        currentEnvironmentFilter = "ALL";
        processTelemetryData(allDevicesData);
        updateTables();
    }

    function showAgents() {
        hideAllViews();
        if(viewAgents) { viewAgents.classList.remove('hidden'); viewAgents.classList.add('flex'); }
        if(navAgents) navAgents.classList.add('bg-blue-500/10', 'text-blue-400', 'border-l-2', 'border-blue-500');
        renderFullAgentsTable();
    }
    
    function showProfile() {
        hideAllViews();
        if(viewProfile) { viewProfile.classList.remove('hidden'); viewProfile.classList.add('flex'); }
    }

    if (navDashboard) navDashboard.addEventListener('click', showDashboard);
    if (navAgents) navAgents.addEventListener('click', showAgents);
    if (btnViewAll) btnViewAll.addEventListener('click', showAgents);
    if (btnProfile) btnProfile.addEventListener('click', showProfile);

    if (navLocalNode) {
        navLocalNode.addEventListener('click', () => {
            const myNodeId = localStorage.getItem('my_local_node_id');
            if (!myNodeId) {
                alert("You haven't configured a local script yet! Go to the Profile Hub first.");
                return;
            }
            hideAllViews();
            if(viewDashboard) { viewDashboard.classList.remove('hidden'); viewDashboard.classList.add('block'); }
            navLocalNode.classList.add('bg-emerald-500/10', 'text-emerald-300', 'border-emerald-500/30');
            currentEnvironmentFilter = "LOCAL_NODE";
            processTelemetryData(allDevicesData);
            updateTables();
        });
    }

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
}

function initTopology() {
    const container = document.getElementById('topology-network');
    if(!container) return;
    const data = { nodes: topoNodes, edges: topoEdges };
    const options = {
        nodes: { shape: 'dot', size: 16, font: { color: '#f8fafc', size: 12, face: 'monospace' }, borderWidth: 2, shadow: true },
        edges: { width: 2, color: { color: '#475569', highlight: '#3b82f6' }, smooth: { type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 } },
        layout: { hierarchical: { direction: 'UD', sortMethod: 'directed', nodeSpacing: 180, levelSeparation: 100 } },
        physics: false,
        interaction: { hover: true, tooltipDelay: 200, zoomView: true, dragView: true }
    };
    networkTopology = new vis.Network(container, data, options);
    
    topoNodes.add([
        { id: 1, label: 'Internet Gateway', color: { background: '#1e293b', border: '#3b82f6' }, level: 0 },
        { id: 2, label: 'Enterprise Firewall', color: { background: '#1e293b', border: '#10b981' }, level: 1 },
        { id: 3, label: 'Core Switch', color: { background: '#1e293b', border: '#10b981' }, level: 2 },
        { id: 4, label: 'VoIP Server', color: { background: '#1e293b', border: '#8b5cf6' }, level: 3 },
        { id: 5, label: 'Agent Subnet', color: { background: '#1e293b', border: '#10b981' }, level: 3 },
        { id: 6, label: 'NOC Monitor', color: { background: '#1e293b', border: '#06b6d4' }, level: 3 }
    ]);
    topoEdges.add([
        { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }, { from: 3, to: 5 }, { from: 3, to: 6 }
    ]);
}

function initCharts() {
    const ctxHealthEl = document.getElementById('healthChart');
    if(ctxHealthEl) {
        const ctxHealth = ctxHealthEl.getContext('2d');
        healthChart = new Chart(ctxHealth, {
            type: 'doughnut',
            data: { labels: ['Healthy', 'Warning', 'Critical'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#34d399', '#fbbf24', '#fb7185'], borderWidth: 0, cutout: '80%' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    const ctxLatencyEl = document.getElementById('latencyChart');
    if(ctxLatencyEl) {
        const ctxLatency = ctxLatencyEl.getContext('2d');
        latencyChart = new Chart(ctxLatency, {
            type: 'line',
            data: {
                labels: [], 
                datasets: [{ label: 'System Avg Latency (ms)', data: [], borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', tension: 0.4, borderWidth: 2, pointRadius: 3, fill: true }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { color: 'rgba(51, 65, 85, 0.2)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } } },
                animation: { duration: 400 }
            }
        });
    }
}

function processTelemetryData(devices) {
    const warnLatEl = document.getElementById('warn-latency');
    const warnLossEl = document.getElementById('warn-loss');

    if (devices.length === 0) {
        document.getElementById('stat-total').innerText = "0";
        if (warnLatEl) warnLatEl.classList.add('hidden');
        if (warnLossEl) warnLossEl.classList.add('hidden');
        return; 
    }

    let filteredDevices = devices;
    
    if (currentEnvironmentFilter === "LOCAL_NODE") {
        const myNodeId = localStorage.getItem('my_local_node_id');
        filteredDevices = devices.filter(d => d.id === myNodeId);
    } else if (currentEnvironmentFilter !== "ALL") {
        filteredDevices = devices.filter(d => d.id.startsWith(currentEnvironmentFilter + '-'));
    }

    if (filteredDevices.length === 0) {
        document.getElementById('stat-total').innerText = "0";
        document.getElementById('stat-latency').innerText = "--";
        document.getElementById('stat-loss').innerText = "--";
        document.getElementById('stat-online-text').innerHTML = `<span class="text-slate-500">No active agents.</span>`;
        if (warnLatEl) warnLatEl.classList.add('hidden');
        if (warnLossEl) warnLossEl.classList.add('hidden');
        if (healthChart) {
            healthChart.data.datasets[0].data = [0, 0, 1];
            healthChart.update();
            document.getElementById('chart-center-pct').innerText = "0%";
        }
        return;
    }

    let online = 0, warning = 0, offline = 0;
    let totalLatency = 0, totalLoss = 0;

    filteredDevices.forEach(d => {
        if (d.status === "Online") online++;
        else if (d.status === "Warning") warning++;
        else offline++;

        totalLatency += d.latency_ms || 0;
        totalLoss += d.packet_loss || 0;
    });

    let avgLatency = (totalLatency / filteredDevices.length).toFixed(2);
    let avgLoss = (totalLoss / filteredDevices.length).toFixed(2);

    const statTotal = document.getElementById('stat-total');
    if(statTotal) statTotal.innerText = filteredDevices.length;
    
    const statOnlineText = document.getElementById('stat-online-text');
    if(statOnlineText) statOnlineText.innerHTML = `<span class="text-emerald-400">${online} Healthy</span> | <span class="text-amber-400">${warning} Warning</span> | <span class="text-rose-400">${offline} Offline</span>`;
    
    const statLat = document.getElementById('stat-latency');
    if(statLat) statLat.innerText = avgLatency;
    
    const statLoss = document.getElementById('stat-loss');
    if(statLoss) statLoss.innerText = avgLoss;
    
    const statJit = document.getElementById('stat-jitter');
    if(statJit) statJit.innerText = (Math.random() * 5).toFixed(2); 

    // --- NEW: Live Warning Indicators Logic ---
    if (warnLatEl) {
        if (avgLatency >= 100 || warning > 0) {
            warnLatEl.classList.remove('hidden');
            warnLatEl.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i> Critical Latency Spike`;
        } else {
            warnLatEl.classList.add('hidden');
        }
    }

    if (warnLossEl) {
        if (avgLoss >= 2.0 || warning > 0) {
            warnLossEl.classList.remove('hidden');
            warnLossEl.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i> Packet Loss Warning: ${avgLoss}%`;
        } else {
            warnLossEl.classList.add('hidden');
        }
    }

    if (healthChart) {
        healthChart.data.datasets[0].data = [online, warning, offline];
        healthChart.update();
        const pct = document.getElementById('chart-center-pct');
        if(pct) pct.innerText = `${((online / filteredDevices.length) * 100).toFixed(1)}%`;
    }

    if (latencyChart) {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        latencyChart.data.labels.push(now);
        latencyChart.data.datasets[0].data.push(avgLatency);
        if (latencyChart.data.labels.length > 15) {
            latencyChart.data.labels.shift();
            latencyChart.data.datasets[0].data.shift();
        }
        latencyChart.update();
    }
}

function updateTables() {
    let tbody = document.getElementById('device-table-body');
    if(!tbody) return;
    tbody.innerHTML = "";

    let filteredList = allDevicesData;
    if (currentEnvironmentFilter === "LOCAL_NODE") {
        const myNodeId = localStorage.getItem('my_local_node_id');
        filteredList = allDevicesData.filter(d => d.id === myNodeId);
    } else if (currentEnvironmentFilter !== "ALL") {
        filteredList = allDevicesData.filter(d => d.id.startsWith(currentEnvironmentFilter + '-'));
    }

    filteredList.slice(0, 6).forEach(d => {
        let { badgeColor, statusDot } = getStatusColors(d.status);
        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="px-4 py-2"><div class="text-white font-medium">${d.name}</div><div class="text-[10px] text-slate-500 font-mono">${d.id}</div></td>
                <td class="px-4 py-2 text-slate-400">Agent Node</td>
                <td class="px-4 py-2"><span class="px-2 py-0.5 text-[10px] font-medium rounded border flex items-center w-max gap-1.5 ${badgeColor}"><span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span> ${d.status}</span></td>
            </tr>`;
    });

    const viewAgents = document.getElementById('view-agents');
    if (viewAgents && !viewAgents.classList.contains('hidden')) {
        renderFullAgentsTable();
    }
}

function renderFullAgentsTable() {
    let tbody = document.getElementById('full-agents-table-body');
    if (!tbody) return;
    tbody.innerHTML = "";
    allDevicesData.forEach(d => {
        let { badgeColor, statusDot } = getStatusColors(d.status);
        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="px-5 py-3 text-slate-300 font-mono text-xs">${d.id}</td>
                <td class="px-5 py-3 text-white font-medium">${d.name}</td>
                <td class="px-5 py-3 text-slate-400">Agent Node</td>
                <td class="px-5 py-3 text-slate-400 font-mono text-xs">Dynamic</td>
                <td class="px-5 py-3"><span class="px-2 py-1 text-[10px] font-medium rounded border flex items-center w-max gap-1.5 ${badgeColor}"><span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span> ${d.status}</span></td>
                <td class="px-5 py-3 text-slate-300 font-mono">${d.latency_ms} ms</td>
                <td class="px-5 py-3 text-slate-300 font-mono">${d.packet_loss}%</td>
            </tr>`;
    });
}

function getStatusColors(status) {
    if (status === "Warning") return { badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30", statusDot: "bg-amber-400" };
    if (status === "Offline") return { badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30", statusDot: "bg-rose-400" };
    return { badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", statusDot: "bg-emerald-400" };
}

function listenToFirestore() {
    if (firestoreUnsubscribe) firestoreUnsubscribe();
    
    const devicesRef = collection(db, "networks", ENVIRONMENT_KEY, "devices");
    
    // NEW: Use docChanges() to track exactly when an agent last sent data
    firestoreUnsubscribe = onSnapshot(devicesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const docData = change.doc.data();
            const docId = change.doc.id;

            if (change.type === "added" || change.type === "modified") {
                allDevicesMap.set(docId, {
                    id: docId,
                    ...docData,
                    lastSeen: Date.now() 
                });
            }
            if (change.type === "removed") {
                allDevicesMap.delete(docId);
            }
        });

        allDevicesData = Array.from(allDevicesMap.values());
        processTelemetryData(allDevicesData);
        updateTables();
    }, (error) => {
        console.error("Error listening to Firestore:", error);
    });
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
            
            if (profileEmail) profileEmail.innerText = user.email;
            if (profileUid) profileUid.innerText = user.uid;
            
            initProvisioning(user.uid);
            listenToFirestore();
        } else {
            currentUser = null;
            ENVIRONMENT_KEY = "demo_env_12345";
            
            if(btnDemoLogin) btnDemoLogin.classList.remove('hidden');
            if(loggedInNav) loggedInNav.classList.add('hidden');
            
            listenToFirestore();
        }
    });
}

function initDashboard() {
    initNavigation();
    initTopology();
    initCharts();
    initSignOut(); 
    handleAuthState();

    // --- NEW: Watchdog Timer ---
    // Scans memory every 5 seconds. If no update in 15 seconds, mark Offline.
    setInterval(() => {
        let changed = false;
        const now = Date.now();

        allDevicesMap.forEach((device, id) => {
            if (now - device.lastSeen > 15000 && device.status !== "Offline") {
                device.status = "Offline";
                device.latency_ms = 0;
                device.packet_loss = 0;
                allDevicesMap.set(id, device);
                changed = true;
            }
        });

        if (changed) {
            allDevicesData = Array.from(allDevicesMap.values());
            processTelemetryData(allDevicesData);
            updateTables();
        }
    }, 5000);
}

window.addEventListener('DOMContentLoaded', initDashboard);