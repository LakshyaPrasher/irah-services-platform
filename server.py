#!/usr/bin/env python3
"""
IRAH Services LLP - Production-grade Local HTTP Server & Security Gateway
Features:
- Threading HTTP server (non-blocking concurrent handling)
- Thread-safe, atomic inquiry file persistence with file locking
- Strict Security Headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Lead submission endpoint (/api/enquire) with payload sanitization and collision-free ID generation
- Health check endpoint (/api/health)
- Regulatory directory metadata endpoint (/api/regulators) with 15+ statutory and market portals
- Protected inquiries endpoint (/api/inquiries) with PII data privacy guardrails
"""

import http.server
import socketserver
import os
import sys
import json
import re
import urllib.parse
import threading
import secrets
import time
import hmac
from datetime import datetime, timezone
import html as html_lib
import base64
import urllib.request
import urllib.error
import smtplib
import email.mime.multipart as mime_mp
import email.mime.text as mime_text
import email.mime.base as mime_base
from email import encoders as email_encoders

PORT = 8088
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("IRAH_DATA_DIR") or DIRECTORY
os.makedirs(DATA_DIR, exist_ok=True)
INQUIRIES_FILE = os.path.join(DATA_DIR, "inquiries.json")
REPORTS_DIR = os.path.join(DATA_DIR, "assessment_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)
ASSESSMENT_SUBMISSIONS_FILE = os.path.join(DATA_DIR, "assessment_submissions.json")
FILE_LOCK = threading.Lock()
ADMIN_SECRET_KEY = os.environ.get("IRAH_ADMIN_KEY") or secrets.token_urlsafe(32)

PUBLIC = {"/index.html", "/styles.css", "/app.js", "/standalone.html", "/favicon.ico", "/assessment_engine_data.json"}
_HITS = {}
_HITS_LOCK = threading.Lock()

def allow(ip, limit=50, window=600):
    if os.environ.get("IRAH_DISABLE_RATE_LIMIT"):
        return True
    now = time.time()
    with _HITS_LOCK:
        h = [t for t in _HITS.get(ip, []) if now - t < window]
        if len(h) >= limit:
            _HITS[ip] = h
            return False
        h.append(now)
        _HITS[ip] = h
        return True

# Ensure inquiries and submissions files exist
with FILE_LOCK:
    if not os.path.exists(INQUIRIES_FILE):
        with open(INQUIRIES_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)
    if not os.path.exists(ASSESSMENT_SUBMISSIONS_FILE):
        with open(ASSESSMENT_SUBMISSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)

REGULATORY_PORTALS = [
    {
        "acronym": "SEBI",
        "name": "Securities and Exchange Board of India",
        "url": "https://www.sebi.gov.in/",
        "category": "regulator",
        "role": "Statutory Market Regulator"
    },
    {
        "acronym": "SEBI Investor",
        "name": "SEBI Investor Education Portal",
        "url": "https://investor.sebi.gov.in/",
        "category": "investor",
        "role": "Official Awareness Portal"
    },
    {
        "acronym": "SEBI Calculators",
        "name": "SEBI Investor Education Calculators",
        "url": "https://investor.sebi.gov.in/calculators/index.html",
        "category": "calculators",
        "role": "Financial Simulation Tools"
    },
    {
        "acronym": "AMFI",
        "name": "Association of Mutual Funds in India",
        "url": "https://www.amfiindia.com/",
        "category": "association",
        "role": "Mutual Funds Trade Body"
    },
    {
        "acronym": "AMFI Distributor",
        "name": "AMFI Distributor Corner",
        "url": "https://www.amfiindia.com/distributor",
        "category": "association",
        "role": "ARN Guidelines & Circulars"
    },
    {
        "acronym": "AMFI Verification",
        "name": "AMFI Locate & Verify Distributor",
        "url": "https://www.amfiindia.com/locate-distributor",
        "category": "association",
        "role": "ARN Registry Verification"
    },
    {
        "acronym": "APMI",
        "name": "Association of Portfolio Managers in India",
        "url": "https://apmiindia.org/",
        "category": "association",
        "role": "PMS Industry Association"
    },
    {
        "acronym": "IRDAI",
        "name": "Insurance Regulatory and Development Authority of India",
        "url": "https://irdai.gov.in/",
        "category": "regulator",
        "role": "Insurance Statutory Regulator"
    },
    {
        "acronym": "PFRDA",
        "name": "Pension Fund Regulatory and Development Authority",
        "url": "https://www.pfrda.org.in/",
        "category": "regulator",
        "role": "NPS & Pension Statutory Regulator"
    },
    {
        "acronym": "SCORES 2.0",
        "name": "SEBI Complaints Redress System",
        "url": "https://scores.sebi.gov.in/",
        "category": "redressal",
        "role": "Online Grievance Redressal"
    },
    {
        "acronym": "SMART ODR",
        "name": "Securities Market Online Dispute Resolution Portal",
        "url": "https://smartodr.in/",
        "category": "redressal",
        "role": "Online Arbitration & Conciliation"
    },
    {
        "acronym": "Bima Bharosa",
        "name": "IRDAI Grievance Redressal Portal",
        "url": "https://bimabharosa.irdai.gov.in/",
        "category": "redressal",
        "role": "Insurance Policyholder Redressal"
    },
    {
        "acronym": "RBI Retail Direct",
        "name": "Reserve Bank of India Retail Direct",
        "url": "https://rbiretaildirect.org.in/",
        "category": "bonds",
        "role": "Sovereign G-Sec & SGB Platform"
    },
    {
        "acronym": "RBI",
        "name": "Reserve Bank of India",
        "url": "https://www.rbi.org.in/",
        "category": "regulator",
        "role": "Central Bank of India"
    },
    {
        "acronym": "MF Central",
        "name": "MFCentral (CAMS & KFintech Platform)",
        "url": "https://www.mfcentral.com/",
        "category": "association",
        "role": "SEBI-Mandated Mutual Fund Service Portal"
    },
    {
        "acronym": "NSE",
        "name": "National Stock Exchange of India",
        "url": "https://www.nseindia.com/",
        "category": "market",
        "role": "Exchange & NMF II Platform"
    }
]

def sanitize_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    # Strip HTML tags and control chars
    clean = re.sub(r'<[^>]*?>', '', text)
    clean = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', clean)
    return clean.strip()[:1000]

def get_iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()

IRAH_EMAIL = "harikant.irah@gmail.com"

def _report_to() -> str:
    """Where reports are emailed. Defaults to the IRAH desk; IRAH_REPORT_TO overrides it."""
    v = os.environ.get("IRAH_REPORT_TO", "").strip()
    return v if re.fullmatch(r"[^@\s<>,;]+@[^@\s<>,;]+\.[^@\s<>,;]+", v) else IRAH_EMAIL

def load_env_file(path=None):
    """Loads KEY=VALUE lines from irah.env (written by launch.bat) without overriding real environment variables."""
    path = path or os.path.join(os.path.dirname(os.path.abspath(__file__)), "irah.env")
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k, v = k.strip(), v.strip().strip('"')
                if k.startswith("IRAH_") and k not in os.environ:
                    os.environ[k] = v
    except OSError:
        pass
# Email is sent through SMTP. For Gmail, set IRAH_GMAIL_APP_PASSWORD to a 16-character
# Google "App Password" (Google Account > Security > 2-Step Verification > App passwords).
# Optional overrides (for another provider or for testing): IRAH_SMTP_HOST, IRAH_SMTP_PORT,
# IRAH_SMTP_USER, IRAH_SMTP_STARTTLS (1/0).
def _smtp_settings():
    return {
        "host": os.environ.get("IRAH_SMTP_HOST", "smtp.gmail.com"),
        "port": int(os.environ.get("IRAH_SMTP_PORT", "587")),
        "user": os.environ.get("IRAH_SMTP_USER", IRAH_EMAIL),
        "password": os.environ.get("IRAH_GMAIL_APP_PASSWORD", "").replace(" ", ""),
        "starttls": os.environ.get("IRAH_SMTP_STARTTLS", "1") != "0",
    }

def _mail_from() -> str:
    """Sender address. With IRAH_MAIL_DOMAIN (a domain verified in Resend) every
    email gets a fresh random sender, e.g. 'IRAH Reports <report-a3f9c2e1@domain>'.
    Otherwise Resend's shared test sender is used. IRAH_MAIL_FROM overrides both."""
    fixed = os.environ.get("IRAH_MAIL_FROM", "").strip()
    if fixed:
        return fixed
    domain = os.environ.get("IRAH_MAIL_DOMAIN", "").strip().lower()
    if re.fullmatch(r"[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}", domain):
        return f"IRAH Reports <report-{secrets.token_hex(4)}@{domain}>"
    return "IRAH Reports <onboarding@resend.dev>"

def _resend_settings():
    return {
        "key": os.environ.get("IRAH_RESEND_API_KEY", "").strip(),
        "url": os.environ.get("IRAH_RESEND_URL", "https://api.resend.com/emails"),
        "from": _mail_from(),
    }

def email_configured() -> bool:
    cfg = _smtp_settings()
    return bool(_resend_settings()["key"]) or bool(cfg["password"]) or bool(os.environ.get("IRAH_SMTP_HOST"))

def _num(value, default=0.0) -> float:
    try:
        v = float(value)
        return v if v == v and abs(v) != float("inf") else default
    except (TypeError, ValueError):
        return default

def _one_line(text: str, limit: int = 120) -> str:
    return re.sub(r"[\r\n\t]+", " ", str(text)).strip()[:limit]

class EmailDispatchResult(tuple):
    """
    Backwards-compatible delivery outcome: behaves as a 2-tuple (sent: bool, reason: str)
    while carrying rich telemetry attributes (.recipient, .message_id).
    """
    def __new__(cls, sent: bool, reason: str, recipient: str = "", message_id: str = ""):
        return super().__new__(cls, (sent, reason))

    def __init__(self, sent: bool, reason: str, recipient: str = "", message_id: str = ""):
        self.sent = sent
        self.reason = reason
        self.recipient = recipient or _report_to()
        self.message_id = message_id


def _report_email_html(client_name, ref_id, h_score, r_score, h_rating, r_rating):
    esc = html_lib.escape
    return f"""<html><body style="font-family:Arial,sans-serif;color:#0A1428;background:#F8FAFC;padding:24px;">
  <div style="max-width:600px;margin:auto;border:1px solid #CBD5E1;border-radius:8px;overflow:hidden;">
    <div style="background:#0A1428;padding:20px 24px;">
      <p style="color:#C5A059;font-weight:bold;font-size:13px;margin:0;">IRAH SERVICES LLP</p>
      <h2 style="color:#FFFFFF;margin:4px 0 0;">Financial Diagnostic Report Submission</h2>
    </div>
    <div style="padding:20px 24px;">
      <p><strong>Client:</strong> {esc(_one_line(client_name, 80))}</p>
      <p><strong>Reference ID:</strong> {esc(ref_id)}</p>
      <p><strong>Financial Health Score:</strong> {h_score:.1f} &mdash; <em>{esc(_one_line(h_rating, 60))}</em></p>
      <p><strong>Financial Risk Score:</strong> {r_score:.1f} &mdash; <em>{esc(_one_line(r_rating, 60))}</em></p>
      <p style="margin-top:16px;color:#64748B;font-size:12px;">
        The full diagnostic report is attached as a PDF. The client agreed to share it with IRAH.
        This is an informational diagnostic and not investment advice.
      </p>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0;">
      <p style="color:#94A3B8;font-size:11px;">
        IRAH Services LLP | LLPIN: ACU-3761 | GSTIN: 06AALFI9430M1ZW<br>
        Sector 20, Panchkula-134117, Haryana<br>
        Automated dispatch from the IRAH website.
      </p>
    </div>
  </div>
</body></html>"""


def _send_via_resend(subject, html_body, pdf_bytes, pdf_filename):
    """Sends through the Resend HTTPS API directly to _report_to(). Returns ('sent', message_id), ('sender_restricted', detail), or error."""
    cfg = _resend_settings()
    recipient = _report_to()
    payload = json.dumps({
        "from": cfg["from"],
        "to": [recipient],
        "subject": subject,
        "html": html_body,
        "attachments": [{"filename": pdf_filename, "content": base64.b64encode(pdf_bytes).decode("ascii")}],
    }).encode("utf-8")
    req = urllib.request.Request(cfg["url"], data=payload, method="POST", headers={
        "Authorization": f"Bearer {cfg['key']}",
        "Content-Type": "application/json",
        "User-Agent": "IRAH-Services/1.0",   # the API's CDN rejects Python's default user agent
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            body = json.loads(resp.read().decode("utf-8") or "{}")
        if body.get("id"):
            return "sent", body["id"]
        return "send_failed", "no message id in response"
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:300]
        low = detail.lower()
        if e.code == 403 and ("testing emails" in low or "verify a domain" in low or "own email" in low):
            return "sender_restricted", f"HTTP {e.code}: {detail}"
        return ("auth_failed" if e.code == 401 else "send_failed"), f"HTTP {e.code}: {detail}"


def dispatch_report_email(client_name, ref_id, h_score, r_score, h_rating, r_rating,
                          pdf_bytes, pdf_filename):
    """
    Emails the PDF report directly to IRAH (strictly harikant.irah@gmail.com by default). Uses Resend when
    IRAH_RESEND_API_KEY is set, otherwise SMTP (Gmail App Password or IRAH_SMTP_* overrides).
    Returns an EmailDispatchResult (unpacks as bool, str). Never raises.
    """
    target = _report_to()
    if not email_configured():
        print("[EMAIL] Not configured (set IRAH_GMAIL_APP_PASSWORD or IRAH_RESEND_API_KEY) - email not sent.", flush=True)
        return EmailDispatchResult(False, "not_configured", target)

    subject = f"[IRAH Assessment] {_one_line(client_name, 80)} - Ref: {_one_line(ref_id, 60)}"
    html_body = _report_email_html(client_name, ref_id, h_score, r_score, h_rating, r_rating)

    if _resend_settings()["key"]:
        try:
            status, detail = _send_via_resend(subject, html_body, pdf_bytes, pdf_filename)
        except Exception as e:
            print(f"[EMAIL ERROR] Resend request failed: {type(e).__name__}: {e}", flush=True)
            return EmailDispatchResult(False, "send_failed", target)

        if status == "sent":
            print(f"[EMAIL] Report sent directly to {target} via Resend (id {detail}) - Ref: {ref_id}", flush=True)
            return EmailDispatchResult(True, "sent", target, message_id=detail)

        if status == "sender_restricted":
            print(f"[EMAIL RESTRICTED] Resend free sandbox restricted sending to {target}. Delivery blocked.", flush=True)
            print(f"[EMAIL ACTIONABLE SOLUTIONS FOR {target}]:", flush=True)
            print(f"  Option A (Direct Gmail SMTP - Recommended): Set IRAH_GMAIL_APP_PASSWORD in irah.env (Google Account > Security > 2-Step Verification > App passwords) to send directly to {target} without restrictions.", flush=True)
            print("  Option B (Resend Custom Domain): Verify a custom domain at resend.com/domains and set IRAH_MAIL_DOMAIN.", flush=True)
            print(f"  Option C (Resend account): Generate a free Resend API key registered under {target}.", flush=True)
            return EmailDispatchResult(False, "sender_restricted", target)

        print(f"[EMAIL ERROR] Resend: {detail}", flush=True)
        return EmailDispatchResult(False, status, target)

    cfg = _smtp_settings()
    try:
        msg = mime_mp.MIMEMultipart("mixed")
        sender = cfg["user"] if "@" in cfg["user"] else IRAH_EMAIL
        msg["From"] = sender
        msg["To"] = target
        msg["Subject"] = subject
        msg.attach(mime_text.MIMEText(html_body, "html", "utf-8"))
        part = mime_base.MIMEBase("application", "pdf")
        part.set_payload(pdf_bytes)
        email_encoders.encode_base64(part)
        part.add_header("Content-Disposition", "attachment", filename=pdf_filename)
        msg.attach(part)

        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=25) as smtp:
            smtp.ehlo()
            if cfg["starttls"]:
                smtp.starttls()
                smtp.ehlo()
            if cfg["password"]:
                smtp.login(cfg["user"], cfg["password"])
            smtp.sendmail(sender, [target], msg.as_string())

        print(f"[EMAIL] Report sent from {sender} directly to {target} - Ref: {ref_id}", flush=True)
        return EmailDispatchResult(True, "sent", target, message_id="")
    except smtplib.SMTPAuthenticationError:
        print("[EMAIL ERROR] Gmail rejected the login. Check IRAH_GMAIL_APP_PASSWORD (it must be an App Password, not the normal password).", flush=True)
        return EmailDispatchResult(False, "auth_failed", target)
    except Exception as e:
        print(f"[EMAIL ERROR] {type(e).__name__}: {e}", flush=True)
        return EmailDispatchResult(False, "send_failed", target)

# matplotlib's pyplot is not thread-safe, so PDF builds are serialised.
PDF_LOCK = threading.Lock()

def build_report_pdf(data: dict, ref_id: str) -> bytes:
    """Imports the PDF generator lazily so a missing library cannot stop the whole site starting."""
    try:
        import assessment_pdf_generator
    except ImportError as e:
        raise RuntimeError("PDF libraries are missing. Run: py -3.11 -m pip install -r requirements.txt") from e
    with PDF_LOCK:
        return assessment_pdf_generator.build_pdf(data, ref_id=ref_id).getvalue()

def append_json_record(path: str, record: dict) -> bool:
    """Atomic, lock-protected append. A corrupt store is quarantined, never silently overwritten."""
    with FILE_LOCK:
        try:
            records = []
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        records = json.load(f)
                    if not isinstance(records, list):
                        raise ValueError("store is not a list")
                except (ValueError, UnicodeDecodeError):
                    os.replace(path, f"{path}.corrupt-{int(time.time())}")
                    records = []
            records.append(record)
            tmp = f"{path}.tmp.{os.getpid()}.{threading.get_ident()}"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2)
            os.replace(tmp, path)
            return True
        except Exception as e:
            print(f"[STORE ERROR] {path}: {e}", flush=True)
            return False


