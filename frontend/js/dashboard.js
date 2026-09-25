import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Use the environment key your agent is pushing to
const ENVIRONMENT_KEY = "demo_env_12345";

let healthChart = null;
let latencyChart = null;
let networkTopology = null;
let allDevicesData = [];

// Vis.js Data Sets
let topoNodes = new vis.DataSet([]);
let topoEdges = new vis.DataSet([]);

setInterval(() => {
    document.getElementById('current-time').innerText = new Date().toLocaleTimeString();
}, 1000);

function initNavigation() {
    const navDashboard = document.getElementById('nav-dashboard');
    const navAgents = document.getElementById('nav-agents');
    const viewDashboard = document.getElementById('view-dashboard');
    const viewAgents = document.getElementById('view-agents');
    const btnViewAll = document.getElementById('btn-view-all');

    function showDashboard() {
        viewDashboard.classList.remove('hidden');
        viewDashboard.classList.add('block');
        viewAgents.classList.add('hidden');
        viewAgents.classList.remove('flex');
        navDashboard.classList.add('bg-blue-500/10', 'text-blue-400', 'border-l-2', 'border-blue-500');
        navAgents.classList.remove('bg-blue-500/10', 'text-blue-400', 'border-l-2', 'border-blue-500');
    }

    function showAgents() {
        viewDashboard.classList.add('hidden');
        viewDashboard.classList.remove('block');
        viewAgents.classList.remove('hidden');
        viewAgents.classList.add('flex');
        navAgents.classList.add('bg-blue-500/10', 'text-blue-400', 'border-l-2', 'border-blue-500');
        navDashboard.classList.remove('bg-blue-500/10', 'text-blue-400', 'border-l-2', 'border-blue-500');
        renderFullAgentsTable();
    }

    if (navDashboard) navDashboard.addEventListener('click', showDashboard);
    if (navAgents) navAgents.addEventListener('click', showAgents);
    if (btnViewAll) btnViewAll.addEventListener('click', showAgents);
}

function initTopology() {
    const container = document.getElementById('topology-network');
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
    const ctxHealth = document.getElementById('healthChart').getContext('2d');
    healthChart = new Chart(ctxHealth, {
        type: 'doughnut',
        data: { labels: ['Healthy', 'Warning', 'Critical'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#34d399', '#fbbf24', '#fb7185'], borderWidth: 0, cutout: '80%' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    const ctxLatency = document.getElementById('latencyChart').getContext('2d');
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

function processTelemetryData(devices) {
    if (devices.length === 0) return;

    let online = 0, warning = 0, offline = 0;
    let totalLatency = 0, totalLoss = 0;

    devices.forEach(d => {
        if (d.status === "Online") online++;
        else if (d.status === "Warning") warning++;
        else offline++;

        totalLatency += d.latency_ms || 0;
        totalLoss += d.packet_loss || 0;
    });

    let avgLatency = (totalLatency / devices.length).toFixed(2);
    let avgLoss = (totalLoss / devices.length).toFixed(2);

    // Update KPIs
    document.getElementById('stat-total').innerText = devices.length;
    document.getElementById('stat-online-text').innerHTML = `<span class="text-emerald-400">${online} Healthy</span> | <span class="text-amber-400">${warning} Warning</span> | <span class="text-rose-400">${offline} Offline</span>`;
    document.getElementById('stat-latency').innerText = avgLatency;
    document.getElementById('stat-loss').innerText = avgLoss;
    document.getElementById('stat-jitter').innerText = (Math.random() * 5).toFixed(2); // Simulated Jitter

    // Update Donut Chart
    if (healthChart) {
        healthChart.data.datasets[0].data = [online, warning, offline];
        healthChart.update();
        document.getElementById('chart-center-pct').innerText = `${((online / devices.length) * 100).toFixed(1)}%`;
    }

    // Update Rolling Latency Chart
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

    // Update Topology Nodes dynamically
    if (offline > 0) {
        topoNodes.update({ id: 5, color: { border: '#ef4444' } });
    } else if (warning > 0) {
        topoNodes.update({ id: 5, color: { border: '#fbbf24' } });
    } else {
        topoNodes.update({ id: 5, color: { border: '#10b981' } });
    }
}

function updateTables() {
    let tbody = document.getElementById('device-table-body');
    tbody.innerHTML = "";

    allDevicesData.slice(0, 6).forEach(d => {
        let { badgeColor, statusDot } = getStatusColors(d.status);
        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="px-4 py-2"><div class="text-white font-medium">${d.name}</div><div class="text-[10px] text-slate-500 font-mono">${d.id}</div></td>
                <td class="px-4 py-2 text-slate-400">Agent Node</td>
                <td class="px-4 py-2"><span class="px-2 py-0.5 text-[10px] font-medium rounded border flex items-center w-max gap-1.5 ${badgeColor}"><span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span> ${d.status}</span></td>
            </tr>`;
    });

    if (!document.getElementById('view-agents').classList.contains('hidden')) {
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
    const devicesRef = collection(db, "networks", ENVIRONMENT_KEY, "devices");
    
    // onSnapshot pushes live updates instantly when data changes
    onSnapshot(devicesRef, (snapshot) => {
        allDevicesData = [];
        snapshot.forEach((doc) => {
            allDevicesData.push({ id: doc.id, ...doc.data() });
        });
        
        processTelemetryData(allDevicesData);
        updateTables();
    }, (error) => {
        console.error("Error listening to Firestore:", error);
    });
}

function initDashboard() {
    initNavigation();
    initTopology();
    initCharts();
    
    // Start Live WebSocket stream
    listenToFirestore();
}

window.addEventListener('DOMContentLoaded', initDashboard);