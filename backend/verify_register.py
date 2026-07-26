import urllib.request
import json
import sys

def verify_register():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}

    # 1. Register new parlour
    reg_payload = json.dumps({
        "parlour_name": "Landing Page Test Parlour",
        "owner_name": "Public Visitor",
        "email": "landingregister@smartgonext.com",
        "password": "RegisterPass123!",
        "phone": "+919998887776",
        "plan_id": 1
    }).encode("utf-8")

    token = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/register", data=reg_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            token = resp["data"]["token"]
            print("Public Parlour Registration Successful!")
    except Exception as e:
        print(f"Public registration failed: {str(e)}")
        sys.exit(1)

    # 2. Verify identity with token
    auth_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    try:
        req = urllib.request.Request(f"{base_url}/auth/me", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            assert resp["data"]["role"] == "ParlourAdmin"
            print(f"Verified identity! User Role: {resp['data']['role']}, Parlour ID: {resp['data']['parlour_id']}")
    except Exception as e:
        print(f"Identity verification failed: {str(e)}")
        sys.exit(1)

    print("\nPublic Registration Flow Verification completed successfully!")

if __name__ == "__main__":
    verify_register()
