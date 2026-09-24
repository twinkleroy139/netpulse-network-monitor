import csv
from io import StringIO
from flask import Response


import threading
import time
from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import func
from backend.app.core.database import db
from backend.app.models.device import DeviceModel
from backend.app.simulation.engine import init_simulated_devices, update_simulated_devices

app = Flask(__name__)
CORS(app)  # <--- Allow frontend polling from any origin

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///netpulse.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def background_simulation_loop():
    """Continuously shifts device statuses in the background every 5 seconds."""
    while True:
        time.sleep(5)
        with app.app_context():
            try:
                update_simulated_devices()
            except Exception as e:
                print(f"[-] Simulation loop error: {e}")

@app.route("/")
def read_root():
    return jsonify({
        "project": "NetPulse Network Device Monitoring & Topology Visualization",
        "status": "Running",
        "stage": "Stage 1 - Simulated 500+ Devices (Flask Edition)"
    })

@app.route("/api/stats")
def get_dashboard_stats():
    total = DeviceModel.query.count()
    online = DeviceModel.query.filter_by(status="Online").count()
    warning = DeviceModel.query.filter_by(status="Warning").count()
    offline = DeviceModel.query.filter_by(status="Offline").count()

    # Calculate system-wide averages. Filter out Offline nodes for latency/jitter to prevent skewing the average down to 0.
    avg_lat = db.session.query(func.avg(DeviceModel.latency_ms)).filter(DeviceModel.status != "Offline").scalar() or 0.0
    avg_jit = db.session.query(func.avg(DeviceModel.jitter_ms)).filter(DeviceModel.status != "Offline").scalar() or 0.0
    avg_loss = db.session.query(func.avg(DeviceModel.packet_loss)).scalar() or 0.0

    return jsonify({
        "total_devices": total,
        "online": online,
        "warning": warning,
        "offline": offline,
        "avg_latency": round(avg_lat, 2),
        "avg_jitter": round(avg_jit, 2),
        "avg_packet_loss": round(avg_loss, 2)
    })

@app.route("/api/devices")
def get_devices():
    """Returns the list of all 500+ simulated network devices."""
    devices = DeviceModel.query.all()
    result = []
    for d in devices:
        result.append({
            "id": d.id,
            "device_id": d.device_id,
            "name": d.name,
            "type": d.type,
            "ip_address": d.ip_address,
            "status": d.status,
            "latency_ms": d.latency_ms,
            "cpu_usage": d.cpu_usage,
            "memory_usage": d.memory_usage,
            "jitter_ms": d.jitter_ms,
            "packet_loss": d.packet_loss,
            "last_updated": d.last_updated.isoformat() if d.last_updated else None
        })
    return jsonify(result)

@app.route("/api/export")
def export_devices_csv():
    """Generates a downloadable CSV report of all network agents."""
    devices = DeviceModel.query.all()
    
    si = StringIO()
    cw = csv.writer(si)
    
    # Write the CSV Header row
    cw.writerow(['Device ID', 'Name', 'Type', 'IP Address', 'Status', 'Latency (ms)', 'Jitter (ms)', 'Packet Loss (%)', 'Last Updated'])
    
    # Write the data rows
    for d in devices:
        cw.writerow([
            d.device_id, 
            d.name, 
            d.type, 
            d.ip_address, 
            d.status, 
            d.latency_ms, 
            d.jitter_ms, 
            d.packet_loss, 
            d.last_updated
        ])
    
    output = Response(si.getvalue(), mimetype="text/csv")
    output.headers["Content-Disposition"] = "attachment; filename=netpulse_telemetry_report.csv"
    return output
    

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        init_simulated_devices(total_devices=500)
    
    # Start background simulation thread
    sim_thread = threading.Thread(target=background_simulation_loop, daemon=True)
    sim_thread.start()

    print("[+] Starting NetPulse Flask Server on http://127.0.0.1:8000")
    app.run(host="0.0.0.0", port=8000, debug=False)