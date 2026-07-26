import urllib.request
import json
import sys

def verify_dashboard():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}

    # 1. Login
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
            print("Login Successful.")
    except Exception as e:
        print(f"Login failed: {str(e)}")
        sys.exit(1)

    auth_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    # 2. Test /dashboard/summary
    try:
        req = urllib.request.Request(f"{base_url}/dashboard/summary", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            data = resp["data"]
            assert "revenue" in data
            assert "invoices" in data
            assert "customers" in data
            assert "memberships" in data
            assert "low_stock_alerts" in data
            print(f"Summary Verification Succeeded! Total Revenue: INR {data['revenue']['total']}, Active Memberships: {data['memberships']['active']}")
    except Exception as e:
        print(f"Summary test failed: {str(e)}")
        sys.exit(1)

    # 3. Test /dashboard/charts
    try:
        req = urllib.request.Request(f"{base_url}/dashboard/charts?range=7", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            data = resp["data"]
            assert "daily_trend" in data
            assert "top_services" in data
            assert "employee_performance" in data
            assert "payment_distribution" in data
            print("Charts Analytics Verification Succeeded!")
    except Exception as e:
        print(f"Charts test failed: {str(e)}")
        sys.exit(1)

    # 4. Test /dashboard/activities
    try:
        req = urllib.request.Request(f"{base_url}/dashboard/activities", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            data = resp["data"]
            assert "recent_invoices" in data
            assert "recent_customers" in data
            print(f"Activities Feed Verification Succeeded! Recent Invoices Count: {len(data['recent_invoices'])}")
    except Exception as e:
        print(f"Activities test failed: {str(e)}")
        sys.exit(1)

    print("\nPhase 6 Dashboard & Analytics Verification completed successfully!")

if __name__ == "__main__":
    verify_dashboard()
