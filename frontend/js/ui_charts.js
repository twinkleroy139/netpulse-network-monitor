// frontend/js/ui_charts.js
import { calculateMOS } from "./voip_engine.js";

export let healthChart = null;
export let latencyChart = null;
export let networkTopology = null;
export let topoNodes = new vis.DataSet([]);
export let topoEdges = new vis.DataSet([]);

export function initTopology() {
    const container = document.getElementById('topology-network');
    if(!container) return;
    
    // NEW: Clear old data before drawing to prevent duplicate ID crashes
    topoNodes.clear();
    topoEdges.clear();

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

export function initCharts() {
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

export function processTelemetryData(devices, currentEnvironmentFilter) {
    const warnLatEl = document.getElementById('warn-latency');
    const warnLossEl = document.getElementById('warn-loss');

    if (devices.length === 0) {
        const statTotal = document.getElementById('stat-total');
        if(statTotal) statTotal.innerText = "0";
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
        const statTotal = document.getElementById('stat-total');
        const statLatency = document.getElementById('stat-latency');
        const statLoss = document.getElementById('stat-loss');
        const statOnlineText = document.getElementById('stat-online-text');
        
        if(statTotal) statTotal.innerText = "0";
        if(statLatency) statLatency.innerText = "--";
        if(statLoss) statLoss.innerText = "--";
        if(statOnlineText) statOnlineText.innerHTML = `<span class="text-slate-500">No active agents.</span>`;
        if (warnLatEl) warnLatEl.classList.add('hidden');
        if (warnLossEl) warnLossEl.classList.add('hidden');
        
        if (healthChart) {
            healthChart.data.datasets[0].data = [0, 0, 1];
            healthChart.update();
            const pct = document.getElementById('chart-center-pct');
            if(pct) {
                pct.innerText = "N/A";
                pct.classList.add("text-sm");
            }
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

    let activeAgentCount = online + warning;
    let avgLatency = "0.00";
    let avgLoss = "0.00";

    if (activeAgentCount > 0) {
        avgLatency = (totalLatency / activeAgentCount).toFixed(2);
        avgLoss = (totalLoss / activeAgentCount).toFixed(2);
    } 

    const statTotal = document.getElementById('stat-total');
    if(statTotal) statTotal.innerText = filteredDevices.length;
    
    const statOnlineText = document.getElementById('stat-online-text');
    if(statOnlineText) statOnlineText.innerHTML = `<span class="text-emerald-400">${online} Healthy</span> | <span class="text-amber-400">${warning} Warning</span> | <span class="text-rose-400">${offline} Offline</span>`;
    
    const statLat = document.getElementById('stat-latency');
    if(statLat) statLat.innerText = avgLatency;
    
    const statLoss = document.getElementById('stat-loss');
    if(statLoss) statLoss.innerText = avgLoss;

    const statJit = document.getElementById('stat-jitter');
    let simulatedJitter = (Math.random() * 5).toFixed(2);
    
    if (activeAgentCount === 0) {
        simulatedJitter = "0.00";
    }
    if(statJit) statJit.innerText = simulatedJitter; 

    // MOS Calculation & UI Update
    const mosData = calculateMOS(parseFloat(avgLatency), parseFloat(simulatedJitter), parseFloat(avgLoss));
    
    const statMos = document.getElementById('stat-mos');
    const statMosLabel = document.getElementById('stat-mos-label');
    const cardMos = document.getElementById('card-mos');
    const warnMos = document.getElementById('warn-mos');

    if (activeAgentCount === 0) {
        if(statMos) statMos.innerText = "--";
        if(statMosLabel) statMosLabel.innerText = "";
        if(cardMos) cardMos.className = "noc-card rounded-xl p-5 border-t-2 border-t-slate-600 transition-colors duration-300";
        if(warnMos) warnMos.classList.add('hidden');
    } else {
        if(statMos) {
            statMos.innerText = mosData.score;
            statMos.className = `text-3xl font-bold ${mosData.colorClass}`;
        }
        if(statMosLabel) statMosLabel.innerText = mosData.label;
        if(cardMos) cardMos.className = `noc-card rounded-xl p-5 border-t-2 ${mosData.borderClass} transition-colors duration-300`;
        
        if (warnMos) {
            if (mosData.warning !== "") {
                warnMos.classList.remove('hidden');
                warnMos.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i> ${mosData.warning}`;
            } else {
                warnMos.classList.add('hidden');
            }
        }
        
        // Update Topology VoIP Node Color
        if (topoNodes.get(4)) { 
            let nodeColor = '#10b981'; // Green
            if (mosData.score < 3.6) nodeColor = '#f43f5e'; // Red
            else if (mosData.score < 4.0) nodeColor = '#fbbf24'; // Yellow
            
            topoNodes.update({ 
                id: 4, 
                color: { background: '#1e293b', border: nodeColor },
                title: `MOS: ${mosData.score} (${mosData.label})` 
            });
        }
    }
    
    // Existing Warning Logic
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
        
        if (pct) {
            if (activeAgentCount === 0) {
                pct.innerText = "N/A";
                pct.classList.add("text-sm");
            } else {
                pct.innerText = `${((online / activeAgentCount) * 100).toFixed(1)}%`;
                pct.classList.remove("text-sm");
            }
        }
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

export function updateTables(allDevicesData, currentEnvironmentFilter) {
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
        renderFullAgentsTable(allDevicesData);
    }
}

export function renderFullAgentsTable(allDevicesData) {
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