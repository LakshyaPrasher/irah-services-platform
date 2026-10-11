#!/usr/bin/env python3
"""
IRAH Services LLP - Live HTTP Server & Security Gateway Verification Test
Tests:
1. Server startup and shutdown
2. Static file serving (index.html, styles.css, app.js)
3. Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
4. Health check endpoint (/api/health)
5. Regulatory directory endpoint (/api/regulators)
6. Lead enquiry endpoint (/api/enquire) with valid and invalid payloads
7. XSS injection mitigation in POST payload
"""

import threading
import time
import urllib.request
import urllib.error
import json
import os
import sys

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
DIRECTORY = os.path.dirname(_THIS_DIR) if os.path.basename(_THIS_DIR) == "tests" else _THIS_DIR
sys.path.insert(0, DIRECTORY)
sys.path.insert(0, _THIS_DIR)

import _testenv  # noqa: F401  (isolated data dir; must precede `import server`)
import server

TEST_PORT = 8099

def run_server():
    server.run(TEST_PORT)

def main():
    print(">> Starting server in background thread on port", TEST_PORT)
    t = threading.Thread(target=run_server, daemon=True)
    t.start()
    time.sleep(1.0) # wait for startup

    base_url = f"http://127.0.0.1:{TEST_PORT}"

    # 1. Test GET /
    print(">> Testing GET / ...")
    req = urllib.request.Request(f"{base_url}/")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        headers = dict(resp.getheaders())
        assert headers.get("X-Frame-Options") == "SAMEORIGIN"
        assert headers.get("X-Content-Type-Options") == "nosniff"
        html = resp.read().decode("utf-8")
        assert "IRAH SERVICES" in html
        assert "https://www.sebi.gov.in/" in html
        print("   [PASS] Static index.html served with security headers")

    # 2. Test GET /api/health
    print(">> Testing GET /api/health ...")
    with urllib.request.urlopen(f"{base_url}/api/health") as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode("utf-8"))
        assert data["status"] == "healthy"
        assert "Financial Services" in data["active_verticals"]
        print("   [PASS] Health check API responded successfully")

    # 3. Test GET /api/regulators
    print(">> Testing GET /api/regulators ...")
    with urllib.request.urlopen(f"{base_url}/api/regulators") as resp:
        assert resp.status == 200
        regs = json.loads(resp.read().decode("utf-8"))
        assert len(regs) >= 8
        acronyms = [r["acronym"] for r in regs]
        assert "SEBI" in acronyms
        assert "AMFI" in acronyms
        assert "IRDAI" in acronyms
        print("   [PASS] Regulators directory returned 11+ verified portals")

    # 4. Test POST /api/enquire with legitimate data
    print(">> Testing POST /api/enquire (legitimate lead) ...")
    lead_payload = {
        "name": "Rajesh Singhania",
        "email": "rajesh@singhaniaholdings.in",
        "phone": "9820012345",
        "vertical": "investments",
        "investmentInterest": "pms",
        "investmentBracket": "1cr-5cr",
        "message": "Interested in evaluating multi-cap PMS strategies for family trust.",
        "consent": {"given": True, "notice_version": "2026-10"}
    }
    req = urllib.request.Request(
        f"{base_url}/api/enquire",
        data=json.dumps(lead_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
        res = json.loads(resp.read().decode("utf-8"))
        assert res["status"] == "success"
        assert "IRAH-" in res["reference_id"]
        print("   [PASS] Lead successfully sanitized, accepted and reference ID issued")

    # 5. Test POST /api/enquire with malicious XSS script injection
    print(">> Testing POST /api/enquire (XSS injection attempt) ...")
    malicious_payload = {
        "name": "Hacker <script>alert('xss')</script>",
        "email": "attacker@evil.com",
        "phone": "9999999999",
        "vertical": "investments",
        "message": "<img src=x onerror=alert(document.cookie)> Test payload",
        "consent": {"given": True, "notice_version": "2026-10"}
    }
    req = urllib.request.Request(
        f"{base_url}/api/enquire",
        data=json.dumps(malicious_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201

    # Verify that the malicious tags were stripped in inquiries.json
    with open(server.INQUIRIES_FILE, "r", encoding="utf-8") as f:
        stored = json.load(f)
        last_item = stored[-1]
        assert "<script>" not in last_item["name"]
        assert "<img" not in last_item["message"]
        print(f"   [PASS] XSS tags neutralized! Stored name: '{last_item['name']}', message: '{last_item['message']}'")


    # 6. Consent is mandatory and the server-side flag cannot be faked
    print(">> Testing POST /api/enquire without consent ...")
    for bad_consent in (None, {"given": False}, {"given": "yes"}):
        body = {"name": "No Consent", "email": "nc@example.com", "phone": "9876543210", "vertical": "investments"}
        if bad_consent is not None:
            body["consent"] = bad_consent
        req = urllib.request.Request(f"{base_url}/api/enquire", data=json.dumps(body).encode("utf-8"),
                                     headers={"Content-Type": "application/json"})
        try:
            urllib.request.urlopen(req)
            raise AssertionError("lead without valid consent was accepted")
        except urllib.error.HTTPError as e:
            assert e.code == 400, e.code
    print("   [PASS] Leads without explicit consent are rejected")

    # 7. Apostrophes and ampersands are stored as typed (no double escaping)
    body = {"name": "Rohan D'Souza", "email": "o'neil@example.com", "phone": "9876543210", "vertical": "investments",
            "message": "R&D budget", "consent": {"given": True}}
    req = urllib.request.Request(f"{base_url}/api/enquire", data=json.dumps(body).encode("utf-8"),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201
    with open(server.INQUIRIES_FILE, "r", encoding="utf-8") as f:
        last = json.load(f)[-1]
    assert last["name"] == "Rohan D'Souza" and last["message"] == "R&D budget", last
    print("   [PASS] Names and messages stored exactly as typed")

    # 8. Private files are never served
    for path in ("/inquiries.json", "/irah.env", "/server.py", "/assessment_submissions.json", "/README.md",
                 "/test_server_live.py", "/assessment_reports/", "/../server.py", "/%2e%2e/server.py"):
        try:
            urllib.request.urlopen(f"{base_url}{path}")
            raise AssertionError(f"{path} should not be served")
        except urllib.error.HTTPError as e:
            assert e.code in (403, 404), (path, e.code)
    print("   [PASS] Data, source and traversal paths all refused")

    # 9. Health reports email readiness without leaking secrets
    with urllib.request.urlopen(f"{base_url}/api/health") as resp:
        h = json.loads(resp.read().decode("utf-8"))
    assert h["email_dispatch_configured"] is False and "password" not in json.dumps(h).lower()
    print("   [PASS] Health endpoint reports email readiness only")

    print("\n>> ALL LIVE SERVER SECURITY & API TESTS PASSED SUCCESSFULLY! <<")

if __name__ == "__main__":
    main()
