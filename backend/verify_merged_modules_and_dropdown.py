import urllib.request
import json
import sys
import time

def test_customer_dropdown_and_tenant_isolation():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}
    ts = int(time.time())

    # 1. Register Salon A
    reg_payload_a = json.dumps({
        "parlour_name": f"Module Test Salon A {ts}",
        "owner_name": "Salon A Owner",
        "email": f"owner_a_{ts}@salon.com",
        "password": "Password123!",
        "phone": f"+9198{ts % 100000000:08d}"
    }).encode("utf-8")

    token_a = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/register", data=reg_payload_a, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token_a = resp["data"]["token"]
            print("1. Salon A Registered Successfully.")
    except Exception as e:
        print(f"Salon A Registration failed: {str(e)}")
        sys.exit(1)

    auth_headers_a = {"Content-Type": "application/json", "Authorization": f"Bearer {token_a}"}

    # 2. Add 5 Customers to Salon A
    for i in range(1, 6):
        cust_payload = json.dumps({
            "first_name": f"SalonACustomer{i}",
            "last_name": "Client",
            "phone": f"980000000{i}",
            "gender": "Female"
        }).encode("utf-8")
        try:
            req = urllib.request.Request(f"{base_url}/customers", data=cust_payload, headers=auth_headers_a, method="POST")
            with urllib.request.urlopen(req) as res:
                pass
        except Exception as e:
            print(f"Failed to create customer {i}: {str(e)}")
            sys.exit(1)

    print("2. Created 5 Customers for Salon A.")

    # 3. Query Customers for Salon A
    try:
        req = urllib.request.Request(f"{base_url}/customers?limit=100", headers=auth_headers_a, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            cust_items = resp["data"]["items"]
            print(f"3. Verified Customer Dropdown API -> Retrieved ALL {len(cust_items)} active customers for Salon A.")
            if len(cust_items) < 5:
                print(f"FAILURE: Expected 5 customers, got {len(cust_items)}")
                sys.exit(1)
    except Exception as e:
        print(f"Customer query failed: {str(e)}")
        sys.exit(1)

    # 4. Register Salon B & Verify Multi-Tenant Isolation
    reg_payload_b = json.dumps({
        "parlour_name": f"Module Test Salon B {ts}",
        "owner_name": "Salon B Owner",
        "email": f"owner_b_{ts}@salon.com",
        "password": "Password123!",
        "phone": f"+9199{ts % 100000000:08d}"
    }).encode("utf-8")

    token_b = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/register", data=reg_payload_b, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token_b = resp["data"]["token"]
            print("4. Salon B Registered Successfully.")
    except Exception as e:
        print(f"Salon B Registration failed: {str(e)}")
        sys.exit(1)

    auth_headers_b = {"Content-Type": "application/json", "Authorization": f"Bearer {token_b}"}

    try:
        req = urllib.request.Request(f"{base_url}/customers?limit=100", headers=auth_headers_b, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            cust_items_b = resp["data"]["items"]
            print(f"5. Verified Multi-Tenant Isolation -> Salon B customer dropdown returned {len(cust_items_b)} customers (100% Isolated from Salon A).")
            if len(cust_items_b) > 0:
                print("FAILURE: Multi-tenant customer leakage detected!")
                sys.exit(1)
    except Exception as e:
        print(f"Salon B query failed: {str(e)}")
        sys.exit(1)

    print("\nALL VERIFICATIONS PASSED 100%!")

if __name__ == "__main__":
    test_customer_dropdown_and_tenant_isolation()
