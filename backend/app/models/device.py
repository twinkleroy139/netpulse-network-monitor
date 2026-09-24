from datetime import datetime
from backend.app.core.database import db

class DeviceModel(db.Model):
    __tablename__ = "devices"

    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String, unique=True, index=True, nullable=False)
    name = db.Column(db.String, nullable=False)
    type = db.Column(db.String, nullable=False)        # Router, Switch, Server, Terminal, etc.
    ip_address = db.Column(db.String, nullable=False)
    status = db.Column(db.String, default="Online")    # Online, Warning, Offline
    
    # Existing Metrics
    latency_ms = db.Column(db.Float, default=0.0)
    cpu_usage = db.Column(db.Float, default=0.0)
    memory_usage = db.Column(db.Float, default=0.0)
    
    # New Phase 3 Metrics
    jitter_ms = db.Column(db.Float, default=0.0)
    packet_loss = db.Column(db.Float, default=0.0)     # Represented as a percentage (0.0 to 100.0)
    
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)