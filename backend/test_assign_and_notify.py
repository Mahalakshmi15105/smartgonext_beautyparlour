import urllib.request
import json
from datetime import datetime, timedelta, timezone

BASE_URL = "http://localhost:5000/api/v1"

# 1. Login
data = json.dumps({"email": "admin@smartgonext.com", "password": "ParlourAdmin123!"}).encode()
req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as res:
    token = json.loads(res.read().decode())["data"]["token"]

headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

# 2. Get customer & plan
req_c = urllib.request.Request(f"{BASE_URL}/customers?limit=1", headers=headers)
with urllib.request.urlopen(req_c) as res:
    cust_id = json.loads(res.read().decode())["data"]["items"][0]["id"]

req_p = urllib.request.Request(f"{BASE_URL}/membership-plans?limit=1", headers=headers)
with urllib.request.urlopen(req_p) as res:
    plan_id = json.loads(res.read().decode())["data"]["items"][0]["id"]

# 3. Assign membership
assign_payload = json.dumps({
    "customer_id": cust_id,
    "membership_plan_id": plan_id
}).encode()
req_a = urllib.request.Request(f"{BASE_URL}/memberships/assign", data=assign_payload, headers=headers)
try:
    with urllib.request.urlopen(req_a) as res:
        print("[OK] Assigned test membership to customer.")
except Exception as e:
    print(f"[INFO] Assign membership response: {str(e)}")

# 4. Trigger Expiry Check
req_ex = urllib.request.Request(f"{BASE_URL}/notifications/check-expiries", data=b"", headers=headers, method="POST")
with urllib.request.urlopen(req_ex) as res:
    print(f"[OK] Check expiries result: {res.read().decode()}")

# 5. Fetch Notifications
req_n = urllib.request.Request(f"{BASE_URL}/notifications?limit=10", headers=headers)
with urllib.request.urlopen(req_n) as res:
    print(f"[OK] Notifications list: {res.read().decode()}")
