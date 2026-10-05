// frontend/js/firebase_client.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, setDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";
import { processTelemetryData, updateTables } from "./ui_charts.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export let allDevicesMap = new Map();
export let allDevicesData = [];
export let firestoreUnsubscribe = null;

export function listenToFirestore(ENVIRONMENT_KEY, currentEnvironmentFilter) {
    if (firestoreUnsubscribe) firestoreUnsubscribe();
    
    const devicesRef = collection(db, "networks", ENVIRONMENT_KEY, "devices");
    
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
        processTelemetryData(allDevicesData, currentEnvironmentFilter);
        updateTables(allDevicesData, currentEnvironmentFilter);
    }, (error) => {
        console.error("Error listening to Firestore:", error);
    });
}

export function startWatchdogTimer(currentEnvironmentFilter) {
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
            processTelemetryData(allDevicesData, currentEnvironmentFilter);
            updateTables(allDevicesData, currentEnvironmentFilter);
        }
    }, 5000);
}



export async function triggerSpeedTest(ENVIRONMENT_KEY) {
    const commandRef = doc(db, "networks", ENVIRONMENT_KEY, "commands", "speedtest");
    await setDoc(commandRef, {
        action: "run_speed_test",
        timestamp: Date.now(),
        status: "pending"
    });
}




// frontend/js/firebase_client.js

export let speedTestUnsubscribe = null;

export function listenToSpeedTests(ENVIRONMENT_KEY) {
    if (speedTestUnsubscribe) speedTestUnsubscribe();
    
    const historyRef = collection(db, "networks", ENVIRONMENT_KEY, "speed_history");
    const q = query(historyRef, orderBy("timestamp", "desc"), limit(10));
    
    speedTestUnsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) return;

        const tableBody = document.getElementById('speed-history-table');
        if (tableBody) tableBody.innerHTML = ""; // Clear the "No tests run yet" message
        
        let isFirst = true;

        snapshot.forEach((doc) => {
            const data = doc.data();
            const date = new Date(data.timestamp * 1000).toLocaleTimeString();
            const dl = data.download_mbps.toFixed(2);
            const ul = data.upload_mbps.toFixed(2);
            const ping = data.latency_ms.toFixed(2);
            
            // --- Capacity Math ---
            // Formula: calls = floor(min(download, upload) * 1000 * 0.8 / codec_kbps)
            // We use Opus (40kbps) for the table view standard
            const minSpeedMbps = Math.min(data.download_mbps, data.upload_mbps);
            const usableKbps = (minSpeedMbps * 1000) * 0.8; 
            const estCallsTable = Math.floor(usableKbps / 40);

            // Update the big summary cards with the MOST RECENT test only
            if (isFirst) {
                const dlEl = document.getElementById('speed-dl');
                const ulEl = document.getElementById('speed-ul');
                const pingEl = document.getElementById('speed-ping');
                const verdictEl = document.getElementById('voip-verdict-text');
                const badgeEl = document.getElementById('voip-readiness-badge');

                if(dlEl) dlEl.innerText = dl;
                if(ulEl) ulEl.innerText = ul;
                if(pingEl) pingEl.innerText = ping;

                if (verdictEl && badgeEl) {
                    badgeEl.classList.remove('hidden');
                    if (data.download_mbps > 50 && data.latency_ms < 50) {
                        verdictEl.innerHTML = `<span class="text-emerald-400"><i class="fas fa-check-circle"></i> Ready for Enterprise VoIP</span>`;
                    } else if (data.latency_ms > 100) {
                        verdictEl.innerHTML = `<span class="text-rose-400"><i class="fas fa-times-circle"></i> Not Ready (High Latency)</span>`;
                    } else {
                        verdictEl.innerHTML = `<span class="text-amber-400"><i class="fas fa-exclamation-triangle"></i> Marginal Quality</span>`;
                    }
                }

                // Attach dynamic listener to the dropdown for the big capacity number
                const codecSelect = document.getElementById('voip-codec');
                const capEl = document.getElementById('voip-capacity');
                
                const updateCapacity = () => {
                    if(!codecSelect || !capEl) return;
                    const codecKbps = parseInt(codecSelect.value);
                    const dynamicCalls = Math.floor(usableKbps / codecKbps);
                    capEl.innerText = dynamicCalls.toLocaleString();
                };

                if (codecSelect) {
                    codecSelect.removeEventListener('change', updateCapacity); // Prevent duplicate listeners
                    codecSelect.addEventListener('change', updateCapacity);
                    updateCapacity(); // Run immediately
                }
                
                isFirst = false;
            }

            // Populate Table Row
            if (tableBody) {
                tableBody.innerHTML += `
                    <tr class="hover:bg-slate-800/30 transition-colors border-b border-slate-800/40 last:border-0">
                        <td class="px-4 py-3 text-slate-400">${date}</td>
                        <td class="px-4 py-3 font-medium text-emerald-400"><i class="fas fa-arrow-down text-[10px] mr-1"></i> ${dl}</td>
                        <td class="px-4 py-3 font-medium text-blue-400"><i class="fas fa-arrow-up text-[10px] mr-1"></i> ${ul}</td>
                        <td class="px-4 py-3 text-slate-300">${ping}</td>
                        <td class="px-4 py-3 font-bold text-white">${estCallsTable.toLocaleString()}</td>
                    </tr>
                `;
            }
        });
    });
}