#!/usr/bin/env python3
"""
IRAH Services LLP - High-Load Concurrency, Thread Safety & Load Audit Suite
==========================================================================
Verifies:
1. High concurrent inquiries (/api/enquire) with atomic thread-safe persistence
2. High concurrent assessment submissions (/api/submit-assessment-report) with
   synchronized PDF generation (PDF_LOCK) and report store logging (FILE_LOCK)
3. Heavy mixed concurrent load: simultaneous inquiries, submissions, static file
   serving, health checks, regulatory directory, and admin data queries
4. Concurrent error handling: malformed payloads, invalid phone, missing consent,
   oversized payloads, unauthorized admin access
5. Thread safety and file lock integrity (inquiries.json, assessment_submissions.json,
   quarantine mechanism) under intense parallel contention
"""

import threading
import urllib.request
import urllib.error
import json
import time
import sys
import os

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
DIRECTORY = os.path.dirname(_THIS_DIR) if os.path.basename(_THIS_DIR) == "tests" else _THIS_DIR
sys.path.insert(0, DIRECTORY)
sys.path.insert(0, _THIS_DIR)

import _testenv  # noqa: F401  (isolated data dir; must precede `import server`)
import server

# Global server handle and base URL
HTTPD = None
BASE_URL = ""


def build_assessment_payload(idx):
    return {
        "client_profile": {
            "client_name": f"Investor LoadTest {idx}",
            "assessment_date": "2026-10-10",
            "age": "36 - 45",
            "family_size": "4 Members",
            "dependents_count": "2 Dependents",
            "work_status": "Corporate Leadership",
            "income_source": "Salary & Investments",
            "annual_income": "1.00 Crore - 2.50 Crores",
            "financial_goal": "Retirement & Wealth Preservation"
        },
        "health_results": {
            "overall_score": 84.0,
            "rating": "Strong / Resilient",
            "categories": [
                {
                    "name": "Goal Clarity & Target Sizing",
                    "weight": 0.25,
                    "raw_score": 18,
                    "max_score": 20,
                    "score_pct": 90.0,
                    "weighted_score": 22.5
                },
                {
                    "name": "Emergency Cushion & Liquidity Protection",
                    "weight": 0.20,
                    "raw_score": 16,
                    "max_score": 20,
                    "score_pct": 80.0,
                    "weighted_score": 16.0
                },
                {
                    "name": "Debt Health & Liability Ratio",
                    "weight": 0.20,
                    "raw_score": 17,
                    "max_score": 20,
                    "score_pct": 85.0,
                    "weighted_score": 17.0
                },
                {
                    "name": "Risk Cover & Pure Protection Shield",
                    "weight": 0.20,
                    "raw_score": 16,
                    "max_score": 20,
                    "score_pct": 80.0,
                    "weighted_score": 16.0
                },
                {
                    "name": "Wealth Discipline & Regular Compounding Habit",
                    "weight": 0.15,
                    "raw_score": 17,
                    "max_score": 20,
                    "score_pct": 85.0,
                    "weighted_score": 12.75
                }
            ]
        },
        "risk_results": {
            "overall_score": 65.0,
            "rating": "Balanced / Growth Oriented",
            "categories": [
                {
                    "name": "Capacity to Absorb Capital Shocks",
                    "weight": 0.35,
                    "raw_score": 15,
                    "max_score": 20,
                    "score_pct": 75.0,
                    "weighted_score": 26.25
                },
                {
                    "name": "Psychological Tolerance to Market Volatility",
                    "weight": 0.35,
                    "raw_score": 14,
                    "max_score": 20,
                    "score_pct": 70.0,
                    "weighted_score": 24.5
                },
                {
                    "name": "Liquidity Time Horizon & Lock-in Comfort",
                    "weight": 0.30,
                    "raw_score": 15,
                    "max_score": 20,
                    "score_pct": 75.0,
                    "weighted_score": 22.5
                }
            ]
        },
        "action_plan": [
            {
                "priority": 1,
                "area": "Emergency Liquidity Buffer",
                "action": "Maintain 6 months of living expenses in liquid instruments.",
                "timeframe": "0-30 Days",
                "status": "Immediate Priority"
            }
        ],
        "consent_to_share": True
    }


