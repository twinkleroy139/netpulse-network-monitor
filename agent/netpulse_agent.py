import time
import random
import argparse
import json
import urllib.request
from datetime import datetime

API_URL = "https://netpulse-network-monitor.onrender.com/api/telemetry"

def generate_telemetry(device_id, name, api_key):
    latency = round(random.uniform(10.0, 45.0), 2)
    loss = round(random.uniform(0.0, 0.5), 2)
    
    if random.random() > 0.85:
        latency += random.uniform(50.0, 100.0)
        loss += random.uniform(1.0, 5.0)
        latency = round(latency, 2)
        loss = round(loss, 2)

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
        data = json.dumps(payload).encode('utf-8')
        
        req = urllib.request.Request(API_URL, data=data, headers={'Content-Type': 'application/json'}, method='POST')
        
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    print(f"[+] [{datetime.now().strftime('%H:%M:%S')}] Pushed | Status: {payload['status']:<8} | Latency: {payload['latency_ms']:>6}ms | Loss: {payload['packet_loss']}%")
                else:
                    print(f"[-] HTTP Error: {response.status}")
        except Exception as e:
            print(f"[-] Connection failed. Error: {e}")
        
        time.sleep(5)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NetPulse Telemetry Agent")
    parser.add_argument("--key", required=True, help="Environment API Key")
    parser.add_argument("--name", required=True, help="Friendly name of the device")
    parser.add_argument("--id", required=True, help="Unique Device ID")
    
    args = parser.parse_args()
    run_agent(args)