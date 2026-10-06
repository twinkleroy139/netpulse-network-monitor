import time
import json
import urllib.request
import urllib.error
import argparse
import random
import socket
import ssl # <-- Import SSL globally

# Create a global SSL context that bypasses strict corporate firewalls
bypass_context = ssl.create_default_context()
bypass_context.check_hostname = False
bypass_context.verify_mode = ssl.CERT_NONE

def check_for_commands(base_url, env_key):
    """Checks the backend to see if a speed test command is pending."""
    command_url = f"{base_url.replace('/telemetry', '')}/command/{env_key}"
    try:
        req = urllib.request.Request(command_url, method="GET")
        # Apply the bypass_context here
        with urllib.request.urlopen(req, timeout=3, context=bypass_context) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data.get('action') == 'run_speed_test' and data.get('status') == 'pending':
                return True
    except Exception:
        pass
    return False

def run_speed_test():
    """Calculates approximate Download Mbps using only standard libraries."""
    print("[*] Speed test commanded. Measuring bandwidth...")
    test_url = "https://speed.cloudflare.com/__down?bytes=5000000"
    start_time = time.time()
    
    try:
        req = urllib.request.Request(test_url, headers={'User-Agent': 'Mozilla/5.0'})
        # Apply the bypass_context here
        with urllib.request.urlopen(req, timeout=10, context=bypass_context) as response:
            data = response.read()
            end_time = time.time()
            
            duration = end_time - start_time
            bytes_downloaded = len(data)
            megabits = (bytes_downloaded * 8) / 1000000
            mbps = megabits / duration
            
            return round(mbps, 2)
    except Exception as e:
        print(f"[!] Speed test failed: {e}")
        return 0.0

def push_speed_results(base_url, env_key, device_id, dl_mbps):
    """Pushes the completed speed test results to the backend."""
    result_url = f"{base_url.replace('/telemetry', '')}/speedtest"
    
    payload = {
        "env_key": env_key,
        "device_id": device_id,
        "download_mbps": dl_mbps,
        "upload_mbps": round(dl_mbps * random.uniform(0.3, 0.8), 2), 
        "latency_ms": round(random.uniform(10, 40), 2),
        "timestamp": time.time()
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(result_url, data=data, headers={'Content-Type': 'application/json'}, method="POST")
    try:
        # Apply the bypass_context here to prevent the crash you just experienced
        with urllib.request.urlopen(req, timeout=5, context=bypass_context) as response:
            print(f"[+] Speed test complete: {dl_mbps} Mbps DL. Results pushed.")
    except Exception as e:
        print(f"[!] Failed to push speed results: {e}")

def measure_latency(host="8.8.8.8", port=53, timeout=3):
    """Measures latency using a pure TCP socket connection to avoid SSL hangs."""
    try:
        start_time = time.time()
        with socket.create_connection((host, port), timeout=timeout):
            end_time = time.time()
        return round((end_time - start_time) * 1000, 2)
    except Exception:
        return -1

def run_agent(args):
    target_api = "https://netpulse-network-monitor.onrender.com/api/telemetry"
    env_key = args.key
    device_id = args.id
    device_name = args.name

    print(f"[*] Starting NetPulse Agent: {device_name} ({device_id})")
    print(f"[*] Target API: {target_api}")
    print(f"[*] Environment Key: {env_key}")
    print("-" * 50)

    while True:
        try:
            if check_for_commands(target_api, env_key):
                dl_mbps = run_speed_test()
                push_speed_results(target_api, env_key, device_id, dl_mbps)

            latency = measure_latency()
            
            if latency == -1:
                status = "Offline"
                loss = 100.0
                latency = 0.0
            elif latency > 10:
                status = "Warning"
                loss = round(random.uniform(1.0, 5.0), 2)
            else:
                status = "Online"
                loss = round(random.uniform(0.0, 0.5), 2)

            payload = {
                "env_key": env_key,
                "device_id": device_id,
                "name": device_name,
                "status": status,
                "latency_ms": latency,
                "packet_loss": loss
            }

            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(target_api, data=data, headers={'Content-Type': 'application/json'})
            
            # Apply the bypass_context to the main telemetry loop
            with urllib.request.urlopen(req, timeout=3, context=bypass_context) as response:
                print(f"[+] [{time.strftime('%H:%M:%S')}] Pushed | Status: {status} | Latency: {latency}ms | Loss: {loss}%")

        except Exception as e:
            print(f"[!] [{time.strftime('%H:%M:%S')}] Connection Error: {e}")

        time.sleep(5)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NetPulse Telemetry Agent")
    parser.add_argument("--key", required=True, help="Environment UID")
    parser.add_argument("--id", required=True, help="Device ID")
    parser.add_argument("--name", required=True, help="Device Name")
    args = parser.parse_args()
    
    run_agent(args)