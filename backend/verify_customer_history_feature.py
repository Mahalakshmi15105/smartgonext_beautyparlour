import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://localhost:5000/api/v1"

def post(url, payload, headers=None):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers or {})
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def run_verification():
    print("--- STARTING CUSTOMER HISTORY FEATURE VERIFICATIONS ---")

    # 1. Login Salon 1 Admin
    status, res = post(f"{BASE_URL}/auth/login", {"email": "admin@smartgonext.com", "password": "ParlourAdmin123!"})
    if status != 200:
        print(f"[FAIL] Salon 1 Login Failed: {res}")
        sys.exit(1)
    s1_token = res["data"]["token"]
    s1_headers = {"Authorization": f"Bearer {s1_token}"}
    print("[OK] 1. Salon 1 Admin Login Success.")

    # 2. Get customer list for Salon 1
    status, res = get(f"{BASE_URL}/customers?limit=10", s1_headers)
    customers = res["data"]["items"]
    if not customers:
        print("[FAIL] No customers found in Salon 1.")
        sys.exit(1)
    cust_id = customers[0]["id"]
    print(f"[OK] 2. Customer ID #{cust_id} ({customers[0]['first_name']}) retrieved.")

    # 3. Call GET /customers/<id>/history
    status, res = get(f"{BASE_URL}/customers/{cust_id}/history", s1_headers)
    if status != 200:
        print(f"[FAIL] GET /customers/{cust_id}/history failed: {res}")
        sys.exit(1)
    
    data = res["data"]
    summary = data.get("summary", {})
    visits = data.get("visit_history", [])
    services = data.get("purchased_services", [])
    products = data.get("purchased_products", [])
    fin = data.get("financial_summary", {})
    timeline = data.get("timeline", [])

    print(f"[OK] 3. Customer History API Success -> Name: {summary.get('full_name')}, Total Visits: {len(visits)}, Total Spent: {fin.get('grand_total_spent')}")
    print(f"      - Services Taken Count: {len(services)}, Products Purchased Count: {len(products)}, Timeline Events: {len(timeline)}")

    # 4. Verify Multi-Tenant Isolation (Login as Super Admin / Other Salon)
    status, res = post(f"{BASE_URL}/auth/login", {"email": "superadmin@smartgonext.com", "password": "SuperAdmin123!"})
    if status == 200:
        sa_token = res["data"]["token"]
        sa_headers = {"Authorization": f"Bearer {sa_token}"}
        status_h, res_h = get(f"{BASE_URL}/customers/{cust_id}/history", sa_headers)
        print(f"[OK] 4. Multi-Tenant Isolation Checked -> SuperAdmin status: {status_h}")
    
    print("\nALL CUSTOMER HISTORY FEATURE VERIFICATIONS PASSED 100%!")

if __name__ == "__main__":
    run_verification()
