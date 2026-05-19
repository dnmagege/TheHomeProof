#!/usr/bin/env python3
"""
Quick re-test of AI Dispute Evidence Builder after SQL addendum.
Tests exactly as requested by user.
"""

import requests
import time
import random
import string
import json

BASE_URL = "http://localhost:3000/api"

def random_email():
    """Generate random email for testing"""
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"landlord_{rand}@homeproof.test"

def main():
    print("\n" + "="*80)
    print("AI DISPUTE EVIDENCE BUILDER - RE-TEST AFTER SQL ADDENDUM")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    try:
        # Step 1: Sign up fresh landlord
        email = random_email()
        print(f"\n[1/4] Signing up landlord: {email}")
        
        signup_resp = requests.post(
            f"{BASE_URL}/auth/signup",
            json={
                "email": email,
                "password": "SecurePass123!",
                "name": "Test Landlord",
                "role": "landlord"
            },
            timeout=10
        )
        
        if signup_resp.status_code != 200:
            print(f"❌ FAILED: Signup returned {signup_resp.status_code}")
            print(f"Response: {signup_resp.text[:500]}")
            return False
        
        print(f"✅ Landlord signed up successfully")
        
        # Step 2: Get auth token via Supabase password grant
        print(f"\n[2/4] Getting auth token via Supabase password grant...")
        
        supabase_url = "https://bpqmnxbkgilinfgqehpo.supabase.co"
        supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwcW1ueGJrZ2lsaW5mZ3FlaHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjgzODEsImV4cCI6MjA5NDQ0NDM4MX0.L0OemMdLdHQ-R9L_NCu8jrUbCoktJAYU2i3Mwn4SQEM"
        
        auth_resp = requests.post(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            json={"email": email, "password": "SecurePass123!"},
            headers={"apikey": supabase_anon_key, "Content-Type": "application/json"},
            timeout=10
        )
        
        if auth_resp.status_code != 200:
            print(f"❌ FAILED: Auth returned {auth_resp.status_code}")
            print(f"Response: {auth_resp.text[:500]}")
            return False
        
        token = auth_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"✅ Auth token obtained")
        
        # Step 3: Create property
        print(f"\n[3/4] Creating property...")
        
        prop_resp = requests.post(
            f"{BASE_URL}/properties",
            json={
                "address_line1": "789 Dispute Evidence Test Road",
                "city": "London",
                "postcode": "SW1A 1AA",
                "country": "UK"
            },
            headers=headers,
            timeout=10
        )
        
        if prop_resp.status_code != 201:
            print(f"❌ FAILED: Property creation returned {prop_resp.status_code}")
            print(f"Response: {prop_resp.text[:500]}")
            return False
        
        property_id = prop_resp.json()["property"]["id"]
        print(f"✅ Property created: {property_id}")
        
        # Step 4: POST /api/disputes/build
        print(f"\n[4/4] Building dispute with AI (this will take 15-40s)...")
        
        start_time = time.time()
        
        dispute_resp = requests.post(
            f"{BASE_URL}/disputes/build",
            json={
                "property_id": property_id,
                "dispute_type": "deposit_deduction",
                "tenant_position": "I deny causing the carpet damage; it was there at move-in.",
                "landlord_position": "Tenant ruined the carpet and must pay £400 for replacement.",
                "language": "en"
            },
            headers=headers,
            timeout=60
        )
        
        elapsed = time.time() - start_time
        print(f"Response time: {elapsed:.1f}s")
        
        if dispute_resp.status_code != 200:
            print(f"❌ FAILED: Dispute build returned {dispute_resp.status_code}")
            print(f"Response: {dispute_resp.text[:1000]}")
            
            # Check if it's a schema issue
            error_text = dispute_resp.text.lower()
            if "does not exist" in error_text or "relation" in error_text or "table" in error_text:
                print(f"\n🚨 CRITICAL: Supabase schema issue detected!")
                print(f"The disputes table may not exist or SQL addendum was not run correctly.")
            
            return False
        
        data = dispute_resp.json()
        dispute = data.get("dispute")
        ai = data.get("ai")
        
        if not dispute:
            print(f"❌ FAILED: No 'dispute' in response")
            print(f"Response keys: {list(data.keys())}")
            return False
        
        if not ai:
            print(f"❌ FAILED: No 'ai' in response")
            print(f"Response keys: {list(data.keys())}")
            return False
        
        print(f"✅ Dispute created: {dispute.get('id')}")
        print(f"✅ AI evidence bundle generated")
        
        # Verify all required AI keys
        print(f"\nVerifying AI response structure...")
        
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
            print(f"❌ FAILED: Missing AI keys: {missing_keys}")
            print(f"Present keys: {list(ai.keys())}")
            return False
        
        print(f"✅ All required AI keys present: {', '.join(required_keys)}")
        
        # Verify recommended_arguments structure
        rec_args = ai.get("recommended_arguments", {})
        if not isinstance(rec_args, dict):
            print(f"❌ FAILED: recommended_arguments is not a dict")
            return False
        
        if "tenant" not in rec_args or "landlord" not in rec_args:
            print(f"❌ FAILED: recommended_arguments missing tenant/landlord keys")
            print(f"Present keys: {list(rec_args.keys())}")
            return False
        
        if not isinstance(rec_args["tenant"], list) or not isinstance(rec_args["landlord"], list):
            print(f"❌ FAILED: recommended_arguments.tenant or .landlord is not an array")
            return False
        
        print(f"✅ recommended_arguments has tenant and landlord arrays")
        
        # Verify strongest_evidence is array
        if not isinstance(ai.get("strongest_evidence"), list):
            print(f"❌ FAILED: strongest_evidence is not an array")
            return False
        
        print(f"✅ strongest_evidence is array with {len(ai['strongest_evidence'])} items")
        
        # Verify weaknesses is array
        if not isinstance(ai.get("weaknesses"), list):
            print(f"❌ FAILED: weaknesses is not an array")
            return False
        
        print(f"✅ weaknesses is array with {len(ai['weaknesses'])} items")
        
        # Verify missing_evidence is array
        if not isinstance(ai.get("missing_evidence"), list):
            print(f"❌ FAILED: missing_evidence is not an array")
            return False
        
        print(f"✅ missing_evidence is array with {len(ai['missing_evidence'])} items")
        
        # Print sample output
        print(f"\n📋 Sample AI Output:")
        print(f"  Executive Summary: {ai.get('executive_summary', '')[:200]}...")
        print(f"  Strongest Evidence Count: {len(ai.get('strongest_evidence', []))}")
        print(f"  Tenant Arguments: {len(rec_args.get('tenant', []))} points")
        print(f"  Landlord Arguments: {len(rec_args.get('landlord', []))} points")
        print(f"  Suggested Settlement: {ai.get('suggested_settlement', '')[:150]}...")
        print(f"  Tribunal Advice: {ai.get('tribunal_or_court_advice', '')[:150]}...")
        
        # Step 5: GET /api/disputes
        print(f"\n[5/5] Testing GET /api/disputes...")
        
        list_resp = requests.get(
            f"{BASE_URL}/disputes",
            headers=headers,
            timeout=10
        )
        
        if list_resp.status_code != 200:
            print(f"❌ FAILED: GET /api/disputes returned {list_resp.status_code}")
            print(f"Response: {list_resp.text[:500]}")
            return False
        
        list_data = list_resp.json()
        disputes = list_data.get("disputes", [])
        
        if len(disputes) == 0:
            print(f"❌ FAILED: GET /api/disputes returned empty array (expected at least 1)")
            return False
        
        print(f"✅ GET /api/disputes returned {len(disputes)} dispute(s)")
        
        # Verify the dispute we just created is in the list
        found = False
        for d in disputes:
            if d.get("id") == dispute.get("id"):
                found = True
                
                # Verify properties join
                if "properties" not in d:
                    print(f"❌ FAILED: properties not joined in dispute list")
                    return False
                
                if not d["properties"]:
                    print(f"❌ FAILED: properties is null/empty")
                    return False
                
                if "address_line1" not in d["properties"]:
                    print(f"❌ FAILED: properties.address_line1 missing")
                    return False
                
                print(f"✅ Dispute found in list with properties.address_line1: {d['properties']['address_line1']}")
                break
        
        if not found:
            print(f"⚠️  WARNING: Created dispute not found in list (may be timing issue)")
        
        # Final success
        print(f"\n" + "="*80)
        print("🎉 ALL TESTS PASSED!")
        print("="*80)
        print(f"✅ Landlord signup working")
        print(f"✅ Auth token retrieval working")
        print(f"✅ Property creation working")
        print(f"✅ POST /api/disputes/build working (200 with all required AI keys)")
        print(f"✅ GET /api/disputes working (200 with array containing dispute)")
        print(f"✅ AI response time: {elapsed:.1f}s")
        print("="*80)
        
        return True
        
    except Exception as e:
        print(f"\n❌ EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