def send_inquiry(idx, barrier=None):
    if barrier:
        barrier.wait()
    url = f"{BASE_URL}/api/enquire"
    data = json.dumps({
        "name": f"Investor Concurrency {idx}",
        "email": f"investor_{idx}@example.com",
        "phone": f"98765{idx:05d}"[-10:],
        "vertical": "investments",
        "message": f"Concurrent test payload #{idx}",
        "consent": {"given": True, "notice_version": "2026-10"}
    }).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return resp.status, body.get("reference_id")
    except Exception as e:
        return f"ERR: {e}", None


def send_assessment_submission(idx, barrier=None):
    if barrier:
        barrier.wait()
    url = f"{BASE_URL}/api/submit-assessment-report"
    payload = build_assessment_payload(idx)
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return resp.status, body.get("reference_id"), bool(body.get("pdf_base64"))
    except Exception as e:
        return f"ERR: {e}", None, False


def fetch_route(path, headers=None, barrier=None):
    if barrier:
        barrier.wait()
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read()
            return resp.status, len(content), dict(resp.getheaders())
    except urllib.error.HTTPError as e:
        return e.code, 0, dict(e.headers)
    except Exception as e:
        return f"ERR: {e}", 0, {}


def send_raw_post(endpoint, payload_bytes, content_type="application/json", barrier=None):
    if barrier:
        barrier.wait()
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, data=payload_bytes, headers={"Content-Type": content_type}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        return f"ERR: {e}"


