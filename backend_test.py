#!/usr/bin/env python3
"""
Backend API Test Suite for AI Tenancy Manager
Tests all backend endpoints with real Supabase auth and OpenAI calls
"""

import requests
import json
import time
import random
import string
from datetime import datetime

# Configuration from .env
BASE_URL = "https://next-supa-stack.preview.emergentagent.com"
SUPABASE_URL = "https://bpqmnxbkgilinfgqehpo.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwcW1ueGJrZ2lsaW5mZ3FlaHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjgzODEsImV4cCI6MjA5NDQ0NDM4MX0.L0OemMdLdHQ-R9L_NCu8jrUbCoktJAYU2i3Mwn4SQEM"

# Test data storage
test_data = {
    "landlord_email": None,
    "landlord_password": "Test1234!",
    "landlord_token": None,
    "tenant_email": None,
    "tenant_password": "Test1234!",
    "tenant_token": None,
    "property_id": None,
    "tenancy_id": None,
    "inventory_id": None,
    "contract_id": None,
    "inspection_id": None,
    "issue_id": None,
}

def random_suffix():
    """Generate random suffix for unique emails"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

def log_test(test_num, description):
    """Log test start"""
    print(f"\n{'='*80}")
    print(f"TEST {test_num}: {description}")
    print(f"{'='*80}")

def log_success(message):
    """Log success"""
    print(f"✅ SUCCESS: {message}")

def log_error(message):
    """Log error"""
    print(f"❌ ERROR: {message}")

def log_info(message):
    """Log info"""
    print(f"ℹ️  INFO: {message}")

def get_supabase_token(email, password):
    """Get access token from Supabase auth"""
    try:
        url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        data = {"email": email, "password": password}
        
        log_info(f"Getting token for {email}...")
        response = requests.post(url, headers=headers, json=data, timeout=10)
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            log_success(f"Got access token: {token[:20]}...")
            return token
        else:
            log_error(f"Failed to get token: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        log_error(f"Exception getting token: {str(e)}")
        return None

def test_1_health_check():
    """Test 1: GET /api -> health check"""
    log_test(1, "Health Check - GET /api")
    
    try:
        response = requests.get(f"{BASE_URL}/api", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "AI Tenancy Manager API ready" in data["message"]:
                log_success(f"Health check passed: {data}")
                return True
            else:
                log_error(f"Unexpected response: {data}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_2_signup_landlord():
    """Test 2: POST /api/auth/signup (landlord)"""
    log_test(2, "Signup Landlord - POST /api/auth/signup")
    
    try:
        suffix = random_suffix()
        email = f"landlord+{suffix}@example.com"
        test_data["landlord_email"] = email
        
        data = {
            "email": email,
            "password": test_data["landlord_password"],
            "name": "Test Landlord",
            "role": "landlord"
        }
        
        log_info(f"Signing up landlord: {email}")
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if "user" in result:
                log_success(f"Landlord signed up: {result['user'].get('email')}")
                
                # Get access token
                time.sleep(2)  # Wait for user to be fully created
                token = get_supabase_token(email, test_data["landlord_password"])
                if token:
                    test_data["landlord_token"] = token
                    return True
                else:
                    log_error("Failed to get access token after signup")
                    return False
            else:
                log_error(f"No user in response: {result}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_3_get_me():
    """Test 3: GET /api/me with Bearer token"""
    log_test(3, "Get Current User - GET /api/me")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['landlord_token']}"}
        response = requests.get(f"{BASE_URL}/api/me", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "profile" in data and data["profile"].get("role") == "landlord":
                log_success(f"Got user profile: {data['user'].get('email')}, role: {data['profile'].get('role')}")
                return True
            else:
                log_error(f"Profile role mismatch: {data}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_4_get_properties_empty():
    """Test 4: GET /api/properties (should be empty)"""
    log_test(4, "Get Properties (Empty) - GET /api/properties")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['landlord_token']}"}
        response = requests.get(f"{BASE_URL}/api/properties", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "properties" in data and isinstance(data["properties"], list):
                log_success(f"Got properties list: {len(data['properties'])} properties")
                return True
            else:
                log_error(f"Unexpected response: {data}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_5_create_property():
    """Test 5: POST /api/properties"""
    log_test(5, "Create Property - POST /api/properties")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['landlord_token']}"}
        data = {
            "address_line1": "10 Test Street",
            "city": "London",
            "postcode": "E1 6AN"
        }
        
        response = requests.post(f"{BASE_URL}/api/properties", headers=headers, json=data, timeout=10)
        
        if response.status_code == 201:
            result = response.json()
            if "property" in result and "id" in result["property"]:
                test_data["property_id"] = result["property"]["id"]
                log_success(f"Property created: {result['property']['id']} - {result['property']['address_line1']}")
                return True
            else:
                log_error(f"No property ID in response: {result}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_6_get_properties_with_data():
    """Test 6: GET /api/properties (should have 1 property)"""
    log_test(6, "Get Properties (With Data) - GET /api/properties")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['landlord_token']}"}
        response = requests.get(f"{BASE_URL}/api/properties", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "properties" in data and len(data["properties"]) >= 1:
                log_success(f"Got {len(data['properties'])} properties")
                return True
            else:
                log_error(f"Expected at least 1 property, got: {data}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_7_get_property_by_id():
    """Test 7: GET /api/properties/<id>"""
    log_test(7, f"Get Property By ID - GET /api/properties/{test_data['property_id']}")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['landlord_token']}"}
        response = requests.get(f"{BASE_URL}/api/properties/{test_data['property_id']}", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            required_keys = ["property", "tenancies", "inventories", "inspections", "issues", "contracts", "compliance"]
            if all(key in data for key in required_keys):
                log_success(f"Got property with all related data: {data['property']['address_line1']}")
                return True
            else:
                log_error(f"Missing keys in response: {data.keys()}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_8_signup_tenant():
    """Test 8: POST /api/auth/signup (tenant)"""
    log_test(8, "Signup Tenant - POST /api/auth/signup")
    
    try:
        suffix = random_suffix()
        email = f"tenant+{suffix}@example.com"
        test_data["tenant_email"] = email
        
        data = {
            "email": email,
            "password": test_data["tenant_password"],
            "name": "Test Tenant",
            "role": "tenant"
        }
        
        log_info(f"Signing up tenant: {email}")
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if "user" in result:
                log_success(f"Tenant signed up: {result['user'].get('email')}")
                
                # Get access token
                time.sleep(2)  # Wait for user to be fully created
                token = get_supabase_token(email, test_data["tenant_password"])
                if token:
                    test_data["tenant_token"] = token
                    return True
                else:
                    log_error("Failed to get access token after signup")
                    return False
            else:
                log_error(f"No user in response: {result}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_9_create_tenancy():
    """Test 9: POST /api/tenancies"""
    log_test(9, "Create Tenancy - POST /api/tenancies")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['landlord_token']}"}
        data = {
            "property_id": test_data["property_id"],
            "tenant_email": test_data["tenant_email"],
            "start_date": "2025-01-01",
            "rent_amount": 1500,
            "rent_frequency": "monthly",
            "deposit_amount": 1500
        }
        
        response = requests.post(f"{BASE_URL}/api/tenancies", headers=headers, json=data, timeout=10)
        
        if response.status_code == 201:
            result = response.json()
            if "tenancy" in result and "id" in result["tenancy"]:
                test_data["tenancy_id"] = result["tenancy"]["id"]
                log_success(f"Tenancy created: {result['tenancy']['id']}")
                return True
            else:
                log_error(f"No tenancy ID in response: {result}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_10_ai_inventory():
    """Test 10: POST /api/inventories/generate (AI - real OpenAI call)"""
    log_test(10, "AI Inventory Generator - POST /api/inventories/generate")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['landlord_token']}"}
        data = {
            "property_id": test_data["property_id"],
            "photo_urls": ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"]
        }
        
        log_info("Calling OpenAI GPT-4o Vision API (may take 15-45 seconds)...")
        response = requests.post(f"{BASE_URL}/api/inventories/generate", headers=headers, json=data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            if "inventory" in result and "ai_inventory_json" in result["inventory"]:
                ai_data = result["inventory"]["ai_inventory_json"]
                if "rooms" in ai_data and isinstance(ai_data["rooms"], list) and len(ai_data["rooms"]) > 0:
                    test_data["inventory_id"] = result["inventory"]["id"]
                    log_success(f"AI Inventory generated with {len(ai_data['rooms'])} rooms")
                    log_info(f"Sample room: {ai_data['rooms'][0].get('name', 'N/A')}")
                    return True
                else:
                    log_error(f"AI inventory has no rooms: {ai_data}")
                    return False
            else:
                log_error(f"No AI inventory in response: {result}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_11_ai_contract():
    """Test 11: POST /api/contracts/parse (AI - real OpenAI call)"""
    log_test(11, "AI Contract Parser - POST /api/contracts/parse")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['landlord_token']}"}
        data = {
            "tenancy_id": test_data["tenancy_id"],
            "raw_text": """This Assured Shorthold Tenancy Agreement is made between Landlord A and Tenant B for the property at 10 Test Street. 
