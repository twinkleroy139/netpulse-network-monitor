const API_BASE = "https://netpulse-network-monitor.onrender.com";

let healthChart = null;
window.pollTimer = null;
let currentInterval = 5000;
let allDevicesData = [];

// Clock Updater
setInterval(() => {
    document.getElementById('current-time').innerText = new Date().toLocaleTimeString();
}, 1000);

// Setup Navigation Clicks
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
        
        navDashboard.className = "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-500/10 text-blue-400 border-l-2 border-blue-500 transition";
        navAgents.className = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition";
    }

    function showAgents() {
        viewDashboard.classList.add('hidden');
        viewDashboard.classList.remove('block');
        viewAgents.classList.remove('hidden');
        viewAgents.classList.add('flex');
        
        navAgents.className = "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-500/10 text-blue-400 border-l-2 border-blue-500 transition";
        navDashboard.className = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition";
        
        renderFullAgentsTable();
    }

    if (navDashboard) navDashboard.addEventListener('click', showDashboard);
    if (navAgents) navAgents.addEventListener('click', showAgents);
    if (btnViewAll) btnViewAll.addEventListener('click', showAgents);
}

function initCharts() {
    const ctxHealth = document.getElementById('healthChart').getContext('2d');
    healthChart = new Chart(ctxHealth, {
        type: 'doughnut',
        data: {
            labels: ['Healthy', 'Warning', 'Critical'],
            datasets: [{ data: [0, 0, 0], backgroundColor: ['#34d399', '#fbbf24', '#fb7185'], borderWidth: 0, cutout: '80%' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

async function fetchStats() {
    try {
        let res = await fetch(`${API_BASE}/api/stats`);
        let data = await res.json();

        document.getElementById('stat-total').innerText = data.online + data.warning;
        document.getElementById('stat-online-text').innerHTML = `<span class="text-emerald-400">${data.online} Healthy</span> | <span class="text-amber-400">${data.warning} Warning</span>`;
        document.getElementById('stat-latency').innerText = data.avg_latency;
        document.getElementById('stat-loss').innerText = data.avg_packet_loss;
        document.getElementById('stat-jitter').innerText = data.avg_jitter;

        if (healthChart && data.total_devices > 0) {
            healthChart.data.datasets[0].data = [data.online, data.warning, data.offline];
            healthChart.update();
            document.getElementById('chart-center-pct').innerText = `${((data.online / data.total_devices) * 100).toFixed(1)}%`;
        }
    } catch (err) {
        console.error("Failed to fetch telemetry stats:", err);
    }
}

async function fetchDevices() {
    try {
        let res = await fetch(`${API_BASE}/api/devices`);
        allDevicesData = await res.json(); 
        
        let tbody = document.getElementById('device-table-body');
        tbody.innerHTML = "";

        allDevicesData.slice(0, 8).forEach(d => {
            let { badgeColor, statusDot } = getStatusColors(d.status);
            tbody.innerHTML += `
                <tr class="hover:bg-slate-800/30 transition-colors">
                    <td class="px-4 py-2"><div class="text-white font-medium">${d.name}</div><div class="text-[10px] text-slate-500 font-mono">${d.ip_address}</div></td>
                    <td class="px-4 py-2 text-slate-400">${d.type}</td>
                    <td class="px-4 py-2"><span class="px-2 py-0.5 text-[10px] font-medium rounded border flex items-center w-max gap-1.5 ${badgeColor}"><span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span> ${d.status}</span></td>
                    <td class="px-4 py-2 text-slate-300 font-mono">${d.latency_ms} ms</td>
                </tr>`;
        });

        if (!document.getElementById('view-agents').classList.contains('hidden')) {
            renderFullAgentsTable();
        }
    } catch (err) {
        console.error("Failed to fetch device grid:", err);
    }
}

function renderFullAgentsTable() {
    let tbody = document.getElementById('full-agents-table-body');
    tbody.innerHTML = "";
    allDevicesData.forEach(d => {
        let { badgeColor, statusDot } = getStatusColors(d.status);
        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="px-5 py-3 text-slate-300 font-mono text-xs">${d.device_id}</td>
                <td class="px-5 py-3 text-white font-medium">${d.name}</td>
                <td class="px-5 py-3 text-slate-400">${d.type}</td>
                <td class="px-5 py-3 text-slate-400 font-mono text-xs">${d.ip_address}</td>
                <td class="px-5 py-3"><span class="px-2 py-1 text-[10px] font-medium rounded border flex items-center w-max gap-1.5 ${badgeColor}"><span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span> ${d.status}</span></td>
                <td class="px-5 py-3 text-slate-300 font-mono">${d.latency_ms} ms</td>
                <td class="px-5 py-3 text-slate-300 font-mono">${d.jitter_ms} ms</td>
                <td class="px-5 py-3 text-slate-300 font-mono">${d.packet_loss}%</td>
            </tr>`;
    });
}

function getStatusColors(status) {
    if (status === "Warning") return { badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30", statusDot: "bg-amber-400" };
    if (status === "Offline") return { badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30", statusDot: "bg-rose-400" };
    return { badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", statusDot: "bg-emerald-400" };
}

function startPolling() {
    if (window.pollTimer) clearInterval(window.pollTimer);
    window.pollTimer = setInterval(() => { fetchStats(); fetchDevices(); }, currentInterval);
}

function initDashboard() {
    // Read the dropdown immediately on load
    currentInterval = parseInt(document.getElementById('polling-interval').value);

    initNavigation();
    initCharts();
    fetchStats();
    fetchDevices();
    startPolling();
    
    // Bind the Apply button
    document.getElementById('apply-polling').addEventListener('click', () => {
        currentInterval = parseInt(document.getElementById('polling-interval').value);
        fetchStats(); 
        fetchDevices(); 
        startPolling();
    });

    document.getElementById('export-csv-btn').addEventListener('click', () => window.open(`${API_BASE}/api/export`, '_blank'));
}

window.addEventListener('DOMContentLoaded', initDashboard);