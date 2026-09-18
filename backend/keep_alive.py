"""
keep_alive.py — 24/7 Cloud Backend Keep-Alive Sentinel
Pings the Render production backend at regular intervals (every 10 minutes)
to prevent cold-start spin-down (HTTP 502 / gateway timeouts).
"""
import time
import urllib.request
import ssl
from datetime import datetime, timezone

TARGET_URL = 'https://digital-kaam-bakend.onrender.com/health'
PING_INTERVAL_SECONDS = 600

def ping_once():
    ctx = ssl.create_default_context()
    start = time.time()
    try:
        req = urllib.request.Request(
            TARGET_URL,
            headers={'User-Agent': 'DigitalKaamSentinel/2.0'}
        )
        with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
            elapsed = time.time() - start
            ts = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
            print(f'[{ts}] Keep-alive heartbeat OK ({resp.status}) - Latency: {elapsed:.2f}s')
            return True
    except Exception as e:
        elapsed = time.time() - start
        ts = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
        print(f'[{ts}] Keep-alive ping NOTICE ({e}) - Latency: {elapsed:.2f}s')
        return False

def main():
    print(f'Starting Digital Kaam Keep-Alive Sentinel for {TARGET_URL}')
    print(f'Interval: every {PING_INTERVAL_SECONDS} seconds')
    while True:
        ping_once()
        time.sleep(PING_INTERVAL_SECONDS)

if __name__ == '__main__':
    main()
