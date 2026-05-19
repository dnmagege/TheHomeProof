#!/usr/bin/env python3
"""
Backend test for HomeProof new features:
1. Rate limiter on signup
2. AI Dispute Evidence Builder (real OpenAI)
3. GET /api/disputes
4. AI rate limit on chat
5. Existing endpoints smoke test
6. Tagline check
"""

import requests
import time
import random
import string
import json

BASE_URL = "http://localhost:3000/api"
FRONTEND_URL = "http://localhost:3000"

def random_email():
    """Generate random email for testing"""
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test_{rand}@example.com"

def test_signup_rate_limit():
    """Test 1: Rate limiter - 11 rapid signups should trigger 429"""
    print("\n" + "="*80)
    print("TEST 1: SIGNUP RATE LIMITER")
    print("="*80)
    
    try:
        hit_limit = False
        for i in range(11):
            email = random_email()
            resp = requests.post(
                f"{BASE_URL}/auth/signup",
                json={"email": email, "password": "TestPass123!", "role": "landlord"},
                timeout=10
            )
            print(f"  Signup {i+1}: {resp.status_code} - {email}")
            
            if resp.status_code == 429:
                data = resp.json()
                print(f"  ✅ Rate limit triggered: {data.get('error')}")
                hit_limit = True
                break
            elif resp.status_code != 200:
                print(f"  ⚠️  Unexpected status: {resp.status_code} - {resp.text[:200]}")
        
        if not hit_limit:
            print("  ⚠️  WARNING: Did not hit rate limit after 11 signups")
            print("  This might mean rate limit is higher than expected or already reset")
        
        return hit_limit
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        return False

