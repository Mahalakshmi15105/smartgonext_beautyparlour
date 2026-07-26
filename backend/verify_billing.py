import urllib.request
import json
import sys

def verify_billing():
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

    # Setup core dependencies (Customer, Stylist, Product, Service)
    # A. Get/Create Customer
    customer_id = None
    cust_payload = json.dumps({"first_name": "BillTestCust", "phone": "+8888888888"}).encode("utf-8")
    try:
        req = urllib.request.Request(f"{base_url}/customers", data=cust_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            customer_id = json.loads(res.read().decode())["data"]["id"]
    except Exception:
        # If customer already exists, fetch list
        req = urllib.request.Request(f"{base_url}/customers?q=BillTestCust", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            customer_id = json.loads(res.read().decode())["data"]["items"][0]["id"]
    print(f"Verified Customer ID: {customer_id}")

    # B. Get/Create Stylist (Employee)
    employee_id = None
    emp_payload = json.dumps({"first_name": "BillTestEmp", "phone": "+7777777777"}).encode("utf-8")
    try:
        req = urllib.request.Request(f"{base_url}/employees", data=emp_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            employee_id = json.loads(res.read().decode())["data"]["id"]
    except Exception:
        req = urllib.request.Request(f"{base_url}/employees?q=BillTestEmp", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            employee_id = json.loads(res.read().decode())["data"]["items"][0]["id"]
    print(f"Verified Employee ID: {employee_id}")

    # C. Get/Create Service Category
    cat_id = None
    cat_payload = json.dumps({"name": "TestSvcCat"}).encode("utf-8")
    try:
        req = urllib.request.Request(f"{base_url}/service-categories", data=cat_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            cat_id = json.loads(res.read().decode())["id"]
    except Exception:
        req = urllib.request.Request(f"{base_url}/service-categories", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            cat_id = json.loads(res.read().decode())["data"][0]["id"]

    # D. Get/Create Service
    service_id = None
    svc_payload = json.dumps({
        "name": "HaircutTest",
        "category_id": cat_id,
        "price": 500.00,
        "duration_minutes": 30
    }).encode("utf-8")
    try:
        req = urllib.request.Request(f"{base_url}/services", data=svc_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            service_id = json.loads(res.read().decode())["data"]["id"]
    except Exception:
        req = urllib.request.Request(f"{base_url}/services?q=HaircutTest", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            service_id = json.loads(res.read().decode())["data"]["items"][0]["id"]
    print(f"Verified Service ID: {service_id}")

    # E. Get/Create Product with stock=10
    product_id = None
    prod_payload = json.dumps({
        "name": "ShampooTest",
        "selling_price": 200.00,
        "cost_price": 100.00,
        "stock_quantity": 10,
        "low_stock_threshold": 2
    }).encode("utf-8")
    try:
        req = urllib.request.Request(f"{base_url}/products", data=prod_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            product_id = json.loads(res.read().decode())["data"]["id"]
    except Exception:
        req = urllib.request.Request(f"{base_url}/products?q=ShampooTest", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            product_id = json.loads(res.read().decode())["data"]["items"][0]["id"]
    print(f"Verified Product ID: {product_id}")

    # 2. Test Mixed Service & Product Checkout + Stock Deduction
    print("\n--- Testing Mixed Checkout ---")
    checkout_payload = json.dumps({
        "customer_id": customer_id,
        "line_items": [
            {"type": "service", "item_id": service_id, "quantity": 1, "employee_id": employee_id},
            {"type": "product", "item_id": product_id, "quantity": 2, "employee_id": employee_id}
        ],
        "payments": [
            {"method": "cash", "amount": 1062.00} # subtotal=900, tax=18% of 900 = 162, total=1062
        ]
    }).encode("utf-8")

    invoice_id = None
    try:
        req = urllib.request.Request(f"{base_url}/billing/checkout", data=checkout_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            invoice_id = resp["data"]["invoice_id"]
            print(f"Checkout Success! Invoice #: {resp['data']['invoice_number']}, Grand Total: {resp['data']['total']}")
    except Exception as e:
        print(f"Mixed checkout failed: {str(e)}")
        sys.exit(1)

    # Verify Stock level decremented from 10 to 8
    try:
        req = urllib.request.Request(f"{base_url}/products/{product_id}", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            prod_data = json.loads(res.read().decode())["data"]
            assert prod_data["stock_quantity"] == 8
            print(f"Verification Success: Product stock level decremented to {prod_data['stock_quantity']}.")
    except Exception as e:
        print(f"Stock verification check failed: {str(e)}")
        sys.exit(1)

    # 3. Test Transaction Rollback (Insufficient stock)
    print("\n--- Testing Transaction Rollback (Insufficient Stock) ---")
    bad_checkout_payload = json.dumps({
        "customer_id": customer_id,
        "line_items": [
            {"type": "product", "item_id": product_id, "quantity": 20, "employee_id": employee_id} # exceeds available=8
        ],
        "payments": [
            {"method": "cash", "amount": 4720.00}
        ]
    }).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/billing/checkout", data=bad_checkout_payload, headers=auth_headers, method="POST")
        with urllib.request.urlopen(req) as res:
            print("ERROR: Checkout should have failed due to stock bounds!")
            sys.exit(1)
    except urllib.error.HTTPError as e:
        resp = json.loads(e.read().decode())
        print(f"Expected failure caught: code {e.code}, error_code: {resp['error_code']}, message: {resp['message']}")
        assert resp["error_code"] == "TRANSACTION_FAILED"

    # Verify stock remained at 8 (transaction rolled back)
    try:
        req = urllib.request.Request(f"{base_url}/products/{product_id}", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            prod_data = json.loads(res.read().decode())["data"]
            assert prod_data["stock_quantity"] == 8
            print("Verification Success: Stock remained at 8 after rolled back transaction.")
    except Exception as e:
        print(f"Stock rollback verification failed: {str(e)}")
        sys.exit(1)

    # 4. Test Voiding Invoice & Stock Restoration
    print("\n--- Testing Voiding Invoice and Stock Restoration ---")
    try:
        req = urllib.request.Request(f"{base_url}/invoices/{invoice_id}/void", headers=auth_headers, data=b"", method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            assert resp["success"] is True
            print("Invoice Voided Successful.")
    except Exception as e:
        print(f"Voiding invoice failed: {str(e)}")
        sys.exit(1)

    # Verify Stock level is restored back to 10
    try:
        req = urllib.request.Request(f"{base_url}/products/{product_id}", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            prod_data = json.loads(res.read().decode())["data"]
            assert prod_data["stock_quantity"] == 10
            print(f"Verification Success: Stock restored back to {prod_data['stock_quantity']}.")
    except Exception as e:
        print(f"Stock restoration check failed: {str(e)}")
        sys.exit(1)

    print("\nPhase 4 Billing & Transactions Verification completed successfully!")

if __name__ == "__main__":
    verify_billing()
