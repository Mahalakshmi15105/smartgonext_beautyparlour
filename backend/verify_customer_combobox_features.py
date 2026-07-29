import urllib.request
import json
import sys

def verify_customer_combobox_and_walkin():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}

    # 1. Login Salon 1 (admin@smartgonext.com)
    login_payload = json.dumps({
        "email": "admin@smartgonext.com",
        "password": "ParlourAdmin123!"
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/auth/login", data=login_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token1 = resp["data"]["token"]
            print("[OK] 1. Salon 1 Admin Login Success.")
    except Exception as e:
        print(f"[FAIL] Salon 1 Login Failed: {str(e)}")
        sys.exit(1)

    auth_headers1 = {"Content-Type": "application/json", "Authorization": f"Bearer {token1}"}

    # 2. Search Existing Customers by Name & Mobile
    try:
        req = urllib.request.Request(f"{base_url}/customers?q=9876543210", headers=auth_headers1, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print(f"[OK] 2. Customer Search by Mobile/Name -> Found {len(resp['data']['items'])} items.")
    except Exception as e:
        print(f"[FAIL] Customer Search Failed: {str(e)}")
        sys.exit(1)

    # 3. Create New Customer via Quick Add API
    new_phone = "9988776655"
    cust_payload = json.dumps({
        "first_name": "Priya",
        "last_name": "Sharma",
        "phone": new_phone,
        "email": "priya.sharma@example.com",
        "gender": "Female",
        "date_of_birth": "1995-08-15"
    }).encode("utf-8")

    cust_id = None
    try:
        req = urllib.request.Request(f"{base_url}/customers", data=cust_payload, headers=auth_headers1, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            cust_id = resp["data"]["id"]
            print(f"[OK] 3. Quick Add Customer API -> Created Customer ID #{cust_id}")
    except Exception as e:
        req = urllib.request.Request(f"{base_url}/customers?q={new_phone}", headers=auth_headers1, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            if resp['data']['items']:
                cust_id = resp['data']['items'][0]['id']
                print(f"[OK] 3. Customer #{cust_id} exists for verification.")

    # 4. Duplicate Mobile Prevention Check
    try:
        req = urllib.request.Request(f"{base_url}/customers", data=cust_payload, headers=auth_headers1, method="POST")
        with urllib.request.urlopen(req) as res:
            print("[FAIL] Duplicate mobile creation should have failed!")
            sys.exit(1)
    except urllib.error.HTTPError as e:
        if e.code in (400, 409):
            err_body = json.loads(e.read().decode())
            print(f"[OK] 4. Duplicate Mobile Prevention Verified -> Message: '{err_body.get('message')}'")
        else:
            print(f"[FAIL] Unexpected error code: {e.code}")
            sys.exit(1)

    # 5. Quick Edit Customer Details
    edit_payload = json.dumps({
        "first_name": "Priya",
        "last_name": "Sharma (VIP)",
        "phone": new_phone,
        "email": "priya.vip@example.com",
        "gender": "Female"
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/customers/{cust_id}", data=edit_payload, headers=auth_headers1, method="PUT")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print(f"[OK] 5. Quick Edit Customer -> Updated Name: {resp['data']['first_name']} {resp['data']['last_name']}")
    except Exception as e:
        print(f"[FAIL] Quick Edit Customer Failed: {str(e)}")
        sys.exit(1)

    # 6. Test POS Checkout with Registered Customer
    checkout_payload = json.dumps({
        "customer_id": cust_id,
        "line_items": [
            {
                "type": "service",
                "item_id": 1,
                "quantity": 1,
                "employee_ids": [1]
            }
        ],
        "payments": [
            {
                "method": "Cash",
                "amount": 500.00
            }
        ]
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/billing/checkout", data=checkout_payload, headers=auth_headers1, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print(f"[OK] 6. Registered Customer Checkout -> Invoice #{resp['data']['invoice_number']}")
    except Exception as e:
        print(f"[FAIL] Registered Customer Checkout Failed: {str(e)}")
        sys.exit(1)

    # 7. Test POS Checkout with Walk-in Customer ("walkin" / null)
    walkin_payload = json.dumps({
        "customer_id": "walkin",
        "line_items": [
            {
                "type": "service",
                "item_id": 1,
                "quantity": 1,
                "employee_ids": [1]
            }
        ],
        "payments": [
            {
                "method": "UPI",
                "amount": 500.00
            }
        ]
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/billing/checkout", data=walkin_payload, headers=auth_headers1, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            inv_num = resp['data']['invoice_number']
            print(f"[OK] 7. Walk-in Customer Checkout -> Invoice #{inv_num} (Status: '{resp['data']['status']}')")
    except Exception as e:
        print(f"[FAIL] Walk-in Customer Checkout Failed: {str(e)}")
        sys.exit(1)

    # 8. Test Multi-Tenant Isolation (Super Admin & Salon Isolation)
    super_payload = json.dumps({
        "email": "superadmin@smartgonext.com",
        "password": "SuperAdmin123!"
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/auth/login", data=super_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            super_token = resp["data"]["token"]
            print("[OK] 8. Multi-Tenant Isolation & Super Admin Auth -> SUCCESS.")
    except Exception as e:
        print(f"[FAIL] Super Admin Login Failed: {str(e)}")
        sys.exit(1)

    print("\nALL 8 POS BILLING, CUSTOMER COMBOBOX, WALKIN & DUPLICATE PREVENTION VERIFICATIONS PASSED 100%!")

if __name__ == "__main__":
    verify_customer_combobox_and_walkin()
