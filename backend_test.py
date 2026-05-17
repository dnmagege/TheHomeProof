#!/usr/bin/env python3
"""
Backend API Test Suite for AI Tenancy Manager - Phase 3
Tests: Compliance CRUD, Issues GET, AI Rent Estimator, AI Co-Pilot Chat, SendGrid guard
"""

import requests
import json
import time
import random
import string
from datetime import datetime

# Configuration
BASE_URL = "https://next-supa-stack.preview.emergentagent.com/api"
SUPABASE_URL = "https://bpqmnxbkgilinfgqehpo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwcW1ueGJrZ2lsaW5mZ3FlaHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjgzODEsImV4cCI6MjA5NDQ0NDM4MX0.L0OemMdLdHQ-R9L_NCu8jrUbCoktJAYU2i3Mwn4SQEM"

def generate_random_email():
    """Generate random email for testing"""
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"land+{rand}@test.com"

def get_auth_token(email, password):
    """Get Supabase auth token via password grant"""
    try:
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={
                "apikey": ANON_KEY,
                "Content-Type": "application/json"
            },
            json={
                "email": email,
                "password": password
            },
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"❌ Auth token retrieval failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception getting auth token: {e}")
        return None

def test_signup_landlord():
    """Test Case 1: Signup a fresh landlord"""
    print("\n" + "="*80)
    print("TEST 1: Signup Fresh Landlord")
    print("="*80)
    
    email = generate_random_email()
    password = "Test1234!"
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/signup",
            json={
                "email": email,
                "password": password,
                "name": "Land",
                "role": "landlord"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if "user" in data:
                print(f"✅ PASSED: Landlord signup successful")
                print(f"   Email: {email}")
                return email, password
            else:
                print(f"❌ FAILED: No user in response")
                return None, None
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return None, None

def test_create_property(token):
    """Test Case 2: Create a property"""
    print("\n" + "="*80)
    print("TEST 2: Create Property")
    print("="*80)
    
    try:
        response = requests.post(
            f"{BASE_URL}/properties",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "address_line1": "15 Test Lane",
                "city": "Manchester",
                "postcode": "M1 4BT"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 201:
            data = response.json()
            if "property" in data and "id" in data["property"]:
                property_id = data["property"]["id"]
                print(f"✅ PASSED: Property created successfully")
                print(f"   Property ID: {property_id}")
                return property_id
            else:
                print(f"❌ FAILED: No property ID in response")
                return None
        else:
            print(f"❌ FAILED: Expected 201, got {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return None

def test_compliance_get_empty(token):
    """Test Case 3: GET /api/compliance - should return empty array"""
    print("\n" + "="*80)
    print("TEST 3: GET Compliance (Empty)")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BASE_URL}/compliance",
            headers={
                "Authorization": f"Bearer {token}"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if "compliance" in data and isinstance(data["compliance"], list) and len(data["compliance"]) == 0:
                print(f"✅ PASSED: Compliance list is empty as expected")
                return True
            else:
                print(f"❌ FAILED: Expected empty compliance array, got: {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def test_compliance_post(token, property_id):
    """Test Case 4: POST /api/compliance - create compliance item"""
    print("\n" + "="*80)
    print("TEST 4: POST Compliance")
    print("="*80)
    
    try:
        response = requests.post(
            f"{BASE_URL}/compliance",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "property_id": property_id,
                "type": "Gas Safety Certificate",
                "expiry_date": "2026-06-01"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 201:
            data = response.json()
            if "compliance" in data and "id" in data["compliance"]:
                compliance_id = data["compliance"]["id"]
                print(f"✅ PASSED: Compliance item created successfully")
                print(f"   Compliance ID: {compliance_id}")
                return compliance_id
            else:
                print(f"❌ FAILED: No compliance ID in response")
                return None
        else:
            print(f"❌ FAILED: Expected 201, got {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return None

def test_compliance_get_with_data(token):
    """Test Case 5: GET /api/compliance - should return array with 1 item and properties joined"""
    print("\n" + "="*80)
    print("TEST 5: GET Compliance (With Data)")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BASE_URL}/compliance",
            headers={
                "Authorization": f"Bearer {token}"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if "compliance" in data and isinstance(data["compliance"], list) and len(data["compliance"]) == 1:
                item = data["compliance"][0]
                if "properties" in item:
                    print(f"✅ PASSED: Compliance list has 1 item with properties joined")
                    print(f"   Type: {item.get('type')}")
                    print(f"   Property: {item.get('properties', {})}")
                    return True
                else:
                    print(f"❌ FAILED: No properties join in compliance item")
                    return False
            else:
                print(f"❌ FAILED: Expected 1 compliance item, got: {len(data.get('compliance', []))}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def test_compliance_delete(token, compliance_id):
    """Test Case 6: DELETE /api/compliance/:id"""
    print("\n" + "="*80)
    print("TEST 6: DELETE Compliance")
    print("="*80)
    
    try:
        response = requests.delete(
            f"{BASE_URL}/compliance/{compliance_id}",
            headers={
                "Authorization": f"Bearer {token}"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True:
                print(f"✅ PASSED: Compliance item deleted successfully")
                return True
            else:
                print(f"❌ FAILED: Expected {ok: true}, got: {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def test_compliance_get_empty_after_delete(token):
    """Test Case 7: GET /api/compliance - should return empty array after delete"""
    print("\n" + "="*80)
    print("TEST 7: GET Compliance (Empty After Delete)")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BASE_URL}/compliance",
            headers={
                "Authorization": f"Bearer {token}"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if "compliance" in data and isinstance(data["compliance"], list) and len(data["compliance"]) == 0:
                print(f"✅ PASSED: Compliance list is empty after delete")
                return True
            else:
                print(f"❌ FAILED: Expected empty compliance array, got: {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def test_issues_get_empty(token):
    """Test Case 8: GET /api/issues - should return empty array"""
    print("\n" + "="*80)
    print("TEST 8: GET Issues (Empty)")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BASE_URL}/issues",
            headers={
                "Authorization": f"Bearer {token}"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 200:
            data = response.json()
            if "issues" in data and isinstance(data["issues"], list) and len(data["issues"]) == 0:
                print(f"✅ PASSED: Issues list is empty as expected")
                return True
            else:
                print(f"❌ FAILED: Expected empty issues array, got: {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def test_issues_post(token, property_id):
    """Test Case 9: POST /api/issues - create issue with AI draft"""
    print("\n" + "="*80)
    print("TEST 9: POST Issue (with AI Draft)")
    print("="*80)
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/issues",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "property_id": property_id,
                "title": "Heating not working",
                "description": "Radiators cold for 2 days"
            },
            timeout=60  # AI call may take time
        )
        elapsed = time.time() - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {elapsed:.2f}s")
        print(f"Response: {response.text[:1000]}")
        
        if response.status_code == 201:
            data = response.json()
            if "issue" in data and "ai_draft" in data:
                issue_id = data["issue"]["id"]
                ai_draft = data["ai_draft"]
                print(f"✅ PASSED: Issue created with AI draft")
                print(f"   Issue ID: {issue_id}")
                print(f"   AI Draft Keys: {list(ai_draft.keys()) if ai_draft else 'None'}")
                return issue_id
            else:
                print(f"❌ FAILED: Missing issue or ai_draft in response")
                return None
        else:
            print(f"❌ FAILED: Expected 201, got {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return None

def test_issues_get_with_data(token):
    """Test Case 10: GET /api/issues - should return array with 1 issue and properties joined"""
    print("\n" + "="*80)
    print("TEST 10: GET Issues (With Data)")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BASE_URL}/issues",
            headers={
                "Authorization": f"Bearer {token}"
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:1000]}")
        
        if response.status_code == 200:
            data = response.json()
            if "issues" in data and isinstance(data["issues"], list) and len(data["issues"]) == 1:
                issue = data["issues"][0]
                if "properties" in issue:
                    print(f"✅ PASSED: Issues list has 1 item with properties joined")
                    print(f"   Title: {issue.get('title')}")
                    print(f"   Property: {issue.get('properties', {})}")
                    return True
                else:
                    print(f"❌ FAILED: No properties join in issue")
                    return False
            else:
                print(f"❌ FAILED: Expected 1 issue, got: {len(data.get('issues', []))}")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def test_rent_estimator_london(token):
    """Test Case 11: AI Rent Estimator - London with GBP"""
    print("\n" + "="*80)
    print("TEST 11: AI Rent Estimator (London, GBP)")
    print("="*80)
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/rent/estimate",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "city": "London",
                "postcode": "E1 6AN",
                "country": "United Kingdom",
                "bedrooms": 2,
                "bathrooms": 1,
                "property_type": "apartment",
                "condition": "good",
                "furnishing": "unfurnished",
                "currency": "GBP"
            },
            timeout=60  # Real OpenAI call, may take 15-30s
        )
        elapsed = time.time() - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {elapsed:.2f}s")
        print(f"Response: {response.text[:1000]}")
        
        if response.status_code == 200:
            data = response.json()
            if "estimate" in data:
                estimate = data["estimate"]
                if all(k in estimate for k in ["expected", "conservative", "optimistic", "currency"]):
                    if estimate["currency"] == "GBP" and isinstance(estimate["expected"], (int, float)):
                        print(f"✅ PASSED: Rent estimate returned successfully")
                        print(f"   Conservative: £{estimate['conservative']}")
                        print(f"   Expected: £{estimate['expected']}")
                        print(f"   Optimistic: £{estimate['optimistic']}")
                        print(f"   Currency: {estimate['currency']}")
                        return True
                    else:
                        print(f"❌ FAILED: Invalid currency or expected value")
                        return False
                else:
                    print(f"❌ FAILED: Missing required fields in estimate")
                    return False
            else:
                print(f"❌ FAILED: No estimate in response")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def test_chat_single_turn(token):
    """Test Case 12: AI Co-Pilot Chat - Single turn"""
    print("\n" + "="*80)
    print("TEST 12: AI Co-Pilot Chat (Single Turn)")
    print("="*80)
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/chat",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "messages": [
                    {"role": "user", "content": "What is fair wear and tear?"}
                ],
                "language": "en"
            },
            timeout=60  # Real OpenAI call
        )
        elapsed = time.time() - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {elapsed:.2f}s")
        print(f"Response: {response.text[:1000]}")
        
        if response.status_code == 200:
            data = response.json()
            if "reply" in data and isinstance(data["reply"], str) and len(data["reply"]) > 0:
                reply_lower = data["reply"].lower()
                if "wear" in reply_lower or "tear" in reply_lower:
                    print(f"✅ PASSED: Chat returned relevant reply about fair wear and tear")
                    print(f"   Reply preview: {data['reply'][:200]}...")
                    return True
                else:
                    print(f"❌ FAILED: Reply doesn't mention wear and tear")
                    return False
            else:
                print(f"❌ FAILED: No reply in response")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def test_chat_multi_turn(token):
    """Test Case 13: AI Co-Pilot Chat - Multi-turn continuity"""
    print("\n" + "="*80)
    print("TEST 13: AI Co-Pilot Chat (Multi-Turn Continuity)")
    print("="*80)
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/chat",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "messages": [
                    {"role": "user", "content": "What is fair wear and tear?"},
                    {"role": "assistant", "content": "Fair wear and tear refers to the natural deterioration of a property that occurs over time through normal use, without negligence or abuse."},
                    {"role": "user", "content": "Give me 3 examples."}
                ],
                "language": "en"
            },
            timeout=60  # Real OpenAI call
        )
        elapsed = time.time() - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {elapsed:.2f}s")
        print(f"Response: {response.text[:1000]}")
        
        if response.status_code == 200:
            data = response.json()
            if "reply" in data and isinstance(data["reply"], str) and len(data["reply"]) > 0:
                reply = data["reply"]
                # Check for numbered or bulleted examples
                has_examples = any(marker in reply for marker in ["1.", "2.", "3.", "•", "-", "1)", "2)", "3)"])
                if has_examples:
                    print(f"✅ PASSED: Chat returned examples in multi-turn conversation")
                    print(f"   Reply preview: {reply[:300]}...")
                    return True
                else:
                    print(f"❌ FAILED: Reply doesn't contain numbered/bulleted examples")
                    print(f"   Reply: {reply}")
                    return False
            else:
                print(f"❌ FAILED: No reply in response")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def test_rent_estimator_madrid(token):
    """Test Case 14: AI Rent Estimator - Madrid with EUR"""
    print("\n" + "="*80)
    print("TEST 14: AI Rent Estimator (Madrid, EUR)")
    print("="*80)
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/rent/estimate",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "city": "Madrid",
                "country": "Spain",
                "bedrooms": 2,
                "property_type": "apartment",
                "condition": "good",
                "furnishing": "furnished",
                "currency": "EUR"
            },
            timeout=60  # Real OpenAI call
        )
        elapsed = time.time() - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {elapsed:.2f}s")
        print(f"Response: {response.text[:1000]}")
        
        if response.status_code == 200:
            data = response.json()
            if "estimate" in data:
                estimate = data["estimate"]
                if estimate.get("currency") == "EUR" and isinstance(estimate.get("expected"), (int, float)):
                    expected = estimate["expected"]
                    # Reasonable range for Madrid 2-bed apartment: 800-1500€
                    if 500 <= expected <= 3000:
                        print(f"✅ PASSED: Rent estimate for Madrid returned with EUR")
                        print(f"   Conservative: €{estimate['conservative']}")
                        print(f"   Expected: €{estimate['expected']}")
                        print(f"   Optimistic: €{estimate['optimistic']}")
                        print(f"   Currency: {estimate['currency']}")
                        return True
                    else:
                        print(f"❌ FAILED: Expected value {expected}€ seems unreasonable for Madrid")
                        return False
                else:
                    print(f"❌ FAILED: Invalid currency or expected value")
                    return False
            else:
                print(f"❌ FAILED: No estimate in response")
                return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def test_sendgrid_guard(token, issue_id):
    """Test Case 15: SendGrid endpoint guard - should return 400 without 'to' field"""
    print("\n" + "="*80)
    print("TEST 15: SendGrid Endpoint Guard (No 'to' field)")
    print("="*80)
    
    try:
        response = requests.post(
            f"{BASE_URL}/issues/{issue_id}/send",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={},  # No 'to' field
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 400:
            data = response.json()
            if "error" in data and "email required" in data["error"].lower():
                print(f"✅ PASSED: SendGrid guard returned 400 with correct error message")
                print(f"   Error: {data['error']}")
                return True
            else:
                print(f"❌ FAILED: Expected 'Recipient email required' error, got: {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def main():
    """Run all Phase 3 backend tests"""
    print("\n" + "="*80)
    print("AI TENANCY MANAGER - PHASE 3 BACKEND TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    results = {
        "passed": 0,
        "failed": 0,
        "total": 15
    }
    
    # Test 1: Signup landlord
    email, password = test_signup_landlord()
    if not email:
        print("\n❌ CRITICAL: Cannot proceed without landlord signup")
        return
    results["passed" if email else "failed"] += 1
    
    # Get auth token
    print("\n" + "="*80)
    print("Getting Auth Token via Supabase Password Grant")
    print("="*80)
    time.sleep(2)  # Wait for user to be fully created
    token = get_auth_token(email, password)
    if not token:
        print("\n❌ CRITICAL: Cannot proceed without auth token")
        return
    print(f"✅ Auth token obtained: {token[:20]}...")
    
    # Test 2: Create property
    property_id = test_create_property(token)
    if not property_id:
        print("\n❌ CRITICAL: Cannot proceed without property")
        return
    results["passed" if property_id else "failed"] += 1
    
    # Test 3: GET compliance (empty)
    result = test_compliance_get_empty(token)
    results["passed" if result else "failed"] += 1
    
    # Test 4: POST compliance
    compliance_id = test_compliance_post(token, property_id)
    results["passed" if compliance_id else "failed"] += 1
    
    # Test 5: GET compliance (with data)
    result = test_compliance_get_with_data(token)
    results["passed" if result else "failed"] += 1
    
    # Test 6: DELETE compliance
    if compliance_id:
        result = test_compliance_delete(token, compliance_id)
        results["passed" if result else "failed"] += 1
    else:
        print("\n⚠️ SKIPPED: Test 6 (no compliance_id)")
        results["failed"] += 1
    
    # Test 7: GET compliance (empty after delete)
    result = test_compliance_get_empty_after_delete(token)
    results["passed" if result else "failed"] += 1
    
    # Test 8: GET issues (empty)
    result = test_issues_get_empty(token)
    results["passed" if result else "failed"] += 1
    
    # Test 9: POST issue (with AI draft)
    issue_id = test_issues_post(token, property_id)
    results["passed" if issue_id else "failed"] += 1
    
    # Test 10: GET issues (with data)
    result = test_issues_get_with_data(token)
    results["passed" if result else "failed"] += 1
    
    # Test 11: AI Rent Estimator (London, GBP)
    result = test_rent_estimator_london(token)
    results["passed" if result else "failed"] += 1
    
    # Test 12: AI Co-Pilot Chat (single turn)
    result = test_chat_single_turn(token)
    results["passed" if result else "failed"] += 1
    
    # Test 13: AI Co-Pilot Chat (multi-turn)
    result = test_chat_multi_turn(token)
    results["passed" if result else "failed"] += 1
    
    # Test 14: AI Rent Estimator (Madrid, EUR)
    result = test_rent_estimator_madrid(token)
    results["passed" if result else "failed"] += 1
    
    # Test 15: SendGrid guard
    if issue_id:
        result = test_sendgrid_guard(token, issue_id)
        results["passed" if result else "failed"] += 1
    else:
        print("\n⚠️ SKIPPED: Test 15 (no issue_id)")
        results["failed"] += 1
    
    # Final summary
    print("\n" + "="*80)
    print("FINAL TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {results['total']}")
    print(f"Passed: {results['passed']} ✅")
    print(f"Failed: {results['failed']} ❌")
    print(f"Success Rate: {(results['passed']/results['total']*100):.1f}%")
    print("="*80)

if __name__ == "__main__":
    main()
