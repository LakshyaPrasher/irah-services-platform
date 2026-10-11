# IRAH SERVICES LLP — DIGITAL PLATFORM HANDOVER DOCUMENT
**Executive Engineering, Compliance & Operational Handover Specification**
*Prepared for IRAH Services LLP Leadership & Engineering Operations*
*Platform Version:* `1.0.0 (Production Release)` | *Target Repository:* `LakshyaPrasher/irah-services-platform`

---

## 1. Executive Summary & Corporate Identity

**IRAH Services LLP** is a multi-line services platform providing institutional-grade financial services distribution, objective wealth clarity, financial literacy, and curated lifestyle journeys.

The platform is designed to provide seamless digital onboarding, interactive goal planning, and a proprietary **3-Stage Quantitative Financial Health & Risk Assessment Engine** with automated publication-grade PDF diagnostic report generation and secure email delivery.

### 1.1 Statutory & Corporate Registration Credentials
* **Entity Legal Name:** IRAH Services LLP
* **Regulatory Classification:** AMFI-Registered Mutual Fund Distributor (ARN Distribution Channel)
* **Registration & Statutory Records:** Officially registered with the Ministry of Corporate Affairs (MCA), Income Tax Department & GSTN (statutory credentials maintained securely in corporate repository and local deployment environment)
* **Operational Presence:** Tri-City Region (Chandigarh, Panchkula, Mohali), India
* **Primary Compliance & Dispatch Desk:** Configured dynamically via `irah.env`
* **Corporate Support Channels:** Managed via dedicated institutional relationship desks

### 1.2 Multi-Line Brand Verticals
1. **Financial Services (Flagship Commercial Vertical):** Regulated distribution of Mutual Funds, Portfolio Management Services (PMS, ₹50L+), Alternative Investment Funds (AIF, ₹1Cr+), Specialized Investment Funds (SIF, ₹10L+), Section 54EC Capital Gains Bonds, and Structured Notes.
2. **Financial Education Services:** Structured curriculum for young minds, students, and family offices focusing on budgeting, compounding, debt discipline, and intergenerational wealth preservation.
3. **Tourism Packages (Preview Vertical):** Curated bespoke domestic, international, and spiritual travel journeys (currently designated as an institutional preview with priority waitlist).

---

## 2. Platform Architecture & Clean Directory Layout

The repository is organized for simplicity, zero-dependency reliability, and maintainability:

```text
irah-services-platform/
├── index.html                     # Production Single-Page Application (SPA) entry point
├── app.js                         # Core frontend controller, router, calculations & assessment wizard
├── styles.css                     # Institutional obsidian/gold design system & responsive layout
├── server.py                      # Multi-threaded Python HTTP server, security gateway & email dispatcher
├── assessment_pdf_generator.py    # ReportLab 5.0 + Matplotlib publication-grade 4-page PDF engine
├── assessment_engine_data.json    # Complete 54-question diagnostic framework & scoring model
├── standalone.html                # Zero-dependency offline distribution bundle (394 KB)
├── build_standalone.py            # Bundler script compiling HTML, CSS, and JS into single file
├── HANDOVER.md                    # This master executive handover document
├── README.md                      # Developer quickstart and architecture summary
├── launch.bat                     # Windows one-click desktop launcher
├── requirements.txt               # Production Python dependencies (ReportLab, Matplotlib, NumPy)
├── .gitignore                     # Git ignore rules protecting local state and keys
├── .env.example                   # Deployment environment configuration template
├── docs/                          # Architectural specifications and audit logs
│   ├── CONSOLIDATED_CHANGE_SPEC.md        # Consolidated change record and evolution logs
│   └── HANDOVER_MASTER_SPECIFICATION.md   # Architectural master blueprint
└── tests/                         # Automated test and verification battery
    ├── _testenv.py                        # Sandboxed test environment bootstrapper
    ├── test_multi_agent_validator.py      # 6-agent, 113-rule compliance and security audit suite
    ├── test_assessment_e2e.py             # End-to-end report generation & email dispatch test
    ├── test_concurrency.py                # Multi-threaded stress test & race condition auditor
    ├── test_page_order_routing.py         # Navigation sequence and DOM integrity test
    └── test_server_live.py                # Live HTTP status, security headers & MIME test
```

---

## 3. Core Technical Components