def test_ai_dispute_builder():
    """Test 2: AI Dispute Evidence Builder with real OpenAI call"""
    print("\n" + "="*80)
    print("TEST 2: AI DISPUTE EVIDENCE BUILDER")
    print("="*80)
    
    try:
        # 1. Signup landlord
        email = random_email()
        print(f"  Step 1: Signup landlord {email}")
        resp = requests.post(
            f"{BASE_URL}/auth/signup",
            json={"email": email, "password": "TestPass123!", "role": "landlord"},
            timeout=10
        )
        if resp.status_code != 200:
            print(f"  ❌ Signup failed: {resp.status_code} - {resp.text[:200]}")
            return False
        
        # 2. Get auth token
        print(f"  Step 2: Get auth token")
        # Use Supabase auth to get token
        supabase_url = "https://bpqmnxbkgilinfgqehpo.supabase.co"
        supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwcW1ueGJrZ2lsaW5mZ3FlaHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjgzODEsImV4cCI6MjA5NDQ0NDM4MX0.L0OemMdLdHQ-R9L_NCu8jrUbCoktJAYU2i3Mwn4SQEM"
        
        auth_resp = requests.post(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            json={"email": email, "password": "TestPass123!"},
            headers={"apikey": supabase_anon_key, "Content-Type": "application/json"},
            timeout=10
        )
        if auth_resp.status_code != 200:
            print(f"  ❌ Auth failed: {auth_resp.status_code} - {auth_resp.text[:200]}")
            return False
        
        token = auth_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"  ✅ Got token")
        
        # 3. Create property
        print(f"  Step 3: Create property")
        prop_resp = requests.post(
            f"{BASE_URL}/properties",
            json={
                "address_line1": "123 Dispute Test St",
                "city": "London",
                "postcode": "E1 6AN",
                "country": "UK"
            },
            headers=headers,
            timeout=10
        )
        if prop_resp.status_code != 201:
            print(f"  ❌ Property creation failed: {prop_resp.status_code} - {prop_resp.text[:200]}")
            return False
        
        property_id = prop_resp.json()["property"]["id"]
        print(f"  ✅ Property created: {property_id}")
        
        # 4. Create inventory (for evidence context)
        print(f"  Step 4: Create inventory for evidence context")
        inv_resp = requests.post(
            f"{BASE_URL}/inventories/generate",
            json={
                "property_id": property_id,
                "photo_urls": ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"]
            },
            headers=headers,
            timeout=60
        )
        if inv_resp.status_code != 200:
            print(f"  ⚠️  Inventory creation failed: {inv_resp.status_code} - {inv_resp.text[:200]}")
            print(f"  Continuing without inventory...")
        else:
            print(f"  ✅ Inventory created")
        
        # 5. Build dispute with AI
        print(f"  Step 5: Build dispute (this will take 15-40s for AI to generate)...")
        start_time = time.time()
        
        dispute_resp = requests.post(
            f"{BASE_URL}/disputes/build",
            json={
                "property_id": property_id,
                "dispute_type": "deposit_deduction",
                "tenant_position": "The carpet stains were there at move-in. I have photos.",
                "landlord_position": "The tenant ruined the carpet and needs to pay £400 for replacement.",
                "language": "en"
            },
            headers=headers,
            timeout=60
        )
        
        elapsed = time.time() - start_time
        print(f"  Response time: {elapsed:.1f}s")
        
        if dispute_resp.status_code == 400:
            error_text = dispute_resp.text
            if "does not exist" in error_text or "relation" in error_text:
                print(f"  ❌ CRITICAL: Supabase schema not set up!")
                print(f"  Error: {error_text[:300]}")
                print(f"  USER MUST RUN: /app/supabase_schema_addendum.sql in Supabase SQL Editor")
                return False
        
        if dispute_resp.status_code != 200:
            print(f"  ❌ Dispute build failed: {dispute_resp.status_code}")
            print(f"  Response: {dispute_resp.text[:500]}")
            return False
        
        data = dispute_resp.json()
        dispute = data.get("dispute")
        ai = data.get("ai")
        
        if not dispute or not ai:
            print(f"  ❌ Missing dispute or ai in response")
            return False
        
        print(f"  ✅ Dispute created: {dispute.get('id')}")
        print(f"  ✅ AI evidence bundle generated")
        
        # Verify AI structure
        required_keys = [
            "executive_summary",
            "strongest_evidence",
            "weaknesses",
            "missing_evidence",
            "recommended_arguments",
            "suggested_settlement",
            "tribunal_or_court_advice",
            "drafted_statement"
        ]
        
        missing_keys = [k for k in required_keys if k not in ai]
        if missing_keys:
            print(f"  ⚠️  Missing AI keys: {missing_keys}")
        else:
            print(f"  ✅ All required AI keys present")
        
        # Verify recommended_arguments structure
        rec_args = ai.get("recommended_arguments", {})
        if "tenant" not in rec_args or "landlord" not in rec_args:
            print(f"  ⚠️  recommended_arguments missing tenant/landlord arrays")
        else:
            print(f"  ✅ recommended_arguments has tenant and landlord arrays")
        
        # Verify strongest_evidence is array
        if not isinstance(ai.get("strongest_evidence"), list):
            print(f"  ⚠️  strongest_evidence is not an array")
        else:
            print(f"  ✅ strongest_evidence is array with {len(ai['strongest_evidence'])} items")
        
        # Check dispute.ai_evidence_bundle
        if not dispute.get("ai_evidence_bundle"):
            print(f"  ⚠️  dispute.ai_evidence_bundle is empty")
        else:
            print(f"  ✅ dispute.ai_evidence_bundle stored in database")
        
        print(f"\n  Sample AI output:")
        print(f"    Executive summary: {ai.get('executive_summary', '')[:150]}...")
        print(f"    Strongest evidence count: {len(ai.get('strongest_evidence', []))}")
        print(f"    Suggested settlement: {ai.get('suggested_settlement', '')[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_disputes_list():
    """Test 3: GET /api/disputes - verify list returns disputes with properties joined"""
    print("\n" + "="*80)
    print("TEST 3: GET /api/disputes")
    print("="*80)
    
    try:
        # Use the landlord from previous test (create new one)
        email = random_email()
        print(f"  Step 1: Signup landlord {email}")
        resp = requests.post(
            f"{BASE_URL}/auth/signup",
            json={"email": email, "password": "TestPass123!", "role": "landlord"},
            timeout=10
        )
        
        # Get token
        supabase_url = "https://bpqmnxbkgilinfgqehpo.supabase.co"
        supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwcW1ueGJrZ2lsaW5mZ3FlaHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjgzODEsImV4cCI6MjA5NDQ0NDM4MX0.L0OemMdLdHQ-R9L_NCu8jrUbCoktJAYU2i3Mwn4SQEM"
        
        auth_resp = requests.post(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            json={"email": email, "password": "TestPass123!"},
            headers={"apikey": supabase_anon_key, "Content-Type": "application/json"},
            timeout=10
        )
        token = auth_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create property
        prop_resp = requests.post(
            f"{BASE_URL}/properties",
            json={
                "address_line1": "456 Dispute List Test Ave",
                "city": "Manchester",
                "postcode": "M1 1AA"
            },
            headers=headers,
            timeout=10
        )
        property_id = prop_resp.json()["property"]["id"]
        
        # Create dispute
        dispute_resp = requests.post(
            f"{BASE_URL}/disputes/build",
            json={
                "property_id": property_id,
                "dispute_type": "repair_dispute",
                "tenant_position": "Landlord won't fix the heating.",
                "landlord_position": "Tenant didn't report it properly.",
                "language": "en"
            },
            headers=headers,
            timeout=60
        )
        
        if dispute_resp.status_code != 200:
            print(f"  ⚠️  Dispute creation failed: {dispute_resp.status_code}")
            print(f"  Skipping list test...")
            return False
        
        dispute_id = dispute_resp.json()["dispute"]["id"]
        print(f"  ✅ Dispute created: {dispute_id}")
        
        # Test GET /api/disputes
        print(f"  Step 2: GET /api/disputes")
        list_resp = requests.get(
            f"{BASE_URL}/disputes",
            headers=headers,
            timeout=10
        )
        
        if list_resp.status_code != 200:
            print(f"  ❌ GET /api/disputes failed: {list_resp.status_code} - {list_resp.text[:200]}")
            return False
        
        data = list_resp.json()
        disputes = data.get("disputes", [])
        
        print(f"  ✅ GET /api/disputes returned {len(disputes)} disputes")
        
        if len(disputes) == 0:
            print(f"  ⚠️  No disputes returned (expected at least 1)")
            return False
        
        # Verify properties join
        first_dispute = disputes[0]
        if "properties" not in first_dispute:
            print(f"  ⚠️  properties not joined in response")
            return False
        
        if not first_dispute["properties"]:
            print(f"  ⚠️  properties is null/empty")
            return False
        
        if "address_line1" not in first_dispute["properties"]:
            print(f"  ⚠️  properties.address_line1 missing")
            return False
        
        print(f"  ✅ properties.address_line1 joined: {first_dispute['properties']['address_line1']}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_ai_chat_rate_limit():
    """Test 4: AI rate limit - 31 rapid chat calls should trigger 429"""
    print("\n" + "="*80)
    print("TEST 4: AI CHAT RATE LIMITER")
    print("="*80)
    
    try:
        # Signup and get token
        email = random_email()
        resp = requests.post(
            f"{BASE_URL}/auth/signup",
            json={"email": email, "password": "TestPass123!", "role": "tenant"},
            timeout=10
        )
        
        supabase_url = "https://bpqmnxbkgilinfgqehpo.supabase.co"
        supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwcW1ueGJrZ2lsaW5mZ3FlaHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjgzODEsImV4cCI6MjA5NDQ0NDM4MX0.L0OemMdLdHQ-R9L_NCu8jrUbCoktJAYU2i3Mwn4SQEM"
        
        auth_resp = requests.post(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            json={"email": email, "password": "TestPass123!"},
            headers={"apikey": supabase_anon_key, "Content-Type": "application/json"},
            timeout=10
        )
        token = auth_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        print(f"  Making 31 rapid chat requests...")
        hit_limit = False
        
        for i in range(31):
            resp = requests.post(
                f"{BASE_URL}/chat",
                json={"messages": [{"role": "user", "content": "hi"}]},
                headers=headers,
                timeout=10
            )
            
            if resp.status_code == 429:
                data = resp.json()
                print(f"  ✅ Rate limit triggered on request {i+1}: {data.get('error')}")
                hit_limit = True
                break
            elif resp.status_code != 200:
                print(f"  ⚠️  Request {i+1}: {resp.status_code} - {resp.text[:200]}")
            else:
                if i % 10 == 0:
                    print(f"  Request {i+1}: 200 OK")
        
        if not hit_limit:
            print(f"  ⚠️  WARNING: Did not hit rate limit after 31 chat requests")
            print(f"  This might mean rate limit is higher than expected or already reset")
        
        return hit_limit
        
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_existing_endpoints():
    """Test 5: Smoke test existing endpoints"""
    print("\n" + "="*80)
    print("TEST 5: EXISTING ENDPOINTS SMOKE TEST")
    print("="*80)
    
    try:
        # Test 1: GET /api
        print(f"  Test 1: GET /api")
        resp = requests.get(f"{BASE_URL}", timeout=10)
        if resp.status_code != 200:
            print(f"  ❌ GET /api failed: {resp.status_code}")
            return False
        print(f"  ✅ GET /api: 200 OK - {resp.json().get('message')}")
        
        # Test 2: POST /api/auth/signup
        print(f"  Test 2: POST /api/auth/signup")
        email = random_email()
        resp = requests.post(
            f"{BASE_URL}/auth/signup",
            json={"email": email, "password": "TestPass123!", "role": "landlord"},
            timeout=10
        )
        if resp.status_code != 200:
            print(f"  ❌ POST /api/auth/signup failed: {resp.status_code}")
            return False
        print(f"  ✅ POST /api/auth/signup: 200 OK")
        
        # Test 3: GET /api/me
        print(f"  Test 3: GET /api/me")
        supabase_url = "https://bpqmnxbkgilinfgqehpo.supabase.co"
        supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwcW1ueGJrZ2lsaW5mZ3FlaHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjgzODEsImV4cCI6MjA5NDQ0NDM4MX0.L0OemMdLdHQ-R9L_NCu8jrUbCoktJAYU2i3Mwn4SQEM"
        
        auth_resp = requests.post(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            json={"email": email, "password": "TestPass123!"},
            headers={"apikey": supabase_anon_key, "Content-Type": "application/json"},
            timeout=10
        )
        token = auth_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        resp = requests.get(f"{BASE_URL}/me", headers=headers, timeout=10)
        if resp.status_code != 200:
            print(f"  ❌ GET /api/me failed: {resp.status_code}")
            return False
        
        data = resp.json()
        if "user" not in data or "profile" not in data:
            print(f"  ❌ GET /api/me missing user or profile")
            return False
        
        print(f"  ✅ GET /api/me: 200 OK - user: {data['user']['email']}, role: {data['profile']['role']}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_tagline():
    """Test 6: Tagline check - GET / should contain 'HomeProof'"""
    print("\n" + "="*80)
    print("TEST 6: TAGLINE CHECK (OPTIONAL)")
    print("="*80)
    
    try:
        resp = requests.get(FRONTEND_URL, timeout=10)
        if resp.status_code != 200:
            print(f"  ⚠️  GET / failed: {resp.status_code}")
            return False
        
        html = resp.text
        if "HomeProof" in html:
            print(f"  ✅ 'HomeProof' found in HTML")
            return True
        else:
            print(f"  ⚠️  'HomeProof' NOT found in HTML")
            print(f"  First 500 chars: {html[:500]}")
            return False
        
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        return False

def main():
    print("\n" + "="*80)
    print("HOMEPROOF BACKEND TESTING - NEW FEATURES")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print("="*80)
    
    results = {}
    
    # Test 1: Signup rate limiter
    results["signup_rate_limit"] = test_signup_rate_limit()
    
    # Test 2: AI Dispute Evidence Builder
    results["ai_dispute_builder"] = test_ai_dispute_builder()
    
    # Test 3: GET /api/disputes
    results["disputes_list"] = test_disputes_list()
    
    # Test 4: AI chat rate limiter
    results["ai_chat_rate_limit"] = test_ai_chat_rate_limit()
    
    # Test 5: Existing endpoints
    results["existing_endpoints"] = test_existing_endpoints()
    
    # Test 6: Tagline check
    results["tagline"] = test_tagline()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {test_name}: {status}")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    print(f"\nTotal: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    
    print("="*80)

if __name__ == "__main__":
    main()