def run_concurrency_audit():
    global HTTPD, BASE_URL

    print("=" * 70)
    print("IRAH SERVICES LLP - HIGH-LOAD CONCURRENCY & THREAD-SAFETY AUDIT")
    print("=" * 70)

    # 0. Start dedicated test server on dynamically allocated free port
    HTTPD = server.ThreadingHTTPServer(("127.0.0.1", 0), server.IrahHTTPRequestHandler)
    assigned_port = HTTPD.server_address[1]
    BASE_URL = f"http://127.0.0.1:{assigned_port}"
    print(f">> Started dedicated test server on 127.0.0.1:{assigned_port}")
    server_thread = threading.Thread(target=HTTPD.serve_forever, daemon=True)
    server_thread.start()
    time.sleep(0.5)

    try:
        # Verify server is listening
        with urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=5) as r:
            assert r.status == 200, "Server failed to start!"
        print(f"   [READY] Server responsive at {BASE_URL} (data dir: {server.DATA_DIR})\n")

        # Initialize clean stores in isolated test directory
        with open(server.INQUIRIES_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
        with open(server.ASSESSMENT_SUBMISSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)

        # -------------------------------------------------------------------------
        # SUITE 1: High Concurrent Inquiries (30 Simultaneous Threads)
        # -------------------------------------------------------------------------
        print(">> SUITE 1: 30 Simultaneous Lead Inquiries (/api/enquire)")
        barrier_1 = threading.Barrier(30)
        results_1 = [None] * 30

        def worker_inq(i):
            results_1[i] = send_inquiry(i, barrier=barrier_1)

        threads = [threading.Thread(target=worker_inq, args=(i,)) for i in range(30)]
        for th in threads:
            th.start()
        for th in threads:
            th.join()

        statuses_1 = [r[0] for r in results_1]
        ref_ids_1 = [r[1] for r in results_1]
        success_count_1 = statuses_1.count(201)
        print(f"   Status 201 count: {success_count_1} / 30")
        assert success_count_1 == 30, f"Expected 30 HTTP 201 responses, got: {statuses_1}"
        assert len(set(ref_ids_1)) == 30, "Duplicate reference IDs generated under concurrency!"

        # Verify atomic inquiries.json integrity
        with open(server.INQUIRIES_FILE, "r", encoding="utf-8") as f:
            saved_inquiries = json.load(f)
        print(f"   [PASS] inquiries.json integrity verified: exactly {len(saved_inquiries)}/30 records saved")
        assert len(saved_inquiries) == 30, f"Race condition data loss detected! {len(saved_inquiries)} saved."

        # -------------------------------------------------------------------------
        # SUITE 2: High Concurrent Assessment Submissions (5 Simultaneous Threads)
        # -------------------------------------------------------------------------
        print("\n>> SUITE 2: 5 Simultaneous Assessment Submissions (/api/submit-assessment-report)")
        print("   (Testing concurrent PDF generation with PDF_LOCK & atomic submission persistence)")
        barrier_2 = threading.Barrier(5)
        results_2 = [None] * 5

        def worker_assess(i):
            results_2[i] = send_assessment_submission(i, barrier=barrier_2)

        threads = [threading.Thread(target=worker_assess, args=(i,)) for i in range(5)]
        t0 = time.time()
        for th in threads:
            th.start()
        for th in threads:
            th.join()
        elapsed_2 = time.time() - t0

        statuses_2 = [r[0] for r in results_2]
        ref_ids_2 = [r[1] for r in results_2]
        has_pdf_2 = [r[2] for r in results_2]
        success_count_2 = statuses_2.count(200)
        print(f"   Status 200 count: {success_count_2} / 5 (Elapsed: {elapsed_2:.2f}s)")
        assert success_count_2 == 5, f"Expected 5 HTTP 200 responses, got: {statuses_2}"
        assert all(has_pdf_2), "One or more responses missing generated PDF base64 payload!"
        assert len(set(ref_ids_2)) == 5, "Duplicate assessment reference IDs detected!"

        # Verify assessment_submissions.json integrity
        with open(server.ASSESSMENT_SUBMISSIONS_FILE, "r", encoding="utf-8") as f:
            saved_submissions = json.load(f)
        print(f"   [PASS] assessment_submissions.json verified: exactly {len(saved_submissions)}/5 records saved")
        assert len(saved_submissions) == 5, f"Submission data loss detected! Expected 5, got {len(saved_submissions)}"

        # Verify physical PDF files on disk in reports directory
        saved_pdfs = [f for f in os.listdir(server.REPORTS_DIR) if f.endswith(".pdf")]
        print(f"   [PASS] Physical PDF files generated: {len(saved_pdfs)}/5 files verified in {server.REPORTS_DIR}")
        assert len(saved_pdfs) == 5, f"Expected 5 PDF files on disk, found {len(saved_pdfs)}"
        for pdf_name in saved_pdfs:
            pdf_path = os.path.join(server.REPORTS_DIR, pdf_name)
            with open(pdf_path, "rb") as pf:
                header = pf.read(4)
                assert header == b"%PDF", f"Corrupted PDF header in {pdf_name}: {header}"

        # -------------------------------------------------------------------------
        # SUITE 3: Heavy Mixed-Traffic Concurrent Stress Test (50 Simultaneous Threads)
        # -------------------------------------------------------------------------
        print("\n>> SUITE 3: Heavy Mixed Concurrent Load (50 Simultaneous Threads)")
        print("   - 15 concurrent Inquiries (/api/enquire)")
        print("   - 3 concurrent Assessment Submissions (/api/submit-assessment-report)")
        print("   - 15 concurrent Static & Engine File GET requests (/, /styles.css, /app.js, /assessment_engine_data.json)")
        print("   - 10 concurrent Health & Regulatory Directory GET requests (/api/health, /api/regulators)")
        print("   - 7 concurrent Authenticated Admin Inquiries GET requests (/api/inquiries)")

        total_threads_3 = 50
        barrier_3 = threading.Barrier(total_threads_3)
        results_inq_3 = []
        results_assess_3 = []
        results_static_3 = []
        results_meta_3 = []
        results_admin_3 = []
        lock_res = threading.Lock()

        def do_inq(i):
            res = send_inquiry(100 + i, barrier=barrier_3)
            with lock_res:
                results_inq_3.append(res)

        def do_assess(i):
            res = send_assessment_submission(100 + i, barrier=barrier_3)
            with lock_res:
                results_assess_3.append(res)

        def do_static(path):
            res = fetch_route(path, barrier=barrier_3)
            with lock_res:
                results_static_3.append((path, res))

        def do_meta(path):
            res = fetch_route(path, barrier=barrier_3)
            with lock_res:
                results_meta_3.append((path, res))

        def do_admin():
            hdrs = {"X-Admin-Key": server.ADMIN_SECRET_KEY}
            res = fetch_route("/api/inquiries", headers=hdrs, barrier=barrier_3)
            with lock_res:
                results_admin_3.append(res)

        threads_3 = []
        for i in range(15):
            threads_3.append(threading.Thread(target=do_inq, args=(i,)))
        for i in range(3):
            threads_3.append(threading.Thread(target=do_assess, args=(i,)))
        static_paths = ["/", "/styles.css", "/app.js", "/assessment_engine_data.json"]
        for i in range(15):
            threads_3.append(threading.Thread(target=do_static, args=(static_paths[i % len(static_paths)],)))
        meta_paths = ["/api/health", "/api/regulators"]
        for i in range(10):
            threads_3.append(threading.Thread(target=do_meta, args=(meta_paths[i % len(meta_paths)],)))
        for i in range(7):
            threads_3.append(threading.Thread(target=do_admin))

        t0_3 = time.time()
        for th in threads_3:
            th.start()
        for th in threads_3:
            th.join()
        elapsed_3 = time.time() - t0_3

        print(f"   Mixed stress test completed in {elapsed_3:.2f}s across {total_threads_3} threads")

        # Assertions on Suite 3 outcomes
        inq_3_statuses = [r[0] for r in results_inq_3]
        assess_3_statuses = [r[0] for r in results_assess_3]
        static_3_statuses = [r[1][0] for r in results_static_3]
        meta_3_statuses = [r[1][0] for r in results_meta_3]
        admin_3_statuses = [r[0] for r in results_admin_3]

        assert inq_3_statuses.count(201) == 15, f"Expected 15 HTTP 201 inquiries, got: {inq_3_statuses}"
        assert assess_3_statuses.count(200) == 3, f"Expected 3 HTTP 200 submissions, got: {assess_3_statuses}"
        assert static_3_statuses.count(200) == 15, f"Expected 15 HTTP 200 static loads, got: {static_3_statuses}"
        assert meta_3_statuses.count(200) == 10, f"Expected 10 HTTP 200 metadata loads, got: {meta_3_statuses}"
        assert admin_3_statuses.count(200) == 7, f"Expected 7 HTTP 200 admin reads, got: {admin_3_statuses}"
        print("   [PASS] All 50 concurrent requests across 5 verticals returned HTTP 200/201")

        # Verify cumulative store counts
        with open(server.INQUIRIES_FILE, "r", encoding="utf-8") as f:
            total_inquiries = json.load(f)
        with open(server.ASSESSMENT_SUBMISSIONS_FILE, "r", encoding="utf-8") as f:
            total_submissions = json.load(f)
        total_pdfs = [f for f in os.listdir(server.REPORTS_DIR) if f.endswith(".pdf")]

        expected_total_inq = 30 + 15
        expected_total_assess = 5 + 3
        print(f"   [PASS] Total inquiries recorded: {len(total_inquiries)} (Expected: {expected_total_inq})")
        print(f"   [PASS] Total assessment records: {len(total_submissions)} (Expected: {expected_total_assess})")
        print(f"   [PASS] Total PDFs on disk: {len(total_pdfs)} (Expected: {expected_total_assess})")
        assert len(total_inquiries) == expected_total_inq, f"Inquiries mismatch: {len(total_inquiries)} != {expected_total_inq}"
        assert len(total_submissions) == expected_total_assess, f"Submissions mismatch: {len(total_submissions)} != {expected_total_assess}"
        assert len(total_pdfs) == expected_total_assess, f"PDF count mismatch: {len(total_pdfs)} != {expected_total_assess}"

        # -------------------------------------------------------------------------
        # SUITE 4: Concurrent Error Handling & Adversarial Traffic (35 Simultaneous Threads)
        # -------------------------------------------------------------------------
        print("\n>> SUITE 4: Concurrent Error Handling & Threat Resistance (35 Simultaneous Threads)")
        print("   - 5 threads: Malformed JSON syntax to /api/enquire (Expected: 400)")
        print("   - 5 threads: Missing consent to /api/enquire (Expected: 400)")
        print("   - 5 threads: Invalid phone number to /api/enquire (Expected: 400)")
        print("   - 5 threads: Oversized payload (>16KB) to /api/enquire (Expected: 413)")
        print("   - 5 threads: Malformed assessment payload to /api/submit-assessment-report (Expected: 400)")
        print("   - 5 threads: Missing consent_to_share to /api/submit-assessment-report (Expected: 400)")
        print("   - 5 threads: Unauthorized access to /api/inquiries without token (Expected: 403)")

        total_threads_4 = 35
        barrier_4 = threading.Barrier(total_threads_4)
        err_results = []
        lock_err = threading.Lock()

        def do_err_test(test_fn):
            res = test_fn()
            with lock_err:
                err_results.append(res)

        threads_4 = []

        # 1. Malformed JSON
        for _ in range(5):
            threads_4.append(threading.Thread(target=do_err_test, args=(
                lambda: ("malformed_json", send_raw_post("/api/enquire", b"{\"name\": \"Corrupt", barrier=barrier_4)),
            )))

        # 2. Missing consent
        def test_missing_consent():
            body = json.dumps({"name": "Test User", "email": "user@test.com", "phone": "9876543210", "consent": {"given": False}}).encode()
            return ("missing_consent", send_raw_post("/api/enquire", body, barrier=barrier_4))
        for _ in range(5):
            threads_4.append(threading.Thread(target=do_err_test, args=(test_missing_consent,)))

        # 3. Invalid phone
        def test_invalid_phone():
            body = json.dumps({"name": "Test User", "email": "user@test.com", "phone": "12345", "consent": {"given": True}}).encode()
            return ("invalid_phone", send_raw_post("/api/enquire", body, barrier=barrier_4))
        for _ in range(5):
            threads_4.append(threading.Thread(target=do_err_test, args=(test_invalid_phone,)))

        # 4. Oversized payload > 16KB
        def test_oversized():
            body = json.dumps({"name": "Test User", "email": "user@test.com", "phone": "9876543210", "message": "X" * 20000, "consent": {"given": True}}).encode()
            return ("oversized", send_raw_post("/api/enquire", body, barrier=barrier_4))
        for _ in range(5):
            threads_4.append(threading.Thread(target=do_err_test, args=(test_oversized,)))

        # 5. Malformed assessment payload
        def test_malformed_assess():
            body = json.dumps({"broken": "payload"}).encode()
            return ("malformed_assess", send_raw_post("/api/submit-assessment-report", body, barrier=barrier_4))
        for _ in range(5):
            threads_4.append(threading.Thread(target=do_err_test, args=(test_malformed_assess,)))

        # 6. Missing consent_to_share
        def test_assess_no_consent():
            payload = build_assessment_payload(999)
            payload["consent_to_share"] = False
            body = json.dumps(payload).encode()
            return ("assess_no_consent", send_raw_post("/api/submit-assessment-report", body, barrier=barrier_4))
        for _ in range(5):
            threads_4.append(threading.Thread(target=do_err_test, args=(test_assess_no_consent,)))

        # 7. Unauthorized /api/inquiries
        def test_unauthorized_inquiries():
            st, _, _ = fetch_route("/api/inquiries", headers={"X-Admin-Key": "WRONG_KEY"}, barrier=barrier_4)
            return ("unauthorized_inquiries", st)
        for _ in range(5):
            threads_4.append(threading.Thread(target=do_err_test, args=(test_unauthorized_inquiries,)))

        for th in threads_4:
            th.start()
        for th in threads_4:
            th.join()

        # Verify error outcomes
        by_category = {}
        for cat, status in err_results:
            by_category.setdefault(cat, []).append(status)

        assert by_category["malformed_json"] == [400] * 5, f"Malformed JSON unexpected: {by_category['malformed_json']}"
        assert by_category["missing_consent"] == [400] * 5, f"Missing consent unexpected: {by_category['missing_consent']}"
        assert by_category["invalid_phone"] == [400] * 5, f"Invalid phone unexpected: {by_category['invalid_phone']}"
        assert by_category["oversized"] == [413] * 5, f"Oversized unexpected: {by_category['oversized']}"
        assert by_category["malformed_assess"] == [400] * 5, f"Malformed assessment unexpected: {by_category['malformed_assess']}"
        assert by_category["assess_no_consent"] == [400] * 5, f"Assessment missing consent unexpected: {by_category['assess_no_consent']}"
        assert by_category["unauthorized_inquiries"] == [403] * 5, f"Unauthorized inquiries unexpected: {by_category['unauthorized_inquiries']}"
        print("   [PASS] All 35 concurrent error and attack vectors correctly rejected with 400/403/413")

        # Verify server is still healthy
        st, _, _ = fetch_route("/api/health")
        assert st == 200, "Server unhealthy after error barrage!"
        print("   [PASS] Server remains healthy and operational after adversarial load")

        # Verify no corrupted records were written
        with open(server.INQUIRIES_FILE, "r", encoding="utf-8") as f:
            curr_inq = json.load(f)
        with open(server.ASSESSMENT_SUBMISSIONS_FILE, "r", encoding="utf-8") as f:
            curr_assess = json.load(f)
        assert len(curr_inq) == expected_total_inq, "Corrupt inquiry entry written during error testing!"
        assert len(curr_assess) == expected_total_assess, "Corrupt assessment entry written during error testing!"
        print("   [PASS] Persistence stores completely uncontaminated by invalid requests")

        # -------------------------------------------------------------------------
        # SUITE 5: File Lock Recovery & Quarantine Under Concurrency
        # -------------------------------------------------------------------------
        print("\n>> SUITE 5: File Lock Recovery & Quarantine Resilience")
        quarantine_test_file = os.path.join(server.DATA_DIR, "quarantine_test.json")
        with open(quarantine_test_file, "w", encoding="utf-8") as f:
            f.write("{ INVALID JSON NOT A LIST [[[")

        # append_json_record should quarantine the broken file and append the valid record
        test_rec = {"test_id": "RECOVERY_1", "timestamp": server.get_iso_now()}
        success = server.append_json_record(quarantine_test_file, test_rec)
        assert success is True, "append_json_record failed to recover from corrupted store!"

        with open(quarantine_test_file, "r", encoding="utf-8") as f:
            recovered_data = json.load(f)
        assert recovered_data == [test_rec], f"Unexpected recovered data: {recovered_data}"

        # Verify quarantined file exists
        quarantined_files = [f for f in os.listdir(server.DATA_DIR) if f.startswith("quarantine_test.json.corrupt-")]
        assert len(quarantined_files) == 1, "Corrupted file was not quarantined!"
        print(f"   [PASS] Quarantined corrupted store as: {quarantined_files[0]}")
        print("   [PASS] Recovered store initialized cleanly with new record")

        print("\n" + "=" * 70)
        print("CONCURRENCY & THREAD SAFETY AUDIT COMPLETE: 100% OF TESTS PASSED!")
        print("=" * 70)

    finally:
        if HTTPD:
            HTTPD.shutdown()
            print(">> Test server cleanly stopped.")


if __name__ == "__main__":
    run_concurrency_audit()