### 3.1 Frontend Single-Page Application (`index.html`, `app.js`, `styles.css`)
* **Hash-Based Router:** Clean, zero-flicker routing between 15 discrete view containers (`#/`, `#/about`, `#/business-lines`, `#/financial-services`, `#/resources`, `#/self-assessment`, `#/contact`, `#/privacy`, `#/terms`, `#/regulatory-disclosures`, `#/statutory-risk`, `#/grievance-redressal`, `#/investor-charter`, `#/tourism`, `#/financial-education`).
* **Dynamic Slot Mounting:** Single-source DOM injection pattern for calculators (`#calc-slot-resources` and `#calc-slot-self-assessment`) and contact forms (`#contact-slot-inquiry` and `#contact-slot-standalone`), ensuring zero code duplication.
* **Interactive Financial Calculators:**
  * SIP Wealth Creator (Compound growth with annual step-up)
  * Lumpsum Investment Forecaster
  * Goal-Based Retirement Corpus Planner
  * Delay Cost Analyzer (Quantifying the financial penalty of delaying investments)
  * Inflation Impact Visualizer
* **Obsidian & Gold Design Language:** High-contrast institutional dark theme utilizing deep navy (`#0A1428`, `#11203C`), muted gold accents (`#C5A059`), and crisp typographic hierarchy (Inter/system-ui) without gimmicky pulsing animations.

### 3.2 3-Stage Quantitative Assessment Engine
* **Stage 1 (Client Demographic Profiling):** Captures essential client context (Name, Age, Household Size, Dependents, Work Status, Primary Income Source, Annual Income Band, Main Financial Goal).
* **Stage 2 (Quantitative Questionnaire):** 54 questions evaluated across two distinct pillars:
  * **Pillar I — Financial Health (7 Dimensions | 29 Questions | 100% Total Weight):**
    1. *Personal Financial Profile* (10% weight)
    2. *Income Health* (20% weight)
    3. *Expense Management* (20% weight)
    4. *Savings & Liquidity* (20% weight)
    5. *Debt Management* (15% weight)
    6. *Investment & Wealth Creation* (10% weight)
    7. *Protection & Future Planning* (5% weight)
  * **Pillar II — Financial Risk & Resilience (6 Dimensions | 25 Questions | 100% Total Weight):**
    1. *Personal & Household Profile* (15% weight)
    2. *Income & Employment Risk* (20% weight)
    3. *Liquidity Risk* (20% weight)
    4. *Debt & Credit Risk* (20% weight)
    5. *Investment Risk* (15% weight)
    6. *Protection & Financial Planning* (10% weight)
* **Scoring Algorithm:**
  $$\text{Normalized Section Score} = \left( \frac{\sum \text{Question Points}}{\text{Max Section Points}} \right) \times 100$$
  $$\text{Composite Pillar Score} = \sum (\text{Normalized Section Score} \times \text{Category Weight})$$
  * **Rating Bands:**
    * `80.0 – 100.0`: **Strong** (Health) / **Low Risk** (Risk)
    * `60.0 – 79.9`: **Stable** (Health) / **Moderate Risk** (Risk)
    * `40.0 – 59.9`: **Vulnerable** (Health) / **High Risk** (Risk)
    * `0.0 – 39.9`: **Critical** (Health) / **Severe Risk** (Risk)
* **Stage 3 (Interactive Dashboard):** Client summary card, dual SVG spider (radar) charts, tabular category scores, and prioritized action plan.

### 3.3 Publication-Grade PDF Engine (`assessment_pdf_generator.py`)
Generates an executive 4-page A4 PDF diagnostic report using ReportLab 5.0 and Matplotlib:
* **Page 1 — Executive Cover & Composite Diagnostic:** Client metadata, composite Health & Risk scores, substantive interpretive synthesis, top financial strengths, and priority vulnerability flags.
* **Page 2 — Pillar I: Financial Health Dimension Analysis:** Brand-styled polar radar chart (obsidian face, gold polygonal boundary, radial grids), 7-dimension breakdown table (weights, raw scores, normalized percentages, rating bands), and analytical commentary.
* **Page 3 — Pillar II: Financial Risk & Resilience Analysis:** High-resolution coral polar radar chart, 6-dimension risk breakdown table, and resilience commentary.
* **Page 4 — Prioritized Strategic Action Plan & Statutory Disclosures:** 6-point prioritized implementation matrix synthesized directly from the client's lowest-scoring categories (Area, Concrete Recommended Action, Asset Class / Instrument, Time Horizon, Status), followed by complete statutory AMFI MFD disclosures and institutional credentials.

