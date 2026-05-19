#!/usr/bin/env python3
"""
SendGrid Email Sending Test for AI Tenancy Manager
Tests the complete email sending flow with verified sender: thehomeproof@outlook.com
"""

import requests
import json
import time
import random
import string
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000/api"
SUPABASE_URL = "https://bpqmnxbkgilinfgqehpo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwcW1ueGJrZ2lsaW5mZ3FlaHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjgzODEsImV4cCI6MjA5NDQ0NDM4MX0.L0OemMdLdHQ-R9L_NCu8jrUbCoktJAYU2i3Mwn4SQEM"
VERIFIED_SENDER = "thehomeproof@outlook.com"

def generate_random_email():
    """Generate random email for testing"""
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"landlord+{rand}@test.com"

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

def test_1_signup_landlord():
    """Test 1: Sign up a fresh landlord"""
    print("\n" + "="*80)
    print("TEST 1: Sign up Fresh Landlord")
    print("="*80)
    
    email = generate_random_email()
    password = "Test1234!"
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/signup",
            json={
                "email": email,
                "password": password,
                "name": "Test Landlord",
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

def test_2_create_property(token):
    """Test 2: Create a property"""
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
                "address_line1": "22 Email Test St",
                "city": "London",
                "postcode": "E1 6AN"
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
                print(f"   Address: 22 Email Test St, London, E1 6AN")
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

def test_3_create_issue(token, property_id):
    """Test 3: Create an issue (auto-generates AI draft)"""
    print("\n" + "="*80)
    print("TEST 3: Create Issue with AI Draft")
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
                "title": "Test boiler issue",
                "description": "Boiler making loud noise"
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
                print(f"   Title: {data['issue']['title']}")
                print(f"   AI Draft Subject: {ai_draft.get('subject', 'N/A')}")
                print(f"   AI Draft Classification: {ai_draft.get('classification', 'N/A')}")
                print(f"   AI Draft Urgency: {ai_draft.get('urgency', 'N/A')}")
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

def test_4_send_email(token, issue_id):
    """Test 4: Send the email via SendGrid"""
    print("\n" + "="*80)
    print("TEST 4: Send Email via SendGrid")
    print("="*80)
    print(f"Sending to verified sender: {VERIFIED_SENDER}")
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/issues/{issue_id}/send",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "to": VERIFIED_SENDER
            },
            timeout=30  # Generous timeout for SendGrid API
        )
        elapsed = time.time() - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {elapsed:.2f}s")
        print(f"Response: {response.text[:1000]}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True and data.get("sent_to") == VERIFIED_SENDER:
                print(f"✅ PASSED: Email sent successfully via SendGrid")
                print(f"   Sent to: {data['sent_to']}")
                print(f"   Response: {data}")
                return True
            else:
                print(f"❌ FAILED: Expected {{ok: true, sent_to: '{VERIFIED_SENDER}'}}, got: {data}")
                return False
        elif response.status_code == 500:
            data = response.json()
            error_msg = data.get("error", "Unknown error")
            print(f"❌ FAILED: SendGrid API error (500)")
            print(f"   Error: {error_msg}")
            print(f"   This indicates a SendGrid configuration or API issue")
            return False
        else:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def test_5_error_path_missing_to(token, issue_id):
    """Test 5: Error path - missing 'to' field"""
    print("\n" + "="*80)
    print("TEST 5: Error Path - Missing 'to' Field")
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
                print(f"✅ PASSED: Correctly returned 400 with error message")
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

def test_6_invalid_issue_uuid(token):
    """Test 6: Error path - invalid issue UUID"""
    print("\n" + "="*80)
    print("TEST 6: Error Path - Invalid Issue UUID")
    print("="*80)
    
    invalid_uuid = "invalid-uuid-here"
    
    try:
        response = requests.post(
            f"{BASE_URL}/issues/{invalid_uuid}/send",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "to": VERIFIED_SENDER
            },
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        if response.status_code == 404:
            data = response.json()
            if "error" in data and "not found" in data["error"].lower():
                print(f"✅ PASSED: Correctly returned 404 for invalid issue UUID")
                print(f"   Error: {data['error']}")
                return True
            else:
                print(f"❌ FAILED: Expected 'Issue not found' error, got: {data}")
                return False
        else:
            print(f"❌ FAILED: Expected 404, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: Exception - {e}")
        return False

def main():
    """Run SendGrid email sending test suite"""
    print("\n" + "="*80)
    print("SENDGRID EMAIL SENDING TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Verified Sender: {VERIFIED_SENDER}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    results = {
        "passed": 0,
        "failed": 0,
        "total": 6
    }
    
    # Test 1: Signup landlord
    email, password = test_1_signup_landlord()
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
    property_id = test_2_create_property(token)
    if not property_id:
        print("\n❌ CRITICAL: Cannot proceed without property")
        return
    results["passed" if property_id else "failed"] += 1
    
    # Test 3: Create issue with AI draft
    issue_id = test_3_create_issue(token, property_id)
    if not issue_id:
        print("\n❌ CRITICAL: Cannot proceed without issue")
        return
    results["passed" if issue_id else "failed"] += 1
    
    # Test 4: Send email via SendGrid
    result = test_4_send_email(token, issue_id)
    results["passed" if result else "failed"] += 1
    
    # Test 5: Error path - missing 'to' field
    result = test_5_error_path_missing_to(token, issue_id)
    results["passed" if result else "failed"] += 1
    
    # Test 6: Error path - invalid issue UUID
    result = test_6_invalid_issue_uuid(token)
    results["passed" if result else "failed"] += 1
    
    # Final summary
    print("\n" + "="*80)
    print("FINAL TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {results['total']}")
    print(f"Passed: {results['passed']} ✅")
    print(f"Failed: {results['failed']} ❌")
    print(f"Success Rate: {(results['passed']/results['total']*100):.1f}%")
    print("="*80)
    
    if results['passed'] == results['total']:
        print("\n🎉 ALL TESTS PASSED - SendGrid email sending is working correctly!")
    else:
        print(f"\n⚠️ {results['failed']} test(s) failed - Review the output above for details")

if __name__ == "__main__":
    main()
