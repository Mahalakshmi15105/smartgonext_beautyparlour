import urllib.request
import json
import sys

def verify_memberships():
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

    # 2. Get/Create Customer
    customer_id = None
    cust_payload = json.dumps({"first_name": "MemTestCust", "phone": "+6666666666"}).encode("utf-8")
    try:
        req = urllib.request.Request(f"{base_url}/customers", data=cust_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            customer_id = json.loads(res.read().decode())["data"]["id"]
    except Exception:
        req = urllib.request.Request(f"{base_url}/customers?q=MemTestCust", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            customer_id = json.loads(res.read().decode())["data"]["items"][0]["id"]
    print(f"Verified Customer ID: {customer_id}")

    # 3. Get Service ID
    service_id = None
    req = urllib.request.Request(f"{base_url}/services", headers=auth_headers, method="GET")
    with urllib.request.urlopen(req) as res:
        items = json.loads(res.read().decode())["data"]["items"]
        if len(items) > 0:
            service_id = items[0]["id"]
    print(f"Verified Service ID: {service_id}")

    # 4. Create Membership Plan
    plan_payload = json.dumps({
        "name": "Gold VIP Membership",
        "description": "2 free treatments and 15% discount",
        "price": 1999.00,
        "duration_days": 365,
        "service_discount_percentage": 15.00,
        "product_discount_percentage": 10.00
    }).encode("utf-8")

    plan_id = None
    try:
        req = urllib.request.Request(f"{base_url}/membership-plans", data=plan_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            plan_id = resp["data"]["id"]
            print(f"Plan Created. ID: {plan_id}, Name: Gold VIP Membership")
    except Exception:
        req = urllib.request.Request(f"{base_url}/membership-plans?q=Gold VIP", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            plan_id = json.loads(res.read().decode())["data"]["items"][0]["id"]

    # 5. Assign Membership to Customer
    assign_payload = json.dumps({
        "customer_id": customer_id,
        "plan_id": plan_id,
        "benefits": [
            {"service_id": service_id, "quantity": 2}
        ]
    }).encode("utf-8")

    cm_id = None
    try:
        req = urllib.request.Request(f"{base_url}/memberships/assign", data=assign_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            cm_id = resp["data"]["membership_id"]
            print(f"Membership Assigned Successfully. Link ID: {cm_id}")
    except Exception as e:
        print(f"Assign membership failed: {str(e)}")
        sys.exit(1)

    # 6. Verify Customer Memberships API
    try:
        req = urllib.request.Request(f"{base_url}/customers/{customer_id}/memberships", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert len(resp["data"]) > 0
            b_list = resp["data"][0]["benefits"]
            assert len(b_list) > 0
            assert b_list[0]["remaining_quantity"] == 2
            print("Verified active customer membership & remaining benefit balances.")
    except Exception as e:
        print(f"Verification of customer membership failed: {str(e)}")
        sys.exit(1)

    # 7. Test Membership Renewal
    try:
        req = urllib.request.Request(f"{base_url}/memberships/{cm_id}/renew", headers=auth_headers, data=b"", method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            print("Membership Renewal Successful.")
    except Exception as e:
        print(f"Renewal failed: {str(e)}")
        sys.exit(1)

    # 8. Test Membership Cancellation
    try:
        req = urllib.request.Request(f"{base_url}/memberships/{cm_id}/cancel", headers=auth_headers, data=b"", method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            print("Membership Cancellation Successful.")
    except Exception as e:
        print(f"Cancellation failed: {str(e)}")
        sys.exit(1)

    print("\nPhase 5 Membership Management Verification completed successfully!")

if __name__ == "__main__":
    verify_memberships()
