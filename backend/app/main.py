import os
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

# Define the expected incoming data structure from the agent
class TelemetryPayload(BaseModel):
    api_key: str
    device_id: str
    name: str
    latency_ms: float
    packet_loss: float
    status: str


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
        # Structure: networks -> {api_key} -> devices -> {device_id}
        doc_ref = db.collection("networks").document(payload.api_key) \
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



if __name__ == "__main__":
    # Fetch Render's assigned port, default to 8000 for local testing
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)