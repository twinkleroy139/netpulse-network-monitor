import random
from datetime import datetime
from backend.app.models.device import DeviceModel
from backend.app.core.database import db

DEVICE_TYPES = ["Router", "Switch", "Core-Switch", "Firewall", "Server", "Laptop", "Printer", "Mobile Device", "Workstation"]
LOCATIONS = ["DC-North", "DC-South", "HQ-Floor1", "HQ-Floor2", "Branch-East", "Branch-West"]

def init_simulated_devices(total_devices: int = 500):
    existing_count = DeviceModel.query.count()
    if existing_count >= total_devices:
        return

    print(f"[*] Generating {total_devices} simulated network devices...")
    
    devices_to_add = []
    for i in range(1, total_devices + 1):
        dev_type = random.choice(DEVICE_TYPES)
        location = random.choice(LOCATIONS)
        device_id = f"DEV-{i:04d}"
        name = f"{dev_type}-{location}-{i}"
        ip_address = f"10.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"
        
        status_roll = random.random()
        if status_roll < 0.82:
            status = "Online"
            latency = round(random.uniform(2.0, 45.0), 2)
            cpu = round(random.uniform(10.0, 65.0), 2)
            mem = round(random.uniform(20.0, 75.0), 2)
            jitter = round(random.uniform(0.5, 4.5), 2)
            loss = round(random.uniform(0.0, 0.5), 2)
        elif status_roll < 0.95:
            status = "Warning"
            latency = round(random.uniform(50.0, 150.0), 2)
            cpu = round(random.uniform(70.0, 92.0), 2)
            mem = round(random.uniform(80.0, 95.0), 2)
            jitter = round(random.uniform(5.0, 15.0), 2)
            loss = round(random.uniform(1.0, 5.0), 2)
        else:
            status = "Offline"
            latency = 0.0
            cpu = 0.0
            mem = 0.0
            jitter = 0.0
            loss = 100.0

        device = DeviceModel(
            device_id=device_id,
            name=name,
            type=dev_type,
            ip_address=ip_address,
            status=status,
            latency_ms=latency,
            cpu_usage=cpu,
            memory_usage=mem,
            jitter_ms=jitter,
            packet_loss=loss
        )
        devices_to_add.append(device)

    db.session.add_all(devices_to_add)
    db.session.commit()
    print("[+] Successfully initialized simulated devices!")

def update_simulated_devices():
    devices = DeviceModel.query.all()
    if not devices:
        return

    sample_size = max(1, int(len(devices) * 0.05))
    rolling_devices = random.sample(devices, sample_size)

    for dev in rolling_devices:
        roll = random.random()
        if roll < 0.70:
            dev.status = "Online"
            dev.latency_ms = round(random.uniform(2.0, 40.0), 2)
            dev.cpu_usage = round(random.uniform(15.0, 60.0), 2)
            dev.memory_usage = round(random.uniform(25.0, 70.0), 2)
            dev.jitter_ms = round(random.uniform(0.5, 4.5), 2)
            dev.packet_loss = round(random.uniform(0.0, 0.5), 2)
        elif roll < 0.90:
            dev.status = "Warning"
            dev.latency_ms = round(random.uniform(45.0, 140.0), 2)
            dev.cpu_usage = round(random.uniform(75.0, 94.0), 2)
            dev.memory_usage = round(random.uniform(80.0, 96.0), 2)
            dev.jitter_ms = round(random.uniform(5.0, 15.0), 2)
            dev.packet_loss = round(random.uniform(1.0, 5.0), 2)
        else:
            dev.status = "Offline"
            dev.latency_ms = 0.0
            dev.cpu_usage = 0.0
            dev.memory_usage = 0.0
            dev.jitter_ms = 0.0
            dev.packet_loss = 100.0
        
        dev.last_updated = datetime.utcnow()

    db.session.commit()