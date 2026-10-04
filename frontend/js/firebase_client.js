// frontend/js/firebase_client.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; // <-- Updated import
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