import urllib.request
import json
import sys

def verify_superadmin():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}

    # 1. Login as SuperAdmin
    login_payload = json.dumps({
        "email": "superadmin@smartgonext.com",
        "password": "SuperAdmin123!"
    }).encode("utf-8")

    sa_token = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/login", data=login_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            sa_token = resp["data"]["token"]
            print("SuperAdmin Login Successful.")
    except Exception as e:
        print(f"SuperAdmin login failed: {str(e)}")
        sys.exit(1)

    sa_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {sa_token}"
    }

    # 2. Test /super-admin/dashboard
    try:
        req = urllib.request.Request(f"{base_url}/super-admin/dashboard", headers=sa_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            data = resp["data"]["metrics"]
            print(f"SuperAdmin Dashboard Verified! Total Parlours: {data['total_tenants']}, MRR: INR {data['mrr']}, ARR: INR {data['arr']}")
    except Exception as e:
        print(f"SuperAdmin dashboard test failed: {str(e)}")
        sys.exit(1)

    # 3. Test Provisioning New Tenant
    provision_payload = json.dumps({
        "name": "Verify SuperAdmin Salon",
        "admin_email": "verifyadmin@salontest.com",
        "admin_password": "SalonAdmin123!",
        "plan_id": 1
    }).encode("utf-8")

    tenant_id = None
    try:
        req = urllib.request.Request(f"{base_url}/super-admin/tenants", data=provision_payload, headers=sa_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            tenant_id = resp["data"]["tenant_id"]
            print(f"Tenant Provisioning Verified! New Salon ID: {tenant_id}, Name: Verify SuperAdmin Salon")
    except Exception as e:
        print(f"Tenant provisioning test failed: {str(e)}")
        sys.exit(1)

    # 4. Test Updating Tenant Status (Suspend & Activate)
    try:
        update_payload = json.dumps({"status": "suspended"}).encode("utf-8")
        req = urllib.request.Request(f"{base_url}/super-admin/tenants/{tenant_id}", data=update_payload, headers=sa_headers, method="PUT")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            print("Tenant Status Update (Suspended) Verified!")
    except Exception as e:
        print(f"Tenant status update failed: {str(e)}")
        sys.exit(1)

    # 5. Test System Health Endpoint
    try:
        req = urllib.request.Request(f"{base_url}/super-admin/system-health", headers=sa_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            assert resp["data"]["status"] == "healthy"
            print(f"System Health Verified! Status: {resp['data']['status']}, DB: {resp['data']['database_status']}")
    except Exception as e:
        print(f"System health test failed: {str(e)}")
        sys.exit(1)

    # 6. Test Security Guard: Non-SuperAdmin Login and Access Rejection
    parlour_login_payload = json.dumps({
        "email": "admin@smartgonext.com",
        "password": "ParlourAdmin123!"
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/auth/login", data=parlour_login_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            pa_token = json.loads(res.read().decode())["data"]["token"]

        pa_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {pa_token}"
        }

        # Attempt SuperAdmin endpoint access with ParlourAdmin token
        req = urllib.request.Request(f"{base_url}/super-admin/dashboard", headers=pa_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            print("ERROR: Non-SuperAdmin should have been blocked with 403 Forbidden!")
            sys.exit(1)
    except urllib.error.HTTPError as e:
        assert e.code == 403
        resp = json.loads(e.read().decode())
        print(f"Authorization Guard Verified! Non-SuperAdmin blocked with HTTP 403: {resp['message']}")

    print("\nPhase 9 Super Admin SaaS Platform Verification completed successfully!")

if __name__ == "__main__":
    verify_superadmin()
