#!/usr/bin/env python3
"""
End-to-end test of the 3-stage assessment report flow (PDF + email) against a throwaway data directory.
A tiny local SMTP sink stands in for Gmail, so the email path (message, PDF attachment) is verified for real
without sending anything. Real Gmail delivery needs IRAH_GMAIL_APP_PASSWORD on the machine that runs server.py.
"""
import base64
import email
import json
import os
import socketserver
import sys
import threading
import time
import urllib.error
import urllib.request

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
DIRECTORY = os.path.dirname(_THIS_DIR) if os.path.basename(_THIS_DIR) == "tests" else _THIS_DIR
sys.path.insert(0, DIRECTORY)
sys.path.insert(0, _THIS_DIR)
import _testenv  # noqa: F401,E402
import server  # noqa: E402

PORT = 8097
SMTP_PORT = 2527
BASE = f"http://127.0.0.1:{PORT}"
RECEIVED = []


class _SmtpSink(socketserver.StreamRequestHandler):
    def _send(self, line):
        self.wfile.write((line + "\r\n").encode())

    def handle(self):
        self._send("220 sink ESMTP")
        data_mode, buf = False, []
        while True:
            raw = self.rfile.readline()
            if not raw:
                return
            line = raw.decode("utf-8", "replace").rstrip("\r\n")
            if data_mode:
                if line == ".":
                    RECEIVED.append("\n".join(buf))
                    data_mode, buf = False, []
                    self._send("250 queued")
                else:
                    buf.append(line[1:] if line.startswith("..") else line)
                continue
            cmd = line.upper()
            if cmd.startswith("EHLO") or cmd.startswith("HELO"):
                self._send("250 sink")
            elif cmd.startswith(("MAIL", "RCPT")):
                self._send("250 ok")
            elif cmd == "DATA":
                self._send("354 go")
                data_mode = True
            elif cmd == "QUIT":
                self._send("221 bye")
                return
            else:
                self._send("250 ok")


RESEND_CALLS = []


class _FakeResend(__import__("http.server").server.BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])).decode("utf-8"))
        RESEND_CALLS.append((dict(self.headers), body))
        if self.headers.get("Authorization") == "Bearer re_sandbox_key":
            resp = b'{"message":"You can only send testing emails to your own email address. To send to others, verify a domain."}'
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(resp)))
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(resp)
            return
        if self.headers.get("Authorization") != "Bearer re_test_key":
            resp = b'{"message":"API key is invalid"}'
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(resp)))
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(resp)
            return
        resp = b'{"id":"fake-message-id"}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(resp)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(resp)

    def log_message(self, *a):
        pass


def post(path, payload):
    req = urllib.request.Request(BASE + path, data=json.dumps(payload).encode("utf-8"),
                                 headers={"Content-Type": "application/json"}, method="POST")
    return urllib.request.urlopen(req, timeout=120)


def expect_status(path, payload, code):
    try:
        post(path, payload)
    except urllib.error.HTTPError as e:
        assert e.code == code, f"{path}: expected {code}, got {e.code}"
        return
    raise AssertionError(f"{path}: expected HTTP {code}, request succeeded")


def build_payload():
    with open(os.path.join(DIRECTORY, "assessment_engine_data.json"), encoding="utf-8") as f:
        engine = json.load(f)

    def block(cats, raw):
        out = []
        for c in cats:
            mx = len(c["questions"]) * 5
            pct = round(raw / mx * 100, 1)
            out.append({"name": c["name"], "weight": c["weight"], "raw_score": raw, "max_score": mx,
                        "score_pct": pct, "weighted_score": round(pct * c["weight"], 2)})
        return out

    return {
        "client_profile": {"client_name": "Dr. Alok <b>Verma</b>\r\nBcc: x@y.z", "assessment_date": "2026-10-05",
                           "age": "46 - 55", "family_size": "4 Members", "dependents_count": "2 Dependents",
                           "work_status": "Professional", "income_source": "Practice",
                           "annual_income": "1.00 Crore - 2.50 Crores", "financial_goal": "Retirement"},
        "health_results": {"overall_score": 76.8, "rating": "Stable / Good",
                           "categories": block(engine["financial_health"]["categories"], 16)},
        "risk_results": {"overall_score": 45.2, "rating": "Moderate / Controlled",
                         "categories": block(engine["financial_risk"]["categories"], 14)},
        "action_plan": [{"priority": 1, "area": "Liquidity Buffer", "action": "Hold six months of expenses in liquid instruments.",
                         "timeframe": "0-30 Days", "status": "Immediate Priority"}],
    }


