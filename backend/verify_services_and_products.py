import urllib.request
import json
import sys

def test_services_and_products_endpoints():
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
            print("1. Salon Owner Login Successful.")
    except Exception as e:
        print(f"Login failed: {str(e)}")
        sys.exit(1)

    auth_headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

    # 2. Test GET /service-categories
    try:
        req = urllib.request.Request(f"{base_url}/service-categories", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            cats = resp["data"]
            print(f"2. GET /service-categories -> Retrieved {len(cats)} categories safely.")
    except Exception as e:
        print(f"GET /service-categories failed: {str(e)}")
        sys.exit(1)

    # 3. Test GET /services?limit=100
    try:
        req = urllib.request.Request(f"{base_url}/services?limit=100", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            services = resp["data"]["items"]
            print(f"3. GET /services?limit=100 -> Retrieved {len(services)} services safely.")
    except Exception as e:
        print(f"GET /services failed: {str(e)}")
        sys.exit(1)

    # 4. Test GET /products?limit=100
    try:
        req = urllib.request.Request(f"{base_url}/products?limit=100", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            products = resp["data"]["items"]
            print(f"4. GET /products?limit=100 -> Retrieved {len(products)} products safely.")
    except Exception as e:
        print(f"GET /products failed: {str(e)}")
        sys.exit(1)

    # 5. Test Empty Search Result Handling
    try:
        req = urllib.request.Request(f"{base_url}/services?q=non_existent_search_query_9999", headers=auth_headers, method="GET")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            items = resp["data"]["items"]
            print(f"5. Empty Search Response Test -> Retrieved {len(items)} items safely without errors.")
    except Exception as e:
        print(f"Empty search test failed: {str(e)}")
        sys.exit(1)

    print("\nALL SERVICES & PRODUCTS MODULE VERIFICATIONS PASSED 100%!")

if __name__ == "__main__":
    test_services_and_products_endpoints()
