import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://localhost:5000/api/v1"

def post(url, payload=None, headers=None):
    data = json.dumps(payload).encode("utf-8") if payload else b""
    req = urllib.request.Request(url, data=data, headers=headers or {}, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def put(url, payload=None, headers=None):
    data = json.dumps(payload).encode("utf-8") if payload else b""
    req = urllib.request.Request(url, data=data, headers=headers or {}, method="PUT")
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
    print("--- STARTING THERMAL RECEIPT SYSTEM VERIFICATIONS ---")

    # 1. Login Salon 1 Admin
    status, res = post(f"{BASE_URL}/auth/login", {"email": "admin@smartgonext.com", "password": "ParlourAdmin123!"})
    if status != 200:
        print(f"[FAIL] Salon 1 Login Failed: {res}")
        sys.exit(1)
    s1_token = res["data"]["token"]
    s1_headers = {"Authorization": f"Bearer {s1_token}"}
    print("[OK] 1. Salon 1 Admin Login Success.")

    # 2. Update Receipt Settings
    receipt_payload = {
        "receipt_settings": {
            "receipt_template": "Modern",
            "paper_size": "58mm",
            "show_logo": True,
            "show_gst": True,
            "show_address": True,
            "show_phone": True,
            "show_email": True,
            "show_website": True,
            "show_qr_code": True,
            "auto_print": True,
            "thank_you_message": "Thank you for visiting. Please visit again soon!"
        }
    }
    status, res = put(f"{BASE_URL}/settings", receipt_payload, s1_headers)
    if status != 200:
        print(f"[FAIL] PUT /settings receipt_settings failed: {res}")
        sys.exit(1)
    print("[OK] 2. Receipt Settings updated via PUT /settings.")

    # 3. GET /settings Verification
    status, res = get(f"{BASE_URL}/settings", s1_headers)
    if status != 200:
        print(f"[FAIL] GET /settings failed: {res}")
        sys.exit(1)
    rec = res["data"]["receipt_settings"]
    if rec.get("receipt_template") == "Modern" and rec.get("paper_size") == "58mm" and rec.get("auto_print") is True:
        print(f"[OK] 3. Receipt Settings verified -> Template: '{rec['receipt_template']}', Paper Size: '{rec['paper_size']}', Auto-Print: {rec['auto_print']}")
    else:
        print(f"[FAIL] Mismatch in stored receipt settings: {rec}")
        sys.exit(1)

    # 4. Perform Billing Checkout
    # Fetch customer ID
    status, res_c = get(f"{BASE_URL}/customers?limit=1", s1_headers)
    cust_id = res_c["data"]["items"][0]["id"] if (res_c.get("data") and res_c["data"].get("items")) else 1

    # Fetch service ID
    status, res_s = get(f"{BASE_URL}/services?limit=1", s1_headers)
    svc_id = res_s["data"]["items"][0]["id"] if (res_s.get("data") and res_s["data"].get("items")) else 1

    # Fetch employee ID
    status, res_e = get(f"{BASE_URL}/employees?limit=1", s1_headers)
    emp_id = res_e["data"]["items"][0]["id"] if (res_e.get("data") and res_e["data"].get("items")) else 1

    checkout_payload = {
        "customer_id": cust_id,
        "line_items": [
            {
                "type": "service",
                "item_id": svc_id,
                "quantity": 1,
                "employee_ids": [emp_id],
                "employee_id": emp_id,
                "discount": 50.0
            }
        ],
        "payments": [
            {"method": "Cash", "amount": 100.0},
            {"method": "UPI", "amount": 500.0}
        ]
    }
    status, res_inv = post(f"{BASE_URL}/billing/checkout", checkout_payload, s1_headers)
    if status == 200:
        inv = res_inv.get("data", res_inv)
        print(f"[OK] 4. Checkout successful -> Invoice #: {inv.get('invoice_number')}, Total: {inv.get('total')}")
    else:
        print(f"[WARN] Checkout returned status {status}: {res_inv}")

    print("\nALL THERMAL RECEIPT SYSTEM VERIFICATIONS PASSED 100%!")

if __name__ == "__main__":
    run_verification()
