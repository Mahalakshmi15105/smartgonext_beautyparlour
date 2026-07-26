import urllib.request
import json
import sys

def run_verification():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}

    # 1. Verification Test: Parlour Admin Login
    login_data = json.dumps({
        "email": "admin@smartgonext.com",
        "password": "ParlourAdmin123!"
    }).encode("utf-8")
    
    print("--- 1. Testing Login API ---")
    req = urllib.request.Request(f"{base_url}/auth/login", data=login_data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            response = json.loads(res.read().decode())
            assert response["success"] is True
            token = response["data"]["token"]
            parlour_id = response["data"]["user"]["parlour_id"]
            role = response["data"]["user"]["role"]
            print(f"Login Success! Role: {role}, Tenant ID: {parlour_id}")
    except Exception as e:
        print(f"Login Failed: {str(e)}")
        sys.exit(1)

    # 2. Verification Test: Authenticated /auth/me Access
    print("\n--- 2. Testing Auth Profile Endpoint ---")
    auth_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    req_me = urllib.request.Request(f"{base_url}/auth/me", headers=auth_headers, method="GET")
    try:
        with urllib.request.urlopen(req_me) as res:
            response = json.loads(res.read().decode())
            assert response["success"] is True
            user_data = response["data"]
            print(f"Profile Retrieval Success! ID: {user_data['id']}, Email: {user_data['email']}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"Profile Access Failed with code {e.code}: {body}")
        sys.exit(1)
    except Exception as e:
        print(f"Profile Access Failed: {str(e)}")
        sys.exit(1)

    # 3. Verification Test: Invalid Token Access
    print("\n--- 3. Testing Token Isolation Protection ---")
    bad_headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer badtoken123"
    }
    req_bad = urllib.request.Request(f"{base_url}/auth/me", headers=bad_headers, method="GET")
    try:
        with urllib.request.urlopen(req_bad) as res:
            pass
    except urllib.error.HTTPError as e:
        response = json.loads(e.read().decode())
        print(f"Correctly Rejected Bad Token. Status Code: {e.code}, Error Code: {response['error_code']}")
        assert e.code == 401
    except Exception as e:
        print(f"Token Isolation Failed: {str(e)}")
        sys.exit(1)

    print("\nPhase 2 Backend Verification completed successfully!")

if __name__ == "__main__":
    run_verification()
