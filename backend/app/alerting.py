# backend/app/alerting.py

import urllib.request
import json

DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1557149456955084850/yLBx9vxQnBehpEy0CPzeDZD6zMW5CGWWPfQdjWC3LC_GbaUcH6G-togi2TFIwTHbIZJL"

# In-memory dictionary to track device status and prevent alert spam
device_states = {}

def send_discord_alert(device_id: str, name: str, status: str, latency: float, loss: float):
    previous_status = device_states.get(device_id, "Online")
    
    # Only trigger if the status is bad AND it just changed state
    if status in ["Warning", "Offline"] and status != previous_status:
        # Hex colors: Red for Offline, Amber for Warning
        color = 15158332 if status == "Offline" else 16753920 
        
        message = {
            "username": "NetPulse NOC",
            "avatar_url": "https://cdn-icons-png.flaticon.com/512/3256/3256083.png",
            "embeds": [{
                "title": f"🚨 Alert: {name} is {status}",
                "description": f"The node **{device_id}** is currently experiencing network degradation.",
                "color": color,
                "fields": [
                    {"name": "Status", "value": status, "inline": True},
                    {"name": "Latency", "value": f"{latency} ms", "inline": True},
                    {"name": "Packet Loss", "value": f"{loss}%", "inline": True}
                ]
            }]
        }
        
        try:
            req = urllib.request.Request(
                DISCORD_WEBHOOK_URL, 
                data=json.dumps(message).encode('utf-8'), 
                headers={'Content-Type': 'application/json'},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=3):
                pass
        except Exception as e:
            print(f"[!] Discord Webhook Error: {e}")

    # Always update the tracker memory
    device_states[device_id] = status