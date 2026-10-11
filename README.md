# IRAH Services LLP &mdash; Digital Platform

[![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)]()
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)]()
[![Validation](https://img.shields.io/badge/multi--agent%20validator-113%2F113%20passed-success.svg)]()
[![Regulatory](https://img.shields.io/badge/AMFI-Registered%20MFD-gold.svg)]()
[![PDF Engine](https://img.shields.io/badge/engine-ReportLab%205.0-navy.svg)]()

> **Institutional Wealth Architecture, Regulated Financial Distribution & Multi-Line Services Platform**  
> Entity: **IRAH Services LLP** | Classification: **AMFI-Registered Mutual Fund Distributor**  
> Operational Hub: **Tri-City Region (Chandigarh, Panchkula, Mohali), India**

---

## Executive Overview

The **IRAH Services LLP Digital Platform** is an enterprise-grade digital portal providing:
1. **Regulated Financial Services Distribution**: Mutual Funds, Portfolio Management Services (PMS &ge; ₹50L), Alternative Investment Funds (AIF &ge; ₹1Cr), Specialized Investment Funds (SIF &ge; ₹10L), Section 54EC Capital Gains Bonds, and Structured Notes.
2. **3-Stage Quantitative Assessment Engine**: A 54-point multidimensional diagnostic tool evaluating **Financial Health** (7 pillars) and **Financial Risk & Resilience** (6 pillars) with real-time scoring and SVG radar graphs.
3. **Publication-Grade PDF Report Generator**: Generates deterministic, 4-page executive diagnostic reports in ReportLab with 220 DPI polar spider charts and prioritized asset-class action roadmaps.
4. **Dual-Transport Report Email Engine**: Real-time automated report dispatch directly to the designated compliance desk via TLS SMTP or Resend API with instant browser fallback download.
5. **Zero-Dependency Offline Bundle (`standalone.html`)**: An inlined 394 KB single-file distribution for offline institutional consultations.

---

## Architectural Blueprint

```
IRAH Services LLP Platform
├── index.html                     # Single-Page Architecture with 15 discrete view containers
├── app.js                         # Hash Router, Dynamic Slot Mounting, 3-Stage Wizard & SVGs
├── styles.css                     # Obsidian/Navy/Gold Theme, Responsive Layout & Transitions
├── server.py                      # Multi-Threaded HTTP Server, Security Gateway, Atomic Store
├── assessment_pdf_generator.py    # ReportLab 5.0 + Matplotlib 300 DPI 4-page PDF Generator
├── assessment_engine_data.json    # 54 questions, mathematical weights & dimensional metrics
├── standalone.html                # Zero-dependency inlined offline distribution bundle (394 KB)
├── build_standalone.py            # Standalone bundler script
├── HANDOVER.md                    # Master Executive & Engineering Handover Document
├── README.md                      # Platform quickstart and architecture overview
├── launch.bat                     # One-click Windows development bootstrapper
├── requirements.txt               # Minimal production dependencies (ReportLab, Matplotlib, NumPy)
├── .gitignore                     # Git ignore rules protecting local state and keys
├── .env.example                   # Environment configuration template
│
├── docs/                          # Architectural specifications and audit records
│   ├── CONSOLIDATED_CHANGE_SPEC.md        # Consolidated change log and evolution record
│   └── HANDOVER_MASTER_SPECIFICATION.md   # Architectural master blueprint
│
└── tests/                         # Automated QA verification battery
    ├── _testenv.py                        # Sandboxed test environment bootstrapper
    ├── test_multi_agent_validator.py      # 113 automated multi-agent governance & anti-slop rules
    ├── test_assessment_e2e.py             # End-to-end PDF generation, email routing & payload checks
    ├── test_concurrency.py                # 50-thread mixed load, atomic file-locking & error recovery
    ├── test_page_order_routing.py         # 15-view navigation sequence & DOM container verification
    └── test_server_live.py                # Live HTTP security headers, sanitization & traversal tests
```

---

## Core Capabilities

### 1. 3-Stage Financial Health & Risk Assessment
* **Stage 1 (Client Demographic Calibration)**: Captures 9 baseline metrics (name, age, dependents, employment status, income bracket, primary goals).
* **Stage 2 (54-Question Quantitative Questionnaire)**:
  * **Pillar I (Financial Health - 7 Dimensions | 29 Questions)**: Personal Profile (10%), Income Health (20%), Expense Management (20%), Savings & Liquidity (20%), Debt Management (15%), Investment & Wealth (10%), Protection & Future Planning (5%).
  * **Pillar II (Financial Risk - 6 Dimensions | 25 Questions)**: Household Profile (15%), Income & Employment Risk (20%), Liquidity Risk (20%), Debt & Credit Risk (20%), Investment Risk (15%), Protection Risk (10%).
* **Stage 3 (Results Dashboard & PDF Action)**: Dynamic SVG spider graphs, dimensional score matrices, and one-click report generation.

### 2. Deterministic 4-Page PDF Diagnostic Report
* **Page 1**: Executive Cover, Client Metadata, Composite Dual Score Cards, Diagnostic Synthesis, Strengths vs. Vulnerability Snapshot.
* **Page 2**: Pillar I Financial Health polar radar chart (220 DPI) + 7-category breakdown table with weights, scores, and bands.
* **Page 3**: Pillar II Financial Risk polar radar chart (220 DPI) + 6-category breakdown table with weights, scores, and exposure standings.
* **Page 4**: Prioritized Action Plan Matrix (ranking, focus area, implementation step, target asset classes, target horizon) + AMFI statutory disclaimers.

### 3. Regulatory Portal Directory
Comprehensive compliance links integrated directly into the footer:
* **SEBI**: [sebi.gov.in](https://www.sebi.gov.in/) | [investor.sebi.gov.in](https://investor.sebi.gov.in/)
* **AMFI**: [amfiindia.com](https://www.amfiindia.com/) | [locate-distributor](https://www.amfiindia.com/locate-distributor)
* **Investor Redressal**: [scores.sebi.gov.in](https://scores.sebi.gov.in/) | [smartodr.in](https://smartodr.in/)

---

## Getting Started

### Prerequisites
* **Python 3.11+** installed on your system.

### Installation & Launch
```bash
# Clone the repository
git clone https://github.com/LakshyaPrasher/irah-services-platform.git
cd irah-services-platform

# Install minimal dependencies (for PDF engine)
py -3.11 -m pip install -r requirements.txt

# Launch the server
py -3.11 server.py 8088
```
Navigate to **`http://127.0.0.1:8088`** in your browser.

Alternatively, double-click **`launch.bat`** on Windows for automated environment setup and launch.

---

## Configuration (`irah.env`)

Create `irah.env` by copying `.env.example`:
```env
# Primary recipient for financial diagnostic reports
IRAH_REPORT_TO=destination_email@example.com

# Direct Gmail SMTP Configuration (Recommended)
IRAH_SMTP_USER=your_sender_account@gmail.com
IRAH_GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Resend API (Alternative Cloud Path)
IRAH_RESEND_API_KEY=re_your_api_key_here
```

---

## Verification & Automated Test Suites

Run the complete 5-suite verification battery:
```bash
# 1. Multi-Agent Governance & Content Integrity Audit (113 checks)
py -3.11 tests/test_multi_agent_validator.py

# 2. End-to-End Assessment Engine & Email Dispatch
py -3.11 tests/test_assessment_e2e.py

# 3. High-Load Concurrency & Thread-Safety (50 threads)
py -3.11 tests/test_concurrency.py

# 4. Page Ordering & Route Sequence Verification
py -3.11 tests/test_page_order_routing.py

# 5. Live Server Security & Gateway Audit
py -3.11 tests/test_server_live.py

# Recompile offline standalone bundle
py -3.11 build_standalone.py
```

---

## Statutory Disclosures & Compliance

* **Entity**: IRAH Services LLP (Registered with Ministry of Corporate Affairs, India).
* **Intermediary Status**: AMFI-Registered Mutual Fund Distributor (ARN registration in process of allotment by AMFI India).
* **Scope**: IRAH Services LLP facilitates distribution of regulated financial products and provides financial planning orientation tools. We do not provide investment advisory services under SEBI (Investment Advisers) Regulations, 2013, nor manage discretionary portfolios. Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing.

---

&copy; 2026 IRAH Services LLP. All rights reserved.
