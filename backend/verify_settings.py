import urllib.request
import json
import sys

def verify_settings():
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

    # 2. Get initial settings
    try:
        req = urllib.request.Request(f"{base_url}/settings", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            print("Initial settings fetched successfully.")
    except Exception as e:
        print(f"Get settings failed: {str(e)}")
        sys.exit(1)

    # 3. Update settings
    update_payload = json.dumps({
        "business_profile": {
            "name": "SmartGoNext Luxury Parlour",
            "owner_name": "Test Owner",
            "phone": "+919876543210"
        },
        "invoice_settings": {
            "invoice_prefix": "SALON",
            "tax_name": "GST",
            "tax_rate": 18.00
        },
        "regional_settings": {
            "currency": "INR",
            "currency_symbol": "₹"
        }
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/settings", data=update_payload, headers=auth_headers, method="PUT")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            print("Settings update request succeeded.")
    except Exception as e:
        print(f"Update settings failed: {str(e)}")
        sys.exit(1)

    # 4. Verify updated settings persist
    try:
        req = urllib.request.Request(f"{base_url}/settings", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            data = resp["data"]
            assert data["business_profile"]["name"] == "SmartGoNext Luxury Parlour"
            assert data["business_profile"]["owner_name"] == "Test Owner"
            assert data["invoice_settings"]["invoice_prefix"] == "SALON"
            assert data["regional_settings"]["currency_symbol"] == "₹"
            print("Verified settings persistence in database successfully!")
    except Exception as e:
        print(f"Settings persistence verification failed: {str(e)}")
        sys.exit(1)

    print("\nPhase 8 Settings Module Verification completed successfully!")

if __name__ == "__main__":
    verify_settings()
