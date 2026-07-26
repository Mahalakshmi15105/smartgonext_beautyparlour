import urllib.request
import json
import sys

def verify_reports():
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

    # 2. Test /reports/sales
    try:
        req = urllib.request.Request(f"{base_url}/reports/sales?preset=30days", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            assert "summary" in resp["data"]
            assert "items" in resp["data"]
            print(f"Sales Report Verified! Total Orders: {resp['data']['summary']['total_orders']}")
    except Exception as e:
        print(f"Sales report failed: {str(e)}")
        sys.exit(1)

    # 3. Test /reports/tax
    try:
        req = urllib.request.Request(f"{base_url}/reports/tax?preset=30days", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            assert "total_tax_collected" in resp["data"]
            print(f"Tax Report Verified! Total Tax Collected: INR {resp['data']['total_tax_collected']}")
    except Exception as e:
        print(f"Tax report failed: {str(e)}")
        sys.exit(1)

    # 4. Test /reports/employees
    try:
        req = urllib.request.Request(f"{base_url}/reports/employees?preset=30days", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            print("Employee Commissions Report Verified!")
    except Exception as e:
        print(f"Employee report failed: {str(e)}")
        sys.exit(1)

    # 5. Test /reports/export (CSV Download)
    try:
        req = urllib.request.Request(f"{base_url}/reports/export?type=sales&preset=30days", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            csv_content = res.read().decode()
            assert "Invoice Number" in csv_content
            assert "Customer Name" in csv_content
            print("CSV Export Streaming Verified Successfully!")
    except Exception as e:
        print(f"CSV export failed: {str(e)}")
        sys.exit(1)

    print("\nPhase 7 Reports Module Verification completed successfully!")

if __name__ == "__main__":
    verify_reports()