class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = 128


class IrahHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    server_version = "IRAH"
    sys_version = ""
    timeout = 10

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def list_directory(self, path):
        self.send_error(404, "Not found")
        return None

    def end_headers(self):
        # Inject Institutional Security Headers
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-XSS-Protection", "0")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'; object-src 'none'")
        self.send_header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ["/", ""]:
            self.path = "/index.html"
            path = "/index.html"

        if path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            data = {
                "status": "healthy",
                "service": "IRAH Services LLP Web Engine",
                "timestamp": get_iso_now(),
                "active_verticals": ["Financial Services", "Tourism Packages (Coming Soon)", "Financial Education Services"],
                "regulators_count": len(REGULATORY_PORTALS),
                "email_dispatch_configured": email_configured()
            }
            self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))
            return

        if path == "/api/regulators":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(REGULATORY_PORTALS, indent=2).encode("utf-8"))
            return

        if path == "/api/inquiries":
            # PII Data Protection: Check admin auth key
            auth_header = self.headers.get("X-Admin-Key", "")
            if not hmac.compare_digest(auth_header.encode("utf-8"), ADMIN_SECRET_KEY.encode("utf-8")):
                self.send_response(403)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": "Access forbidden: Confidential investor inquiries require administrative clearance."
                }).encode("utf-8"))
                return

            with FILE_LOCK:
                try:
                    with open(INQUIRIES_FILE, "r", encoding="utf-8") as f:
                        inquiries = json.load(f)
                except Exception:
                    inquiries = []

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(inquiries, indent=2).encode("utf-8"))
            return

        if path not in PUBLIC:
            self.send_error(404, "Not found")
            return

        return super().do_GET()

    def do_HEAD(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ["/", ""]:
            self.path = "/index.html"
            path = "/index.html"

        if path in ["/api/health", "/api/regulators", "/api/inquiries"]:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            return

        if path not in PUBLIC:
            self.send_error(404, "Not found")
            return

        return super().do_HEAD()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/enquire":
            if not allow(self.client_address[0]):
                self.send_error(429, "Too many requests")
                return

            try:
                content_length = int(self.headers.get("Content-Length", 0))
            except ValueError:
                self.send_error(400, "Bad Request: Invalid Content-Length")
                return

            if content_length <= 0:
                self.send_error(400, "Bad Request: Empty payload")
                return

            if content_length > 16384: # 16KB safeguard
                self.send_error(413, "Payload Too Large")
                return

            try:
                body_bytes = self.rfile.read(content_length)
                body = body_bytes.decode("utf-8")
                data = json.loads(body)
            except UnicodeDecodeError:
                self.send_error(400, "Invalid encoding (UTF-8 required)")
                return
            except json.JSONDecodeError:
                self.send_error(400, "Invalid JSON payload")
                return

            # Sanitize and validate
            name = sanitize_text(data.get("name", ""))
            email = sanitize_text(data.get("email", ""))
            phone = sanitize_text(data.get("phone", ""))
            vertical = sanitize_text(data.get("vertical", "investments"))
            vertical = vertical if vertical in {"investments", "tourism", "education"} else "investments"
            message = sanitize_text(data.get("message", ""))

            if not name or len(name) < 2:
                self.send_error(400, "Name must be at least 2 characters")
                return

            email_pattern = r"^[a-zA-Z0-9_.+'-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
            if not email or not re.match(email_pattern, email):
                self.send_error(400, "Valid email address required")
                return

            clean_phone = re.sub(r'[\s\-\+]', '', phone)[-10:]
            if not re.match(r'^[6-9]\d{9}$', clean_phone):
                self.send_error(400, "Valid 10-digit Indian mobile number required")
                return

            # Generate collision-free reference ID using microsecond timestamp + random hex
            unique_token = secrets.token_hex(3).upper()
            ref_id = f"IRAH-{int(time.time() * 1000)}-{unique_token}"
            now_iso = get_iso_now()

            consent_data = data.get("consent")
            if not isinstance(consent_data, dict) or consent_data.get("given") is not True:
                self.send_error(400, "Consent is required")
                return
            consent_at = now_iso
            notice_version = sanitize_text(str(consent_data.get("notice_version", "2026-10")))[:20]

            clean_entry = {
                "id": ref_id,
                "name": name,
                "email": email,
                "phone": clean_phone,
                "vertical": vertical,
                "investmentInterest": sanitize_text(data.get("investmentInterest", "N/A")),
                "investmentBracket": sanitize_text(data.get("investmentBracket", "N/A")),
                "travelDestination": sanitize_text(data.get("travelDestination", "N/A")),
                "travelWindow": sanitize_text(data.get("travelWindow", data.get("travel_window", "N/A"))),
                "educationTopic": sanitize_text(data.get("educationTopic", "N/A")),
                "message": message,
                "consent_given": True,
                "consent_at": consent_at,
                "notice_version": notice_version,
                "received_at": now_iso
            }

            # Thread-safe atomic persistence
            saved = False
            with FILE_LOCK:
                try:
                    existing = []
                    if os.path.exists(INQUIRIES_FILE):
                        with open(INQUIRIES_FILE, "r", encoding="utf-8") as f:
                            try:
                                existing = json.load(f)
                            except json.JSONDecodeError:
                                os.replace(INQUIRIES_FILE, f"{INQUIRIES_FILE}.corrupt-{int(time.time())}")
                                existing = []
                    existing.append(clean_entry)
                    # Atomic write via temporary file
                    temp_file = f"{INQUIRIES_FILE}.tmp.{os.getpid()}.{threading.get_ident()}"
                    with open(temp_file, "w", encoding="utf-8") as f:
                        json.dump(existing, f, indent=2)
                    os.replace(temp_file, INQUIRIES_FILE)
                    saved = True
                except Exception as e:
                    print(f"Error persisting inquiry: {e}", flush=True)

            if not saved:
                self.send_error(500, "Could not record inquiry")
                return

            self.send_response(201)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            resp = {
                "status": "success",
                "message": "Inquiry received",
                "reference_id": clean_entry["id"],
                "received_at": clean_entry["received_at"]
            }
            self.wfile.write(json.dumps(resp, indent=2).encode("utf-8"))
            return


        if parsed.path == "/api/submit-assessment-report":
            if not allow(self.client_address[0], limit=40, window=300):
                self.send_error(429, "Too many requests")
                return

            try:
                content_length = int(self.headers.get("Content-Length", 0))
            except ValueError:
                self.send_error(400, "Bad Request: Invalid Content-Length")
                return
            if content_length <= 0 or content_length > 524288:  # 512KB safeguard
                self.send_error(400, "Bad Request: Invalid payload size")
                return
            try:
                data = json.loads(self.rfile.read(content_length).decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                self.send_error(400, "Invalid JSON payload")
                return

            if (not isinstance(data, dict)
                    or not isinstance(data.get("client_profile"), dict)
                    or not isinstance(data.get("health_results"), dict)
                    or not isinstance(data.get("risk_results"), dict)):
                self.send_error(400, "Invalid assessment payload")
                return

            if data.get("consent_to_share") is not True:
                self.send_error(400, "Consent to share this report with IRAH is required")
                return

            ref_id = f"IRAH-ASSESS-{int(time.time() * 1000)}-{secrets.token_hex(3).upper()}"
            raw_name = _one_line(sanitize_text(data["client_profile"].get("client_name", "")), 80) or "Client"
            clean_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", raw_name).strip("_") or "Client"

            try:
                pdf_bytes = build_report_pdf(data, ref_id)
            except RuntimeError as e:
                print(f"[ERROR] {e}", flush=True)
                self.send_error(503, "PDF engine unavailable on this server")
                return
            except Exception as e:
                print(f"[ERROR] PDF generation failed: {type(e).__name__}: {e}", flush=True)
                self.send_error(500, "Could not generate the report")
                return

            now_iso = get_iso_now()
            h_score = _num(data["health_results"].get("overall_score"))
            r_score = _num(data["risk_results"].get("overall_score"))
            h_rating = sanitize_text(str(data["health_results"].get("rating", "N/A")))
            r_rating = sanitize_text(str(data["risk_results"].get("rating", "N/A")))
            pdf_filename = f"{ref_id}_{clean_name}.pdf"

            try:
                with open(os.path.join(REPORTS_DIR, pdf_filename), "wb") as f:
                    f.write(pdf_bytes)
            except OSError as e:
                print(f"[STORE ERROR] could not save PDF: {e}", flush=True)

            delivery = dispatch_report_email(
                raw_name, ref_id, h_score, r_score, h_rating, r_rating, pdf_bytes, pdf_filename)
            email_sent = delivery.sent
            email_reason = delivery.reason
            delivered_to = delivery.recipient
            msg_id = getattr(delivery, "message_id", "")

            append_json_record(ASSESSMENT_SUBMISSIONS_FILE, {
                "id": ref_id,
                "client_name": raw_name,
                "submitted_at": now_iso,
                "target_email": _report_to(),
                "delivered_to": delivered_to if email_sent else None,
                "health_score": h_score,
                "health_rating": h_rating,
                "risk_score": r_score,
                "risk_rating": r_rating,
                "report_file": pdf_filename,
                "report_size_bytes": len(pdf_bytes),
                "consent_to_share": True,
                "email_dispatched": email_sent,
                "email_status": email_reason,
            })

            messages = {
                "sent": f"Report emailed to {_report_to()}.",
                "not_configured": "Report generated and saved, but email is not configured on this server (set IRAH_GMAIL_APP_PASSWORD or IRAH_RESEND_API_KEY), so nothing was emailed.",
                "auth_failed": "Report generated and saved, but the email service authentication failed, so nothing was emailed. Check credentials in irah.env.",
                "sender_restricted": (
                    f"Report generated and saved, but Resend free sandbox restricted delivery to {_report_to()}, so nothing was emailed. "
                    f"Actionable options: (A - Recommended) Set IRAH_GMAIL_APP_PASSWORD in irah.env for direct Gmail SMTP; "
                    f"(B) Verify custom domain on Resend; (C) Register Resend key under {_report_to()}."
                ),
                "send_failed": "Report generated and saved, but the email could not be sent (network or email service error). Nothing was emailed.",
            }
            dispatch_message = messages.get(email_reason, messages["send_failed"])

            body = {
                "status": "success",
                "reference_id": ref_id,
                "recipient": _report_to(),
                "email_dispatched": email_sent,
                "email_status": email_reason,
                "message": dispatch_message,
                "actionable_solutions": [
                    f"Option A (Direct Gmail SMTP - Recommended): Set IRAH_GMAIL_APP_PASSWORD in irah.env (Google Account > Security > 2-Step Verification > App passwords) to send directly to {_report_to()} without restrictions.",
                    "Option B (Resend Custom Domain): Verify your domain at resend.com/domains and set IRAH_MAIL_DOMAIN in irah.env.",
                    f"Option C (Resend account): Generate a free Resend API key registered under {_report_to()}."
                ] if email_reason == "sender_restricted" else None,
                "timestamp": now_iso,
                "filename": f"IRAH_Financial_Diagnostic_Report_{clean_name}.pdf",
                "pdf_base64": base64.b64encode(pdf_bytes).decode("ascii"),
            }
            if msg_id:
                body["message_id"] = msg_id
            payload = json.dumps(body).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(payload)
            return

        self.send_error(404, "Endpoint not found")

def run(port=PORT):
    for p in [port, port + 1, port + 2, 8090, 8095]:
        try:
            httpd = ThreadingHTTPServer(("127.0.0.1", p), IrahHTTPRequestHandler)
            print(f"[IRAH SERVICES LLP] Admin Secret Key: {ADMIN_SECRET_KEY}", flush=True)
            print(f"[IRAH SERVICES LLP] Web server listening at: http://127.0.0.1:{p}", flush=True)
            print(f"[IRAH SERVICES LLP] Serving Directory: {DIRECTORY}", flush=True)
            if email_configured():
                _via = ("Resend, sender " + _mail_from()) if _resend_settings()["key"] else ("SMTP, sender " + (_smtp_settings()["user"]))
                print(f"[IRAH SERVICES LLP] Report email: ENABLED via {_via} -> destination {_report_to()}", flush=True)
            else:
                print("[IRAH SERVICES LLP] Report email: NOT CONFIGURED (run launch.bat or set IRAH_GMAIL_APP_PASSWORD in irah.env)", flush=True)
            httpd.serve_forever()
            break
        except OSError as e:
            print(f"Port {p} in use, trying next port... ({e})", flush=True)

if __name__ == "__main__":
    load_env_file()
    port_arg = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run(port_arg)