### 3.4 Dual-Transport Email Gateway (`server.py`)
* **Strict Target Recipient:** Designated compliance desk (defaults to configured destination in `irah.env`)
* **Transport A (Direct Gmail SMTP over TLS — Recommended):** Connects to `smtp.gmail.com:587` using any sender Gmail account with a standard Google App Password (`IRAH_GMAIL_APP_PASSWORD`). Sends directly to the designated compliance desk with the PDF report attached, with zero recipient restrictions or third-party limits.
* **Transport B (Resend REST API):** Uses `api.resend.com/emails` with Bearer token authentication (`IRAH_RESEND_API_KEY`). If running under an unverified sandbox that blocks external recipients, the system outputs clear actionable guidance.
* **Immediate Local Download:** The browser receives the PDF immediately as a base64 payload for one-click local saving, while server-side email dispatch proceeds in parallel. Submissions are atomically recorded in `assessment_submissions.json`.

---

## 4. Security, Concurrency & Compliance Guardrails

1. **Security Headers:** Every HTTP response includes `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
2. **Input Sanitization:** Multi-pass XSS neutralization, strict length clamps, HTML entity escaping, and JSON payload schema validation.
3. **Thread Safety & Data Integrity:**
   * Global thread locks (`FILE_LOCK`, `PDF_LOCK`) ensure zero race conditions on concurrent inquiries or simultaneous PDF generation requests.
   * Atomic file writes quarantine damaged files rather than corrupting existing audit records.
4. **Rate Limiting:** Sliding-window IP rate limiter protects `/api/inquire` and `/api/submit-assessment-report` from automated brute-force attacks.
5. **Statutory Compliance Separation:** Clear structural distinction between distributed third-party schemes (AMCs, PMS, AIFs) and company operations. Zero misrepresentation as an investment adviser or portfolio manager.

---

## 5. Verification & Testing Battery

The repository includes a comprehensive automated QA test suite. All tests pass with 100% compliance:

| Test Suite | Purpose | Execution Command | Result |
| :--- | :--- | :--- | :--- |
| **Multi-Agent Validator** | 113 statutory, mathematical, security & anti-slop rules across 6 specialized audit agents | `py -3.11 tests/test_multi_agent_validator.py` | **113/113 PASSED** |
| **Assessment E2E Suite** | Validates PDF generation, payload schemas, consent enforcement, SMTP & Resend dispatch | `py -3.11 tests/test_assessment_e2e.py` | **ALL PASSED** |
| **Concurrency Suite** | Multi-threaded race condition stress test with simulated simultaneous client bursts | `py -3.11 tests/test_concurrency.py` | **ALL PASSED** |
| **Page Order & Routing** | Validates DOM ordering, hash routing sequence, and dynamic container mounting | `py -3.11 tests/test_page_order_routing.py` | **ALL PASSED** |
| **Live Server Suite** | Verifies HTTP status codes, security headers, MIME types, and static asset delivery | `py -3.11 tests/test_server_live.py` | **ALL PASSED** |

---

## 6. Deployment & Quickstart Operations

### 6.1 Prerequisites
* Python 3.11+ installed on the host system.
* Standard dependencies installed via:
  ```bash
  py -3.11 -m pip install -r requirements.txt
  ```

### 6.2 One-Click Windows Launch
Double-click `launch.bat` in the repository root.
* Automatically verifies Python 3.11 and dependencies.
* Guides the operator through one-time Gmail App Password setup if not already configured.
* Frees port 8088 if previously occupied.
* Launches the multi-threaded HTTP server and opens `http://127.0.0.1:8088` in the default browser.

### 6.3 Manual Server Launch
```bash
py -3.11 server.py 8088
```

### 6.4 Offline Standalone Distribution
To generate or update the zero-dependency single-file bundle:
```bash
py -3.11 build_standalone.py
```
Open `standalone.html` directly in any web browser without needing a web server or active Internet connection.

### 6.5 Production Email Configuration (`irah.env`)
Create an `irah.env` file in the root directory:
```ini
# Direct Gmail SMTP (Recommended - Zero Restrictions)
IRAH_SMTP_USER=your_sender_account@gmail.com
IRAH_GMAIL_APP_PASSWORD=your_16_char_google_app_password

# Or Resend API Key
# IRAH_RESEND_API_KEY=re_your_api_key_here

# Target Delivery Address (Defaults to designated compliance desk)
IRAH_REPORT_RECIPIENT=your_compliance_desk@domain.com
```

---

## 7. Operational Contact & Handover Sign-Off

* **Platform Custodian:** IRAH Services LLP Executive Team & Engineering Operations
* **Primary Compliance Oversight:** Designated Compliance Officer (contact details configured in `irah.env`)
* **Repository:** `https://github.com/LakshyaPrasher/irah-services-platform`
* **Release Status:** Complete, Verified, Production Ready.
