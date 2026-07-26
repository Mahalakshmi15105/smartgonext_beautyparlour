import urllib.request
import json
import sys
import time

def verify_tenant_isolation():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}
    ts = int(time.time())

    # 1. Register Tenant A (ZL Salon)
    reg_a_payload = json.dumps({
        "parlour_name": f"ZL Salon {ts}",
        "owner_name": "Owner A",
        "email": f"zladmin_{ts}@parlour.com",
        "password": "Password123!",
        "phone": f"+919{ts % 1000000000:09d}"
    }).encode("utf-8")

    token_a = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/register", data=reg_a_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token_a = resp["data"]["token"]
            print("Tenant A (ZL Salon) Registered Successfully.")
    except Exception as e:
        print(f"Tenant A registration failed: {str(e)}")
        sys.exit(1)

    headers_a = {"Content-Type": "application/json", "Authorization": f"Bearer {token_a}"}

    # 2. Create Customer "Maha" in Tenant A
    cust_a_payload = json.dumps({
        "first_name": "Maha",
        "last_name": "TenantA",
        "phone": f"98{ts % 10000000:08d}",
        "gender": "Female"
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/customers", data=cust_a_payload, headers=headers_a, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print(f"Customer 'Maha' created in Tenant A (ID: {resp['data']['id']})")
    except Exception as e:
        print(f"Customer creation failed in Tenant A: {str(e)}")
        sys.exit(1)

    # 3. Register Tenant B (Glow Salon)
    reg_b_payload = json.dumps({
        "parlour_name": f"Glow Salon {ts}",
        "owner_name": "Owner B",
        "email": f"glowadmin_{ts}@parlour.com",
        "password": "Password123!",
        "phone": f"+918{ts % 1000000000:09d}"
    }).encode("utf-8")

    token_b = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/register", data=reg_b_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token_b = resp["data"]["token"]
            print("Tenant B (Glow Salon) Registered Successfully.")
    except Exception as e:
        print(f"Tenant B registration failed: {str(e)}")
        sys.exit(1)

    headers_b = {"Content-Type": "application/json", "Authorization": f"Bearer {token_b}"}

    # 4. CRITICAL MULTI-TENANT ISOLATION VERIFICATION:
    try:
        req = urllib.request.Request(f"{base_url}/customers", headers=headers_b, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            items = resp["data"]["items"]
            maha_found = any(c["first_name"] == "Maha" and c["last_name"] == "TenantA" for c in items)
            assert not maha_found, "SECURITY FAILURE: Customer 'Maha' leaked to Tenant B!"
            print(f"SUCCESS: Tenant Isolation Verified! Tenant B customers count: {len(items)} ('Maha' is NOT visible).")
    except Exception as e:
        print(f"Tenant isolation check failed: {str(e)}")
        sys.exit(1)

    # 5. Verify Predefined Categories for Tenant B
    try:
        req = urllib.request.Request(f"{base_url}/service-categories", headers=headers_b, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print("DEBUG service-categories response data:", resp["data"])
            cats = [c["name"] for c in resp["data"]]
            expected = ["Hair Care", "Skin Care", "Nail Care", "Grooming Services"]
            for exp in expected:
                assert exp in cats, f"Predefined category '{exp}' missing! Found: {cats}"
            print(f"SUCCESS: Predefined Categories Verified for Tenant B: {cats}")
    except Exception as e:
        print(f"Category verification failed: {str(e)}")
        sys.exit(1)

    # 6. Verify Super Admin Access Control Security Guard
    try:
        req = urllib.request.Request(f"{base_url}/super-admin/dashboard", headers=headers_b, method="GET")
        with urllib.request.urlopen(req) as res:
            print("SECURITY FAILURE: Tenant B accessed Super Admin endpoint!")
            sys.exit(1)
    except urllib.error.HTTPError as e:
        assert e.code == 403
        print("SUCCESS: Security Guard Verified! Tenant B blocked from Super Admin with HTTP 403 Forbidden.")

    print("\nMulti-Tenant Data Isolation and Architecture Verification Passed 100%!")

if __name__ == "__main__":
    verify_tenant_isolation()
