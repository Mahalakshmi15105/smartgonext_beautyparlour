import urllib.request
import json
import sys

def verify_all_pages():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}

    # 1. Login Salon Owner
    login_payload = json.dumps({
        "email": "admin@smartgonext.com",
        "password": "ParlourAdmin123!"
    }).encode("utf-8")

    token = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/login", data=login_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token = resp["data"]["token"]
            print("1. Login Endpoint Verified 100%.")
    except Exception as e:
        print(f"Login failed: {str(e)}")
        sys.exit(1)

    auth_headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

    endpoints = [
        ("/auth/me", "User Profile"),
        ("/dashboard/summary", "Dashboard Summary"),
        ("/dashboard/charts", "Dashboard Charts"),
        ("/services?limit=50", "Services Catalog"),
        ("/products?limit=50", "Products Inventory"),
        ("/service-categories", "Service Categories"),
        ("/membership-plans?limit=50", "Membership Plans"),
        ("/customers?limit=50", "Customer Management"),
        ("/employees?limit=50", "Employee Management"),
        ("/settings", "Regional & Business Settings"),
        ("/reports/sales?preset=30days", "Reports Module"),
    ]

    for ep, name in endpoints:
        try:
            req = urllib.request.Request(f"{base_url}{ep}", headers=auth_headers, method="GET")
            with urllib.request.urlopen(req) as res:
                resp = json.loads(res.read().decode())
                print(f"[OK] {name} Endpoint ({ep}) -> SUCCESS")
        except Exception as e:
            print(f"[FAIL] {name} Endpoint ({ep}) FAILED: {str(e)}")
            sys.exit(1)

    # Super Admin Login & Portal Verification
    super_payload = json.dumps({
        "email": "superadmin@smartgonext.com",
        "password": "SuperAdmin123!"
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/auth/login", data=super_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            super_token = resp["data"]["token"]
            print("[OK] Super Admin Login -> SUCCESS")

        super_headers = {"Content-Type": "application/json", "Authorization": f"Bearer {super_token}"}
        req = urllib.request.Request(f"{base_url}/super-admin/dashboard", headers=super_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print("[OK] Super Admin Console Endpoint -> SUCCESS")
    except Exception as e:
        print(f"Super Admin test failed: {str(e)}")
        sys.exit(1)

    print("\nALL MODULE ENDPOINTS AND COMPONENT APIS PASSED 100%!")

if __name__ == "__main__":
    verify_all_pages()