def main():
    threading.Thread(target=lambda: server.run(PORT), daemon=True).start()
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    smtp = socketserver.ThreadingTCPServer(("127.0.0.1", SMTP_PORT), _SmtpSink)
    smtp.daemon_threads = True
    threading.Thread(target=smtp.serve_forever, daemon=True).start()
    time.sleep(1.2)
    payload = build_payload()

    print(">> 1. Malformed payloads rejected cleanly; old separate download endpoint removed")
    expect_status("/api/generate-assessment-pdf", payload, 404)
    expect_status("/api/submit-assessment-report", {"client_profile": "x", "consent_to_share": True}, 400)
    expect_status("/api/submit-assessment-report", ["not", "a", "dict"], 400)
    print("   [PASS] old download endpoint gone (404); 400 for malformed payloads")

    print(">> 3. Submit requires explicit consent")
    expect_status("/api/submit-assessment-report", payload, 400)
    print("   [PASS] 400 without consent_to_share")

    print(">> 4. Submit with email NOT configured is honest about it")
    with post("/api/submit-assessment-report", dict(payload, consent_to_share=True)) as r:
        res = json.loads(r.read().decode("utf-8"))
    assert res["email_dispatched"] is False and res["email_status"] == "not_configured", res
    assert "nothing was emailed" in res["message"].lower(), res["message"]
    assert base64.b64decode(res["pdf_base64"]).startswith(b"%PDF") and res["filename"].endswith(".pdf"), "browser must get the PDF to download"
    saved = [f for f in os.listdir(server.REPORTS_DIR) if f.endswith(".pdf")]
    assert saved and open(os.path.join(server.REPORTS_DIR, saved[0]), "rb").read(4) == b"%PDF", "server-side copy missing"
    print("   [PASS] reports not_configured; PDF still returned for download; copy kept on the server")

    print(f">> 5. Submit with SMTP configured sends the PDF to {server.IRAH_EMAIL} FROM the sender Gmail")
    os.environ["IRAH_SMTP_USER"] = "sender.bot@gmail.com"
    os.environ["IRAH_SMTP_HOST"], os.environ["IRAH_SMTP_PORT"], os.environ["IRAH_SMTP_STARTTLS"] = "127.0.0.1", str(SMTP_PORT), "0"
    with post("/api/submit-assessment-report", dict(payload, consent_to_share=True)) as r:
        res = json.loads(r.read().decode("utf-8"))
    assert res["email_dispatched"] is True and res["email_status"] == "sent", res
    assert len(RECEIVED) == 1, len(RECEIVED)
    msg = email.message_from_string(RECEIVED[0])
    assert msg["To"] == server.IRAH_EMAIL and msg["From"] == "sender.bot@gmail.com" and "IRAH Assessment" in msg["Subject"], (msg["From"], msg["To"])
    assert "\n" not in msg["Subject"] and msg.get("Bcc") is None, "header injection"
    parts = [p for p in msg.walk() if p.get_content_type() == "application/pdf"]
    assert parts and parts[0].get_payload(decode=True).startswith(b"%PDF"), "no PDF attachment"
    body = [p for p in msg.walk() if p.get_content_type() == "text/html"][0].get_payload(decode=True).decode("utf-8")
    assert "<b>Verma" not in body, "client name was not HTML-escaped in the email"
    print("   [PASS] email received with PDF attachment; subject and body are injection-safe")

    print(">> 6. SMTP failure is reported, not hidden")
    os.environ["IRAH_SMTP_PORT"] = "1"
    with post("/api/submit-assessment-report", dict(payload, consent_to_share=True)) as r:
        res = json.loads(r.read().decode("utf-8"))
    assert res["email_dispatched"] is False and res["email_status"] == "send_failed", res
    print("   [PASS] send_failed surfaced to the client")

    print(">> 6b. Resend API path (automated sender, no Gmail password)")
    import http.server
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    fake = http.server.ThreadingHTTPServer(("127.0.0.1", 2529), _FakeResend)
    threading.Thread(target=fake.serve_forever, daemon=True).start()
    os.environ["IRAH_RESEND_URL"] = "http://127.0.0.1:2529/emails"
    os.environ["IRAH_RESEND_API_KEY"] = "re_test_key"
    with post("/api/submit-assessment-report", dict(payload, consent_to_share=True)) as r:
        res = json.loads(r.read().decode("utf-8"))
    assert res["email_dispatched"] is True and res["email_status"] == "sent", res
    hdrs, body = RESEND_CALLS[-1]
    assert hdrs["Authorization"] == "Bearer re_test_key" and hdrs["User-Agent"].startswith("IRAH-Services")
    assert body["to"] == [server.IRAH_EMAIL] and "onboarding@resend.dev" in body["from"]
    att = body["attachments"][0]
    assert att["filename"].endswith(".pdf") and base64.b64decode(att["content"]).startswith(b"%PDF")
    assert "\n" not in body["subject"] and "<b>Verma" not in body["html"]
    os.environ["IRAH_RESEND_API_KEY"] = "re_wrong_key"
    with post("/api/submit-assessment-report", dict(payload, consent_to_share=True)) as r:
        res = json.loads(r.read().decode("utf-8"))
    assert res["email_dispatched"] is False and res["email_status"] == "auth_failed", res
    os.environ["IRAH_RESEND_API_KEY"] = "re_sandbox_key"
    with post("/api/submit-assessment-report", dict(payload, consent_to_share=True)) as r:
        res = json.loads(r.read().decode("utf-8"))
    assert res["email_status"] == "sender_restricted" and res["email_dispatched"] is False, res
    assert res["recipient"] == server.IRAH_EMAIL, res
    assert "actionable_solutions" in res and res["actionable_solutions"] is not None, res
    assert any("IRAH_GMAIL_APP_PASSWORD" in opt for opt in res["actionable_solutions"]), res["actionable_solutions"]
    os.environ["IRAH_REPORT_TO"] = "someone.else@example.com"
    os.environ["IRAH_RESEND_API_KEY"] = "re_test_key"
    with post("/api/submit-assessment-report", dict(payload, consent_to_share=True)) as r:
        res = json.loads(r.read().decode("utf-8"))
    assert res["recipient"] == "someone.else@example.com" and RESEND_CALLS[-1][1]["to"] == ["someone.else@example.com"], res
    os.environ.pop("IRAH_REPORT_TO")
    os.environ.pop("IRAH_RESEND_API_KEY"); os.environ.pop("IRAH_RESEND_URL")
    print("   [PASS] Resend request shape correct (auth, recipient, PDF attachment); bad key reported as auth_failed")

    print(f">> 7. Submissions are logged with the true email outcome and strict target {server.IRAH_EMAIL}")
    with open(server.ASSESSMENT_SUBMISSIONS_FILE, encoding="utf-8") as f:
        subs = json.load(f)
    assert [s["email_status"] for s in subs] == ["not_configured", "sent", "send_failed", "sent", "auth_failed", "sender_restricted", "sent"], subs
    assert all(s["consent_to_share"] is True for s in subs)
    assert all(s["target_email"] == server.IRAH_EMAIL for s in subs[:6]), f"all primary targets must be {server.IRAH_EMAIL}"
    print(f"   [PASS] {len(subs)} records, statuses match reality and primary recipient is {server.IRAH_EMAIL}")

    print(">> 8. irah.env loader fills missing keys, never overrides real env vars")
    envf = os.path.join(server.DATA_DIR, "t.env")
    open(envf, "w", encoding="utf-8").write("# c\nIRAH_SMTP_USER=a@gmail.com\nIRAH_GMAIL_APP_PASSWORD=abcd efgh\nOTHER=1\nIRAH_REPORT_TO=x@y.org\n")
    os.environ["IRAH_REPORT_TO"] = "keep@me.org"; os.environ.pop("IRAH_SMTP_USER", None)
    server.load_env_file(envf)
    assert os.environ["IRAH_SMTP_USER"] == "a@gmail.com" and os.environ["IRAH_REPORT_TO"] == "keep@me.org" and "OTHER" not in os.environ
    print("   [PASS] env file loaded safely")

    print("\n>> ALL ASSESSMENT END-TO-END TESTS PASSED <<")


if __name__ == "__main__":
    main()


def _test_random_sender():
    import server, os
    os.environ.pop("IRAH_MAIL_FROM", None)
    os.environ["IRAH_MAIL_DOMAIN"] = "example.org"
    a, b = server._mail_from(), server._mail_from()
    assert a != b and a.endswith("@example.org>") and a.startswith("IRAH Reports <report-"), (a, b)
    os.environ["IRAH_MAIL_DOMAIN"] = "bad domain"
    assert "onboarding@resend.dev" in server._mail_from()
    os.environ.pop("IRAH_MAIL_DOMAIN")
    print("random sender OK")
_test_random_sender()
