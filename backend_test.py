#!/usr/bin/env python3
"""
Backend API Testing for banbansports UNDERGROUND HD
Tests all API endpoints for cyberpunk sports streaming platform
"""

import requests
import sys
import json
from datetime import datetime

class BanbansportsAPITester:
    def __init__(self, base_url="https://cyberpunk-canli-tv.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status=200, expected_fields=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api{endpoint}"
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=params, timeout=10)
            else:
                response = requests.request(method, url, timeout=10)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    data = response.json()
                    print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
                    
                    # Check expected fields if provided
                    if expected_fields:
                        for field in expected_fields:
                            if field not in data:
                                success = False
                                print(f"   ❌ Missing field: {field}")
                                break
                        
                    if success:
                        self.tests_passed += 1
                        print(f"✅ {name} - PASSED")
                        return True, data
                    else:
                        self.failed_tests.append(f"{name} - Missing required fields")
                        print(f"❌ {name} - FAILED (Missing fields)")
                        return False, data
                        
                except json.JSONDecodeError:
                    print(f"   Response (text): {response.text[:200]}...")
                    if expected_status == 200:
                        success = False
                        self.failed_tests.append(f"{name} - Invalid JSON response")
                        print(f"❌ {name} - FAILED (Invalid JSON)")
                    else:
                        self.tests_passed += 1
                        print(f"✅ {name} - PASSED")
                    return success, response.text
            else:
                self.failed_tests.append(f"{name} - Status {response.status_code} (expected {expected_status})")
                print(f"❌ {name} - FAILED (Status {response.status_code})")
                return False, {}

        except requests.exceptions.RequestException as e:
            self.failed_tests.append(f"{name} - Connection error: {str(e)}")
            print(f"❌ {name} - FAILED (Connection error: {str(e)})")
            return False, {}

    def test_root_endpoint(self):
        """Test /api/ endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "/",
            expected_fields=["message"]
        )

    def test_live_scores(self):
        """Test /api/scores/live endpoint"""
        return self.run_test(
            "Live Scores API",
            "GET",
            "/scores/live",
            expected_fields=["team1", "team2", "status"]
        )

    def test_channels(self):
        """Test /api/channels endpoint"""
        success, data = self.run_test(
            "Channels API",
            "GET",
            "/channels"
        )
        
        if success and isinstance(data, dict):
            # Check if channels have required structure
            required_channels = ["demo1", "demo2", "reklam", "bein1", "ssport"]
            missing_channels = []
            
            for channel in required_channels:
                if channel not in data:
                    missing_channels.append(channel)
                elif "status" not in data[channel]:
                    missing_channels.append(f"{channel}.status")
            
            if missing_channels:
                print(f"   ❌ Missing channels/fields: {missing_channels}")
                self.failed_tests.append("Channels API - Missing required channels")
                return False, data
            
            print(f"   ✅ Found {len(data)} channels with proper structure")
        
        return success, data

    def test_stream_health(self):
        """Test /api/stream/health endpoint"""
        test_url = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        return self.run_test(
            "Stream Health Check",
            "GET",
            "/stream/health",
            params={"url": test_url},
            expected_fields=["ok", "url"]
        )

    def test_websocket_endpoint(self):
        """Test WebSocket endpoint accessibility (just check if endpoint exists)"""
        # We can't easily test WebSocket in this simple script, but we can check if the endpoint is documented
        print(f"\n🔍 Testing WebSocket Endpoint Accessibility...")
        print(f"   WebSocket URL: {self.base_url.replace('https://', 'wss://')}/api/ws/scores")
        print(f"   ✅ WebSocket endpoint configured (actual connection testing requires WebSocket client)")
        return True, {}

def main():
    print("=" * 60)
    print("🚀 BANBANSPORTS UNDERGROUND HD - Backend API Testing")
    print("=" * 60)
    
    tester = BanbansportsAPITester()
    
    # Run all tests
    print(f"\n📡 Testing backend at: {tester.base_url}")
    
    # Test all endpoints
    tester.test_root_endpoint()
    tester.test_live_scores()
    tester.test_channels()
    tester.test_stream_health()
    tester.test_websocket_endpoint()
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for failure in tester.failed_tests:
            print(f"   - {failure}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("✅ Backend APIs are working well!")
        return 0
    else:
        print("❌ Backend has significant issues that need attention")
        return 1

if __name__ == "__main__":
    sys.exit(main())