Rent is £1500 per month payable on the 1st. Deposit £1500 protected with TDS. 
Term: 12 months starting 1 January 2025. Tenant must give 2 months notice. 
Landlord must give 2 months notice under section 21."""
        }
        
        log_info("Calling OpenAI GPT-4o API (may take 15-45 seconds)...")
        response = requests.post(f"{BASE_URL}/api/contracts/parse", headers=headers, json=data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            if "contract" in result and "ai_summary_json" in result["contract"]:
                ai_data = result["contract"]["ai_summary_json"]
                required_fields = ["tenant_rights", "tenant_obligations", "plain_english_summary"]
                if all(field in ai_data for field in required_fields):
                    test_data["contract_id"] = result["contract"]["id"]
                    log_success(f"AI Contract parsed successfully")
                    log_info(f"Tenant rights: {len(ai_data.get('tenant_rights', []))} items")
                    return True
                else:
                    log_error(f"Missing required fields in AI summary: {ai_data.keys()}")
                    return False
            else:
                log_error(f"No AI summary in response: {result}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_12_ai_damage():
    """Test 12: POST /api/inspections/compare (AI - real OpenAI call)"""
    log_test(12, "AI Damage Detector - POST /api/inspections/compare")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['landlord_token']}"}
        data = {
            "property_id": test_data["property_id"],
            "before_urls": ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"],
            "after_urls": ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800"]
        }
        
        log_info("Calling OpenAI GPT-4o Vision API (may take 15-45 seconds)...")
        response = requests.post(f"{BASE_URL}/api/inspections/compare", headers=headers, json=data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            if "inspection" in result and "ai_report_json" in result["inspection"]:
                ai_data = result["inspection"]["ai_report_json"]
                if "damages" in ai_data and "overall_assessment" in ai_data:
                    test_data["inspection_id"] = result["inspection"]["id"]
                    log_success(f"AI Damage report generated")
                    log_info(f"Damages found: {len(ai_data.get('damages', []))}")
                    log_info(f"Assessment: {ai_data.get('overall_assessment', 'N/A')[:100]}")
                    return True
                else:
                    log_error(f"Missing damages or assessment in AI report: {ai_data.keys()}")
                    return False
            else:
                log_error(f"No AI report in response: {result}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_13_create_issue():
    """Test 13: POST /api/issues (with AI draft)"""
    log_test(13, "Create Issue with AI Draft - POST /api/issues")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['landlord_token']}"}
        data = {
            "property_id": test_data["property_id"],
            "title": "Leaking tap in kitchen",
            "description": "The kitchen sink hot tap has been leaking for 3 days, water pooling on counter."
        }
        
        log_info("Creating issue with AI draft (may take 10-30 seconds)...")
        response = requests.post(f"{BASE_URL}/api/issues", headers=headers, json=data, timeout=45)
        
        if response.status_code == 201:
            result = response.json()
            if "issue" in result and "id" in result["issue"]:
                test_data["issue_id"] = result["issue"]["id"]
                if "ai_draft" in result and "subject" in result["ai_draft"] and "body" in result["ai_draft"]:
                    log_success(f"Issue created with AI draft: {result['issue']['id']}")
                    log_info(f"AI Subject: {result['ai_draft']['subject']}")
                    return True
                else:
                    log_error(f"No AI draft in response: {result}")
                    return False
            else:
                log_error(f"No issue ID in response: {result}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_14_update_issue():
    """Test 14: PATCH /api/issues/<id>"""
    log_test(14, f"Update Issue Status - PATCH /api/issues/{test_data['issue_id']}")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['landlord_token']}"}
        data = {"status": "in_progress"}
        
        response = requests.patch(f"{BASE_URL}/api/issues/{test_data['issue_id']}", headers=headers, json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if "issue" in result and result["issue"].get("status") == "in_progress":
                log_success(f"Issue status updated to: {result['issue']['status']}")
                return True
            else:
                log_error(f"Status not updated: {result}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_15_tenant_get_properties():
    """Test 15: GET /api/properties as tenant (should see linked property)"""
    log_test(15, "Tenant Get Properties - GET /api/properties")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['tenant_token']}"}
        response = requests.get(f"{BASE_URL}/api/properties", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "properties" in data and len(data["properties"]) >= 1:
                # Check if the property is the one we created
                found = any(p["id"] == test_data["property_id"] for p in data["properties"])
                if found:
                    log_success(f"Tenant can see linked property: {data['properties'][0]['address_line1']}")
                    return True
                else:
                    log_error(f"Tenant cannot see the linked property")
                    return False
            else:
                log_error(f"Tenant has no properties: {data}")
                return False
        else:
            log_error(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def test_16_tenant_forbidden():
    """Test 16: POST /api/properties as tenant (should fail with 403)"""
    log_test(16, "Tenant Create Property (Forbidden) - POST /api/properties")
    
    try:
        headers = {"Authorization": f"Bearer {test_data['tenant_token']}"}
        data = {
            "address_line1": "20 Forbidden Street",
            "city": "London",
            "postcode": "E2 7BN"
        }
        
        response = requests.post(f"{BASE_URL}/api/properties", headers=headers, json=data, timeout=10)
        
        if response.status_code == 403:
            result = response.json()
            if "error" in result and "Only landlords can create properties" in result["error"]:
                log_success(f"Tenant correctly forbidden from creating property: {result['error']}")
                return True
            else:
                log_error(f"Wrong error message: {result}")
                return False
        else:
            log_error(f"Expected 403, got {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_error(f"Exception: {str(e)}")
        return False

def run_all_tests():
    """Run all tests in sequence"""
    print("\n" + "="*80)
    print("AI TENANCY MANAGER - BACKEND API TEST SUITE")
    print(f"Base URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("="*80)
    
    tests = [
        test_1_health_check,
        test_2_signup_landlord,
        test_3_get_me,
        test_4_get_properties_empty,
        test_5_create_property,
        test_6_get_properties_with_data,
        test_7_get_property_by_id,
        test_8_signup_tenant,
        test_9_create_tenancy,
        test_10_ai_inventory,
        test_11_ai_contract,
        test_12_ai_damage,
        test_13_create_issue,
        test_14_update_issue,
        test_15_tenant_get_properties,
        test_16_tenant_forbidden,
    ]
    
    results = []
    for test_func in tests:
        try:
            result = test_func()
            results.append((test_func.__name__, result))
        except Exception as e:
            log_error(f"Test {test_func.__name__} crashed: {str(e)}")
            results.append((test_func.__name__, False))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed ({passed*100//total}%)")
    print(f"{'='*80}\n")
    
    return results

if __name__ == "__main__":
    run_all_tests()
