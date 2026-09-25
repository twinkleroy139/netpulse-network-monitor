import time
import random
import requests
import argparse
from datetime import datetime

API_URL = "https://netpulse-network-monitor.onrender.com/api/telemetry"

def generate_telemetry(device_id, name, api_key):
    # Simulate realistic network variance
    latency = round(random.uniform(10.0, 45.0), 2)
    loss = round(random.uniform(0.0, 0.5), 2)
    
    # Introduce occasional network spikes
    if random.random() > 0.85:
        latency += random.uniform(50.0, 100.0)
        loss += random.uniform(1.0, 5.0)
        # Add these two lines to keep the console clean:
        latency = round(latency, 2)
        loss = round(loss, 2)

    # Determine status based on thresholds
    status = "Online"
    if latency > 100 or loss > 2.0:
        status = "Warning"
    if loss > 5.0:
        status = "Offline"
        latency = 0.0

    return {
        "api_key": api_key,
        "device_id": device_id,
        "name": name,
        "latency_ms": latency,
        "packet_loss": loss,
        "status": status
    }

def run_agent(args):
    print(f"[*] Starting NetPulse Agent: {args.name} ({args.id})")
    print(f"[*] Target API: {API_URL}")
    print(f"[*] Environment Key: {args.key}")
    print("-" * 50)
    
    while True:
        payload = generate_telemetry(args.id, args.name, args.key)
        try:
            response = requests.post(API_URL, json=payload, timeout=5)
            if response.status_code == 200:
                print(f"[+] [{datetime.now().strftime('%H:%M:%S')}] Pushed | Status: {payload['status']:<8} | Latency: {payload['latency_ms']:>6}ms | Loss: {payload['packet_loss']}%")
            else:
                print(f"[-] HTTP Error: {response.status_code} - {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"[-] Connection failed. Is the FastAPI backend running? Error: {e}")
        
        time.sleep(5)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NetPulse Telemetry Agent")
    parser.add_argument("--key", required=True, help="Environment API Key (User UID)")
    parser.add_argument("--name", required=True, help="Friendly name of the device (e.g., Core-Router)")
    parser.add_argument("--id", required=True, help="Unique Device ID (e.g., DEV-01)")
    
    args = parser.parse_args()
    run_agent(args)