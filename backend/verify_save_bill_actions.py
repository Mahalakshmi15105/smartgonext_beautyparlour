import urllib.request
import json
import sys
import time

def test_billing_checkout_and_actions():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}
    ts = int(time.time())

    # 1. Register Parlour Tenant
    reg_payload = json.dumps({
        "parlour_name": f"SaveBill Test Salon {ts}",
        "owner_name": "Test Owner",
        "email": f"billowner_{ts}@parlour.com",
        "password": "Password123!",
        "phone": f"+9198{ts % 100000000:08d}"
    }).encode("utf-8")

    token = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/register", data=reg_payload, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token = resp["data"]["token"]
            print("1. Parlour Tenant Registered Successfully.")
    except Exception as e:
        print(f"Registration failed: {str(e)}")
        sys.exit(1)

    auth_headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

    # 2. Create Customer
    cust_payload = json.dumps({
        "first_name": "SaveBillClient",
        "last_name": "Test",
        "phone": f"91{ts % 100000000:08d}",
        "gender": "Female"
    }).encode("utf-8")

    cust_id = None
    try:
        req = urllib.request.Request(f"{base_url}/customers", data=cust_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            cust_id = resp["data"]["id"]
            print(f"2. Customer created with ID: {cust_id}")
    except Exception as e:
        print(f"Customer creation failed: {str(e)}")
        sys.exit(1)

    # 3. Create Employee
    emp_payload = json.dumps({
        "first_name": "Stylist",
        "last_name": "One",
        "phone": f"97{ts % 100000000:08d}",
        "role": "Stylist",
        "salary": 25000.00
    }).encode("utf-8")

    emp_id = None
    try:
        req = urllib.request.Request(f"{base_url}/employees", data=emp_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            emp_id = resp["data"]["id"]
            print(f"3. Created Employee ID: {emp_id}")
    except Exception as e:
        print(f"Employee creation failed: {str(e)}")
        sys.exit(1)

    # 4. Fetch Category & Create Service
    cat_id = None
    svc_id = None
    try:
        req = urllib.request.Request(f"{base_url}/service-categories", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            cat_id = resp["data"][0]["id"]

        svc_payload = json.dumps({
            "category_id": cat_id,
            "name": "Hair Cut & Styling Test",
            "price": 500.00,
            "duration_minutes": 45
        }).encode("utf-8")

        req = urllib.request.Request(f"{base_url}/services", data=svc_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            svc_id = resp["data"]["id"]
        print(f"4. Created Service ID: {svc_id} under Category ID: {cat_id}")
    except Exception as e:
        print(f"Service creation failed: {str(e)}")
        sys.exit(1)

    # 5. TEST SAVE BILL (CHECKOUT TRANSACTION)
    checkout_payload = json.dumps({
        "customer_id": cust_id,
        "line_items": [
            {
                "type": "service",
                "item_id": svc_id,
                "quantity": 2,
                "employee_ids": [emp_id],
                "employee_id": emp_id,
                "discount": 50.00
            }
        ],
        "payments": [
            {"method": "Cash", "amount": 500.00},
            {"method": "Google Pay", "amount": 450.00}
        ]
    }).encode("utf-8")

    inv_id = None
    try:
        req = urllib.request.Request(f"{base_url}/billing/checkout", data=checkout_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            inv_data = resp["data"]
            inv_id = inv_data["invoice_id"]
            print(f"SUCCESS: Bill Saved Successfully! Invoice #: {inv_data['invoice_number']}, Subtotal: {inv_data['subtotal']}, Tax: {inv_data['tax']}, Total: {inv_data['total']}")
    except Exception as e:
        print(f"SECURITY/TRANSACTION FAILURE: Save Bill failed: {str(e)}")
        sys.exit(1)

    # 6. TEST SMS BILL ACTION
    try:
        req = urllib.request.Request(f"{base_url}/invoices/{inv_id}/sms", headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print(f"SUCCESS: SMS Bill Action Verified! Content: '{resp['data']['sms_content']}'")
    except Exception as e:
        print(f"SMS Bill action failed: {str(e)}")
        sys.exit(1)

    # 7. TEST SET REMINDER ACTION
    rem_payload = json.dumps({
        "customer_id": cust_id,
        "invoice_id": inv_id,
        "reminder_type": "Follow-up appointment",
        "reminder_date": "2026-08-15",
        "notes": "Facial touch-up appointment"
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/reminders", data=rem_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print(f"SUCCESS: Set Reminder Action Verified! Reminder ID: {resp['data']['id']} saved on {resp['data']['reminder_date']}")
    except Exception as e:
        print(f"Set Reminder action failed: {str(e)}")
        sys.exit(1)

    # 8. TEST COLLECT FEEDBACK ACTION
    fb_payload = json.dumps({
        "customer_id": cust_id,
        "invoice_id": inv_id,
        "rating": 5,
        "comments": "Excellent treatment and professional stylists!"
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/feedback", data=fb_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print(f"SUCCESS: Collect Feedback Action Verified! Rating: {resp['data']['rating']} stars recorded in database.")
    except Exception as e:
        print(f"Collect Feedback action failed: {str(e)}")
        sys.exit(1)

    print("\nAll Save Bill Transaction and Bill Actions Verified 100%!")

if __name__ == "__main__":
    test_billing_checkout_and_actions()
