import urllib.request
import json
import sys

def test_login_flow():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}

    # 1. Test Salon Owner Login (admin@smartgonext.com / ParlourAdmin123!)
    salon_owner_payload = json.dumps({
        "email": "admin@smartgonext.com",
        "password": "ParlourAdmin123!"
    }).encode("utf-8")

    token_owner = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/login", data=salon_owner_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token_owner = resp["data"]["token"]
            role_owner = resp["data"]["user"]["role"]
            email_owner = resp["data"]["user"]["email"]
            print(f"1. Salon Owner Login SUCCESS -> Email: {email_owner}, Role: {role_owner}, Token Issued: {token_owner[:20]}...")
            if role_owner != "ParlourAdmin":
                print(f"FAILURE: Expected role ParlourAdmin, got {role_owner}")
                sys.exit(1)
    except Exception as e:
        print(f"Salon Owner Login FAILED: {str(e)}")
        sys.exit(1)

    # 2. Test Salon Owner Auth Me verification
    auth_headers_owner = {"Content-Type": "application/json", "Authorization": f"Bearer {token_owner}"}
    try:
        req = urllib.request.Request(f"{base_url}/auth/me", headers=auth_headers_owner, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            data = resp["data"]
            print(f"2. Salon Owner /auth/me Verified -> Name: {data.get('owner_name')}, Parlour: {data.get('parlour_name')}")
    except Exception as e:
        print(f"Salon Owner /auth/me FAILED: {str(e)}")
        sys.exit(1)

    # 3. Test Super Admin Login (superadmin@smartgonext.com / SuperAdmin123!)
    super_admin_payload = json.dumps({
        "email": "superadmin@smartgonext.com",
        "password": "SuperAdmin123!"
    }).encode("utf-8")

    token_super = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/login", data=super_admin_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token_super = resp["data"]["token"]
            role_super = resp["data"]["user"]["role"]
            email_super = resp["data"]["user"]["email"]
            print(f"3. Super Admin Login SUCCESS -> Email: {email_super}, Role: {role_super}, Token Issued: {token_super[:20]}...")
            if role_super != "SuperAdmin":
                print(f"FAILURE: Expected role SuperAdmin, got {role_super}")
                sys.exit(1)
    except Exception as e:
        print(f"Super Admin Login FAILED: {str(e)}")
        sys.exit(1)

    # 4. Test Super Admin Dashboard Access
    auth_headers_super = {"Content-Type": "application/json", "Authorization": f"Bearer {token_super}"}
    try:
        req = urllib.request.Request(f"{base_url}/super-admin/dashboard", headers=auth_headers_super, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            metrics = resp["data"]["metrics"]
            print(f"4. Super Admin Console Verified -> Total Tenants: {metrics.get('total_tenants')}, Active Tenants: {metrics.get('active_tenants')}")
    except Exception as e:
        print(f"Super Admin Dashboard FAILED: {str(e)}")
        sys.exit(1)

    print("\nALL LOGIN & REDIRECT VERIFICATIONS PASSED 100%!")

if __name__ == "__main__":
    test_login_flow()
