import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from backend.app.core.firebase_config import db

app = FastAPI(title="NetPulse API Gateway")

# Allow your frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# UPDATED: Changed 'api_key' to 'env_key' to match the new agent's payload
class TelemetryPayload(BaseModel):
    env_key: str
    device_id: str
    name: str
    latency_ms: float
    packet_loss: float
    status: str

# NEW: Payload definition for the speed test results
class SpeedTestPayload(BaseModel):
    env_key: str
    device_id: str
    download_mbps: float
    upload_mbps: float
    latency_ms: float
    timestamp: float


@app.get("/")
async def health_check():
    return {
        "service": "NetPulse API Gateway",
        "status": "Online",
        "database": "Firebase Firestore Connected"
    }


@app.post("/api/telemetry")
async def receive_telemetry(payload: TelemetryPayload):
    try:
        # Structure: networks -> {env_key} -> devices -> {device_id}
        doc_ref = db.collection("networks").document(payload.env_key) \
                    .collection("devices").document(payload.device_id)
        
        doc_ref.set({
            "name": payload.name,
            "latency_ms": payload.latency_ms,
            "packet_loss": payload.packet_loss,
            "status": payload.status,
            "last_updated": datetime.utcnow().isoformat()
        }, merge=True)
        
        return {"status": "success", "message": "Telemetry securely recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- NEW: Endpoint for Agent to check for commands ---
@app.get("/api/command/{env_key}")
async def get_commands(env_key: str):
    try:
        doc_ref = db.collection("networks").document(env_key).collection("commands").document("speedtest")
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return {"action": "none", "status": "none"}
    except Exception as e:
        return {"action": "none", "status": "error"}


# --- NEW: Endpoint for Agent to submit speed test results ---
@app.post("/api/speedtest")
async def ingest_speedtest(payload: SpeedTestPayload):
    try:
        # 1. Save the test result to a history collection
        history_ref = db.collection("networks").document(payload.env_key).collection("speed_history").document()
        history_ref.set({
            "device_id": payload.device_id,
            "download_mbps": payload.download_mbps,
            "upload_mbps": payload.upload_mbps,
            "latency_ms": payload.latency_ms,
            "timestamp": payload.timestamp
        })

        # 2. Mark the pending command as 'completed' so the agent doesn't loop
        command_ref = db.collection("networks").document(payload.env_key).collection("commands").document("speedtest")
        command_ref.set({"status": "completed"}, merge=True)

        return {"status": "success"}
    except Exception as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    # Uvicorn is required to run FastAPI apps
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port)