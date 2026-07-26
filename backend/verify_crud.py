import urllib.request
import json
import sys

def verify_crud():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}

    # 1. Log in
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
        print(f"Login failed during verification: {str(e)}")
        sys.exit(1)

    auth_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    # 2. Create customer
    customer_payload = json.dumps({
        "first_name": "TestVerifyCustomer",
        "last_name": "Unique",
        "phone": "+9999999999",
        "email": "testverify@smartgonext.com",
        "gender": "Female",
        "notes": "Testing programmatic API verification."
    }).encode("utf-8")

    customer_id = None
    try:
        req = urllib.request.Request(f"{base_url}/customers", data=customer_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            customer_id = resp["data"]["id"]
            print(f"Customer Created Successfully. ID: {customer_id}")
    except Exception as e:
        print(f"Failed to create customer: {str(e)}")
        sys.exit(1)

    # 3. Retrieve and search customer
    try:
        req = urllib.request.Request(f"{base_url}/customers?q=TestVerifyCustomer", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            items = resp["data"]["items"]
            assert len(items) > 0
            assert items[0]["id"] == customer_id
            print("Search and retrieve verification succeeded.")
    except Exception as e:
        print(f"Failed to retrieve and search: {str(e)}")
        sys.exit(1)

    # 4. Soft delete customer
    try:
        req = urllib.request.Request(f"{base_url}/customers/{customer_id}", headers=auth_headers, method="DELETE")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            print("Soft Delete verification succeeded.")
    except Exception as e:
        print(f"Failed to soft delete customer: {str(e)}")
        sys.exit(1)

    # 5. Confirm soft deleted customer is filtered out
    try:
        req = urllib.request.Request(f"{base_url}/customers?q=TestVerifyCustomer", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            items = resp["data"]["items"]
            # Assert customer is filtered out since is_deleted=True
            assert len(items) == 0 or all(x["id"] != customer_id for x in items)
            print("Verified that soft deleted records are correctly filtered from listings.")
    except Exception as e:
        print(f"Failed to confirm soft delete filter: {str(e)}")
        sys.exit(1)

    print("\nPhase 3 Backend CRUD Verification completed successfully!")

if __name__ == "__main__":
    verify_crud()
