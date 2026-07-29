import urllib.request
import json
import sys
import time

def test_currency_language_isolation():
    base_url = "http://localhost:5000/api/v1"
    headers = {"Content-Type": "application/json"}
    ts = int(time.time())

    # 1. Register Salon A
    reg_payload_a = json.dumps({
        "parlour_name": f"Currency Salon A {ts}",
        "owner_name": "Salon A Owner",
        "email": f"currency_a_{ts}@salon.com",
        "password": "Password123!",
        "phone": f"+9191{ts % 100000000:08d}"
    }).encode("utf-8")

    token_a = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/register", data=reg_payload_a, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token_a = resp["data"]["token"]
            print("1. Salon A Registered Successfully.")
    except Exception as e:
        print(f"Salon A Registration failed: {str(e)}")
        sys.exit(1)

    auth_headers_a = {"Content-Type": "application/json", "Authorization": f"Bearer {token_a}"}

    # 2. Update Currency & Language for Salon A to USD & Tamil
    curr_payload_a = json.dumps({"currency_code": "USD", "currency_symbol": "$"}).encode("utf-8")
    lang_payload_a = json.dumps({"language": "Tamil"}).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/settings/currency", data=curr_payload_a, headers=auth_headers_a, method="PUT")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print(f"2. Updated Salon A Currency -> {resp['data']['currency_code']} ({resp['data']['currency_symbol']}) - Example: {resp['data']['example']}")

        req = urllib.request.Request(f"{base_url}/settings/language", data=lang_payload_a, headers=auth_headers_a, method="PUT")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print(f"3. Updated Salon A Language -> {resp['data']['language']}")
    except Exception as e:
        print(f"Salon A Currency/Language update failed: {str(e)}")
        sys.exit(1)

    # 3. Register Salon B
    reg_payload_b = json.dumps({
        "parlour_name": f"Currency Salon B {ts}",
        "owner_name": "Salon B Owner",
        "email": f"currency_b_{ts}@salon.com",
        "password": "Password123!",
        "phone": f"+9192{ts % 100000000:08d}"
    }).encode("utf-8")

    token_b = None
    try:
        req = urllib.request.Request(f"{base_url}/auth/register", data=reg_payload_b, headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            token_b = resp["data"]["token"]
            print("4. Salon B Registered Successfully.")
    except Exception as e:
        print(f"Salon B Registration failed: {str(e)}")
        sys.exit(1)

    auth_headers_b = {"Content-Type": "application/json", "Authorization": f"Bearer {token_b}"}

    # 4. Update Currency & Language for Salon B to AED & Arabic
    curr_payload_b = json.dumps({"currency_code": "AED", "currency_symbol": "AED "}).encode("utf-8")
    lang_payload_b = json.dumps({"language": "Arabic"}).encode("utf-8")

    try:
        req = urllib.request.Request(f"{base_url}/settings/currency", data=curr_payload_b, headers=auth_headers_b, method="PUT")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print(f"5. Updated Salon B Currency -> {resp['data']['currency_code']} ({resp['data']['currency_symbol']}) - Example: {resp['data']['example']}")

        req = urllib.request.Request(f"{base_url}/settings/language", data=lang_payload_b, headers=auth_headers_b, method="PUT")
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print(f"6. Updated Salon B Language -> {resp['data']['language']}")
    except Exception as e:
        print(f"Salon B Currency/Language update failed: {str(e)}")
        sys.exit(1)

    # 5. Verify Isolation: Fetch Settings for Salon A and Salon B
    try:
        req_a = urllib.request.Request(f"{base_url}/settings/currency", headers=auth_headers_a, method="GET")
        with urllib.request.urlopen(req_a) as res:
            res_a = json.loads(res.read().decode())["data"]
            if res_a["currency_code"] != "USD" or res_a["currency_symbol"] != "$":
                print(f"FAILURE: Salon A currency corrupted: {res_a}")
                sys.exit(1)

        req_a_lang = urllib.request.Request(f"{base_url}/settings/language", headers=auth_headers_a, method="GET")
        with urllib.request.urlopen(req_a_lang) as res:
            res_a_lang = json.loads(res.read().decode())["data"]
            if res_a_lang["language"] != "Tamil":
                print(f"FAILURE: Salon A language corrupted: {res_a_lang}")
                sys.exit(1)

        req_b = urllib.request.Request(f"{base_url}/settings/currency", headers=auth_headers_b, method="GET")
        with urllib.request.urlopen(req_b) as res:
            res_b = json.loads(res.read().decode())["data"]
            if res_b["currency_code"] != "AED" or res_b["currency_symbol"] != "AED ":
                print(f"FAILURE: Salon B currency corrupted: {res_b}")
                sys.exit(1)

        req_b_lang = urllib.request.Request(f"{base_url}/settings/language", headers=auth_headers_b, method="GET")
        with urllib.request.urlopen(req_b_lang) as res:
            res_b_lang = json.loads(res.read().decode())["data"]
            if res_b_lang["language"] != "Arabic":
                print(f"FAILURE: Salon B language corrupted: {res_b_lang}")
                sys.exit(1)

        print("\n7. Verified Multi-Tenant Isolation: Salon A (USD / Tamil) and Salon B (AED / Arabic) are 100% Independent and Isolated!")
    except Exception as e:
        print(f"Isolation check failed: {str(e)}")
        sys.exit(1)

    print("\nALL GLOBAL CURRENCY & LANGUAGE VERIFICATIONS PASSED 100%!")

if __name__ == "__main__":
    test_currency_language_isolation()
