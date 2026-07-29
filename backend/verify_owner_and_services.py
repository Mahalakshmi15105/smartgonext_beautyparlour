import urllib.request
import json
import sys
import time

def test_owner_info_and_service_loading():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}
    ts = int(time.time())

    # 1. Register Parlour Tenant "Sam's ZL Salon"
    reg_payload = json.dumps({
        "parlour_name": f"ZL Salon {ts}",
        "owner_name": "Sam",
        "email": f"sam_{ts}@zlsalon.com",
        "password": "Password123!",
        "phone": f"+9198{ts % 100000000:08d}"
    }).encode("utf-8")

    token = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/register", data=reg_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token = resp["data"]["token"]
            print("1. Salon Owner Sam Registered Successfully.")
    except Exception as e:
        print(f"Registration failed: {str(e)}")
        sys.exit(1)

    auth_headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

    # 2. Verify GET /auth/me returns owner_name and parlour_name dynamically
    try:
        req = urllib.request.Request(f"{base_url}/auth/me", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            me_data = resp["data"]
            print(f"2. Verified /auth/me -> Owner Name: '{me_data['owner_name']}', Parlour Name: '{me_data['parlour_name']}', Role: '{me_data['role']}'")
            if me_data['owner_name'] != "Sam":
                print("FAILURE: owner_name does not match 'Sam'")
                sys.exit(1)
    except Exception as e:
        print(f"Failed to fetch /auth/me: {str(e)}")
        sys.exit(1)

    # 3. Create 10 services under Tenant A
    cat_id = None
    try:
        req = urllib.request.Request(f"{base_url}/service-categories", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            cat_id = resp["data"][0]["id"]
    except Exception as e:
        print(f"Category fetch failed: {str(e)}")
        sys.exit(1)

    for i in range(1, 11):
        svc_payload = json.dumps({
            "category_id": cat_id,
            "name": f"Sam Custom Service {i}",
            "price": 500.00 + (i * 10),
            "duration_minutes": 30
        }).encode("utf-8")
        try:
            req = urllib.request.Request(f"{base_url}/services", data=svc_payload, headers=auth_headers, method="POST")
            with urllib.request.urlopen(req) as res:
                pass
        except Exception as e:
            print(f"Failed to create service {i}: {str(e)}")
            sys.exit(1)

    print("3. Created 10 Custom Services for Sam's ZL Salon.")

    # 4. Fetch Services for Tenant A
    try:
        req = urllib.request.Request(f"{base_url}/services?limit=100", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            total_items = len(resp["data"]["items"])
            print(f"4. Verified GET /services -> Retrieved ALL {total_items} services for Tenant A.")
            if total_items < 10:
                print(f"FAILURE: Expected at least 10 services, but got {total_items}")
                sys.exit(1)
    except Exception as e:
        print(f"Failed to fetch tenant services: {str(e)}")
        sys.exit(1)

    # 5. Multi-Tenant Isolation Check (Tenant B)
    reg_payload_b = json.dumps({
        "parlour_name": f"Glow Salon {ts}",
        "owner_name": "Maya",
        "email": f"maya_{ts}@glowsalon.com",
        "password": "Password123!",
        "phone": f"+9199{ts % 100000000:08d}"
    }).encode("utf-8")

    token_b = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/register", data=reg_payload_b, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token_b = resp["data"]["token"]
    except Exception as e:
        print(f"Tenant B Registration failed: {str(e)}")
        sys.exit(1)

    auth_headers_b = {"Content-Type": "application/json", "Authorization": f"Bearer {token_b}"}

    try:
        req = urllib.request.Request(f"{base_url}/services?q=Sam", headers=auth_headers_b, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            items_b = resp["data"]["items"]
            print(f"5. Verified Multi-Tenant Isolation -> Tenant B searching 'Sam' services returned {len(items_b)} items (100% Isolated).")
            if len(items_b) > 0:
                print("FAILURE: Multi-tenant data leakage detected!")
                sys.exit(1)
    except Exception as e:
        print(f"Tenant B query failed: {str(e)}")
        sys.exit(1)

    print("\nALL VERIFICATIONS PASSED 100%!")

if __name__ == "__main__":
    test_owner_info_and_service_loading()
