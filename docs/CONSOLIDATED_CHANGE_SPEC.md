# IRAH Services LLP: Consolidated Change Specification

Target codebase: `irah-services-platform` (index.html, styles.css, app.js, server.py, tests, build_standalone.py).
Baseline: 92/92 checks pass (`py -3.11 test_multi_agent_validator.py`). Nothing has been changed yet. This is a spec to implement.

## 0. How to use this document
1. Apply Part A (decisions), then Part B (order of work), then the detailed findings in Parts C to F. Each finding has a file and line reference and an exact old to new fix. Line numbers refer to the current files and will drift as you edit, so match on text.
2. The fixes were written by four audit agents. They are proposals: adapt where the code differs, skip anything wrong.
3. After all edits: run the 92-check validator, then `python build_standalone.py` to rebuild `standalone.html` (the tests also scan it), then re-run the validator. Finish with a visual check at 1280, 1024, 768 and 390px (no horizontal overflow).
4. Never break these literal strings/ids the validator asserts: "COMING SOON", "AMFI-Registered Mutual Fund Distributor", "Digital Personal Data Protection (DPDP) Act, 2023", "X-XSS-Protection" (set to "0"), "ADMIN_SECRET_KEY", "403", Level 1/2/3 grievance labels, wealth@irahservices.com, the Rs 50 Lakhs / Rs 1 Crore strings, the 14 route ids, the 16 calculator inputs, sanitizeHTML, mountDynamicComponents, the IRAH-*-* token format, localStorage key `irah_inquiries`, and the footer `.footer-reg-status-chip` with `white-space: nowrap`. Before changing any phrase, grep the validator for it.

## A. Decisions already made
1. Owner-supplied identifiers are NOT in the handover: phone numbers, toll-free number, office address ("Platina Tower", four variants), the blank "LLPIN:" label, Compliance Officer name, and whether IRAH distributes Regular plans only. Do not invent values. Leave them and list them as OWNER INPUT NEEDED. Do remove contradictory hours/turnaround claims.
2. Guardrails override the handover's own wording:
   - No return figures, coupons or "capital protected" claims for structured notes (use a qualitative risk table).
   - No advisory or suitability language ("Recommended", "Ideal for", prescriptive allocation splits, "Advisory Notice", "outperform").
   - SIF is SEBI's "Specialised Investment Fund" (a mutual-fund category, Rs 10 lakh minimum), not "Specialized Investment Framework". Counsel should confirm.
   - Grievance turnaround times are exactly L1 48 working hours and L2 7 working days. Remove all other SLA claims ("24h / 14 days", "24-48 Business Hours").
   - ARN wording everywhere: "AMFI-Registered Mutual Fund Distributor" plus "ARN registration in process with AMFI India". Never a numeric or placeholder ARN. Remove "Authorized to distribute across all AMCs" wherever it implies a live ARN.
3. No new waitlist modal. Tourism CTAs link to #/contact with `data-prefill-vertical="tourism"`. JS preselects the Tourism vertical and reveals the travel fields. The tourism page states plainly that no bookings or payments are taken. Use "Late 2026" consistently (it is currently Q4 2026).
4. Router: `#/home` and unknown hashes normalise to `#/home`. Retirement model: post-retirement inflation fixed at 6%, post-retirement yield 8%, life expectancy 85 (handover 5.3). The inflation slider affects only pre-retirement and the inflation tool.
5. CSP: `script-src 'self'` only. No inline JS anywhere (move the inline onclick at index.html ~2545 to `id="receipt-ack-btn"` and bind it in app.js). `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `font-src https://fonts.gstatic.com`.

## B. Cross-file interface (exact names)
- Skip link: JS injects `<button type="button" class="skip-link">Skip to main content</button>` as first child of body. It must be a button, because an `<a href="#main">` would hit the router's unknown-hash fallback. Click focuses the active `main.page-view-container` (JS sets tabindex="-1").
- Route announcer: JS injects `<div id="route-announcer" class="sr-only" role="status" aria-live="polite">`. CSS defines `.sr-only`.
- Receipt modal: JS adds `<button type="button" class="btn-copy-ref">Copy reference</button>` (clipboard API with textarea fallback; shows "Copied" for 2s). JS adds `<p class="receipt-status receipt-status--delivered|receipt-status--local" role="status">`. The "routed to our relationship desk" text appears only if the POST succeeded; otherwise "saved on this device only, not yet received by IRAH, email wealth@irahservices.com" plus the reference.
- Form validation: JS toggles `.is-invalid` and `aria-invalid="true"` and writes `<span class="field-error" role="alert">` linked by aria-describedby. CSS styles both.
- Consent block (HTML): keep `#form-consent` (required, unticked). Add `<p class="consent-notice" id="consent-notice">` with purpose, link to the privacy notice and a withdrawal email route. Set `aria-describedby="consent-notice"` on the checkbox. JS sends consent flag and notice version in the payload. Server stores flag, timestamp and version.
- Travel window: add `id="form-travel-window"` to "Target Travel Window" with a matching label `for`. JS sends it as `travel_window`.
- Calculators: HTML aligns slider and number-input min/max/step (all 16 pairs, ids unchanged). JS clamps and rewrites the number box on `change`.
- Insight cards: HTML adds `tabindex="0" role="button"` and an aria-label. JS handles Enter and Space.
- Wide tables: wrap in `<div class="table-scroll" role="region" aria-label="..." tabindex="0">`. CSS `.table-scroll{overflow-x:auto}`.
- Repository view: add NSE India and SEBI Calculators cards so all 15 handover portals exist. Filter pills get `aria-pressed`, the search input gets a label, and add `<p id="repo-empty" class="repo-empty" hidden>`.
- CSS-only: see Part E.

## C. Order of work
1. **P0 (do first):** server exposure (C-01 compliance), structured-notes claims, receipt "delivered" lie, AMFI wording at 11 touchpoints, contact SLA contradictions, advisory language.
2. **P1:** DPDP consent block, product-panel disclaimers, SIF/54EC/SGB/MF/PMS/AIF factual fixes, calculator range sync, modal focus trap, insight-card keyboard access, mobile menu, mobile overflow, touch targets, reduced motion, skip link, tabs a11y, security headers and rate limiting.
3. **P2:** everything else.

## D. Owner input needed (do not invent)
Registered office address (one canonical version), phone and toll-free numbers with one set of hours, the LLPIN value (or remove the label), Compliance Officer name, Regular-only vs Direct plan stance, counsel sign-off on the investor-charter wording and the commission-disclosure circular citation (compliance C-10), and the AMFI ARN once allotted (then update the 11 touchpoints and server.py).

## E. Handover gaps found (spec says X, code does Y)
- `#/home` is not a real route in the code. Copy-to-clipboard is missing. The travel-window field is never captured. Not all 16 slider and number pairs stay in sync. The 44px touch-target rule is not met.
- The repository view has 14 cards, not 15 (NSE India missing everywhere, SEBI Calculators only on Home).
- Waitlist modal, downloadable forms and regulatory-updates content are described but not built (resolved by decision 3 and by removing dangling promises).
- The handover's own "Specialized Investment Framework" name and "downside capital protection" wording conflict with SEBI terminology and the no-claims guardrail.
- Handover section 6 says a "12 link" footer card (present and correct) while section 3.6 lists 15 portals (see repository fix).

---
# DETAILED FINDINGS
Each section below is a raw audit report with exact fixes. IDs are unique per report.


## REPORT: COMPLIANCE

# COMPLIANCE & SECURITY audit (gaps only). Line numbers = WORK/index.html unless stated.
Suite note: validator is string-presence only. Keep literal strings "AMFI-Registered Mutual Fund Distributor", "Digital Personal Data Protection (DPDP) Act, 2023", "X-XSS-Protection", "ADMIN_SECRET_KEY", "403", "FILE_LOCK", "os.replace" in the files.

## P0
**C-01 server.py serves its own PII file, source and default admin key without auth (verified live on a /tmp copy).**
`do_GET` falls through to `SimpleHTTPRequestHandler` for every other path (server.py:233): `GET /inquiries.json` -> 200, `GET /server.py` -> 200 (contains `IRAH-SECURE-KEY-2026`), `GET /sub/` -> directory listing, `HEAD` likewise. The `/api/inquiries` gate (208-218) is bypassed entirely. Path traversal itself is blocked (`/../..`, `%2e%2e` -> 404).
Fix: add before line 233 (and mirror in `do_HEAD`):
```python
PUBLIC = {"/index.html","/styles.css","/app.js","/standalone.html","/favicon.ico"}
def list_directory(self, path): self.send_error(404); return None
# in do_GET and do_HEAD, replace the final `return super().do_GET()` with:
if path not in PUBLIC: self.send_error(404, "Not found"); return
return super().do_GET()
```
Defence in depth: move `INQUIRIES_FILE` outside DIRECTORY (`IRAH_DATA_DIR`, dir 0700, file `os.chmod(...,0o600)`); then change test_server_live.py:115 to `server.INQUIRIES_FILE`.

**C-02 Return / protection claims on structured products (guardrail 5, 2).** Lines 408 "Capital Protection", 409 "Predictable Yield", 436 "Capital Protected", 440 "principal backing", 1468 "capital-protected structured notes", 1682 "principal protection", 1699-1717: "100% Principal Protection + 50-70% of Index Upside", "up to 18% p.a. cap", "9.50%-11.25% fixed annualized coupon", "1.25x Asset Cover". None is in the handover; all are ungrounded payoff/return figures, and "protected" contradicts the same panel's counterparty-credit-risk note (1724).
Fix: 408 "Capital Protection"->"Fixed Income"; 409 "Predictable Yield"->"Coupon Instruments"; 436 "Capital Protected"->"Market-Linked"; 440/1682 "fixed income principal backing / principal protection"->"issuer-defined redemption terms (subject to issuer credit risk)"; 1468 "capital-protected structured notes"->"market-linked structured notes"; 1699 "Principal Protected MLD"->"Equity-Linked MLD"; 1702 payoff->"Per issuer term sheet; redemption depends on issuer credit quality"; 1709 "Enhanced upside participation up to 18% p.a. cap"->"Participation and cap as set in issuer term sheet"; 1716 "9.50%-11.25% fixed annualized coupon paid quarterly"->"Coupon as set in issuer term sheet"; 1717 "Senior Secured Debt with 1.25x Asset Cover"->"Security and cover as disclosed in the offer document".

**C-03 Receipt modal confirms delivery that may not have happened (app.js:765-806, index.html:2538-2545).** `fetch` errors are swallowed and `resp.ok` false (400/413/404 on a static host like the planned Cloudflare Pages) falls through to the modal "Inquiry Successfully Logged ... routed to our specialized relationship desk" with a client-made `IRAH-<ts>-<rand>` reference that exists nowhere. Lead lost, client misled.
Fix in handleSubmit: `let delivered=false;` set `delivered=true` only in `if (resp.ok && data.reference_id)`; if `!delivered` call `this.showToast('We could not reach our server. Please email wealth@irahservices.com or call the desk; your details were not sent.','error'); return;` BEFORE the localStorage write and `e.target.reset()` (do not reset the form, do not show a reference).

**C-04 AMFI wording is inconsistent at all 11 touchpoints; the handover sentence appears at none verbatim.**
Count confirmed = 11 (185, 236, 464, 1365, 1390, 1540, 1648, 1989, 2554, 2579, 2654). Unqualified "AMFI-Registered" with no "ARN in process": 185, 236, 464, 1648, 2554, 2654 (2554 and 2654 are the global aside + footer, i.e. every page). Divergent phrasing: 1365 "upon registration allotment"; 1390 "in process with AMFI"; 1989 "in process with AMFI India ... upon allotment"; 2579 "(Registration in Process)"; 1540 "under AMFI Registration Number (ARN in process of allotment..." implies a number exists. server.py has no touchpoint although handover 7/Phase 2 says it should.
Fix: canonical C = "IRAH Services LLP is an AMFI-Registered Mutual Fund Distributor (ARN registration in process of allotment by AMFI India)." Use C verbatim at 464, 1365, 1389-1390, 1989, 2554, 2654. Short form S = "AMFI-Registered Mutual Fund Distributor (ARN registration in process)" at 185 ("AMFI-Registered Distribution"->S), 236, 1648 ("acts as a registered distributor under AMFI guidelines"->"is an "+S), 2579. 1540: "distributes mutual funds under AMFI Registration Number (ARN in process of allotment by AMFI India)"->"is an AMFI-Registered Mutual Fund Distributor (ARN registration in process of allotment by AMFI India)". 1365/1390: delete "Authorized to distribute ... across all SEBI-registered AMCs" (authority claim before ARN exists).
Counsel flag: investors are told at 2364 "Verify the ARN validity of your distributor on AMFI India" and 1076/2163 send them to the AMFI locator, where IRAH will not appear. "AMFI-Registered" before ARN allotment is falsifiable on first check; handover mandates the wording, so partners should sign off or switch to "applied for AMFI registration".

**C-05 Grievance TATs contradict the handover ladder (3.5).** Grievance page badges 2407/2422 (48 Working Hours, 7 Working Days) are correct. But contact page: 2293 "Resolution SLA: Acknowledged within 24h; resolved within 14 days" (new, conflicting guarantee); 2308 "Official Response Window: 24-48 Business Hours"; 2292 assigns "Level 1 Redressal" to the compliance desk (ladder: L1 = support desk). 2425 "unresolved after 48 hours" (should be working hours). 2440 "within 30 days" is an unspecified figure.
Fix: 2292 "Level 1 Redressal, ARN Inquiries"->"Level 2 Escalation, ARN Inquiries"; 2293 -> `<strong>Escalation TAT:</strong> Within 7 Working Days`; 2308 -> `Level 1 Support: Within 48 Working Hours`; 2425 "after 48 hours"->"within 48 working hours"; 2440 "If a grievance remains unresolved within 30 days, investors can lodge"->"If a grievance remains unresolved, or you are dissatisfied with the response, you can lodge".

## P1
**C-06 DPDP gaps on the lead form and policy.** Form checkbox 1310 is correctly unticked and `required`, but: (a) bundled with a disclaimer acknowledgement (1312), (b) no purpose statement, no privacy-notice link, no withdrawal route, no retention at the point of collection, (c) consent is not captured in payload (app.js:749-759) or stored by server.py:289-301, so it cannot be demonstrated, (d) policy (2510-2518) lacks fiduciary identity, retention, withdrawal, nomination, grievance route / Data Protection Board, processors (hosting, planned Web3Forms/Formspree, Google Fonts), and has unsupported claims: "adheres strictly to ... statutory SEBI privacy guidelines" (2507), "secured with ... TLS/HTTPS" (2514; server is plain HTTP, TLS depends on deployment), "bank-grade encryption and privacy protection" (2316). The privacy policy is also item 6 under a page titled "Standard Risk Disclosures" (2464), not a standalone notice. Check commencement dates of the DPDP Rules, 2025 with counsel; design to them now.
Fix 1312 -> `I consent to IRAH Services LLP using my name, email, mobile number and the details above only to respond to this inquiry by email or phone. I have read the <a href="#/privacy-policy">Privacy Notice</a>. I can withdraw consent at any time by emailing compliance@irahservices.com.` (keep `required`, no `checked`, add `name="consent"`). Move the "investment distribution is subject to..." sentence to a plain note under the button. 2316 -> `Your details are used only to respond to your inquiry. See our Privacy Notice.` Add to payload `consent:{given:true,notice_version:'2026-10',at:new Date().toISOString()}` and persist `consent_at`,`notice_version` in clean_entry. Extend policy (inside #policy-dpdp) with list items: data fiduciary = IRAH Services LLP + registered address; data collected (name, email, mobile, interest area, allocation range, free-text note) and purpose; retention period [PARTNER INPUT]; withdrawal by email with same ease as giving consent; rights to access, correction, erasure, nomination; grievance contact compliance@..., then Data Protection Board of India; processors named; no data of children collected; browser localStorage note. Replace 2507 "and statutory SEBI privacy guidelines" -> delete; 2514 -> `Inquiry data is transmitted over HTTPS once deployed behind TLS` only after TLS is live.

**C-07 No product-level disclaimers on PMS, AIF, Bonds, MF panels.** Panels are deep-linkable (#/financial-services/pms etc.) but only SIF (1648) and Structured (1724) carry a local note; MF (1540) has credentials but no market-risk line. None carries non-custodial, non-RIA or third-party text locally (only the global footer 2654 does, and it omits non-custodial).
Fix: append to each of the 6 panels `<p class="fs-panel-disclosure">` with: PMS (after 1566): "PMS is offered by SEBI-registered Portfolio Managers; IRAH Services LLP facilitates access through distribution and referral arrangements only, is not a SEBI-registered Investment Adviser, and does not manage portfolios or give investment advice. Investments are subject to market risks, including loss of capital. Client funds and securities are held in the investor's own accounts; IRAH never receives them."; AIF (after 1592): same, with "AIFs involve high risk and illiquidity; read the Private Placement Memorandum"; Bonds (after 1675): "NCDs and bonds carry issuer credit, interest-rate and liquidity risk. 54EC bonds are issued by the named entities and are not guaranteed by IRAH. Payments go directly to the issuer / clearing platform"; MF (after 1541): "Mutual fund investments are subject to market risks, read all scheme related documents carefully. Payments are made only to the AMC or via BSE StAR MF / NSE NMF II." Add the same non-custodial sentence to footer box 2654: "Client money never passes through IRAH Services LLP; it moves only via BSE StAR MF, NSE NMF II or direct AMC banking."

**C-08 Advice / suitability / outperformance language (guardrail 2, 5).** 399 "5+ Years Recommended"; 1502 column "Recommended Horizon"; 543/552/561 "Ideal for: ..." (suitability targeting); 541 "designed to outperform inflation"; 960/1895 "Why core-satellite frameworks outperform tactically concentrated portfolios"; app.js:886 prescriptive "anchors 60%-70% ... 30%-40%"; app.js:890 label "IRAH Advisory Notice"; app.js:911 "tailored to specific risk profiles"; 1560 "Manager advises"; 1563 "Monthly audited factsheet" (unverifiable); 1632 "(Credit-Risk Free)" on a debt fund (interest-rate risk remains); 1668 "(Government Backed)" for REC/PFC/IRFC/NHAI (PSUs, not sovereign-guaranteed); 1669 "Higher coupon yields than traditional FDs"; app.js:923 "superior credit underwriting"; app.js:922 "sovereign-like security".
Fix: 399 "5+ Years Recommended"->"Typical horizon: 5+ years"; 1502 -> "Typical Horizon"; 543/552/561 "Ideal for:"->"Typically relevant to:"; 541 "designed to outperform inflation over 7-15 year horizons"->"seeking long-term growth, subject to market risk"; 960/1895 "Why core-satellite frameworks outperform tactically concentrated portfolios in shifting interest rate environments"->"How core-satellite frameworks differ from tactically concentrated portfolios"; app.js:886 "anchors 60%-70% ... 30%-40%"->"commonly combines a diversified core with a smaller satellite allocation (the split is a personal decision for the investor and their own adviser)"; app.js:890 "IRAH Advisory Notice"->"Regulatory Notice"; app.js:911 "tailored to specific risk profiles"->"as selected by the investor"; 1560 "Manager advises; investor explicitly approves every trade"->"Portfolio Manager proposes trades; investor approves each trade"; 1563 both cells->"Periodic reports as provided by the Portfolio Manager"; 1632 "Low to Moderate (Credit-Risk Free)"->"Low to Moderate (interest-rate risk applies)"; 1668 "(Government Backed)"->"(Public sector issuers)"; 1669 "Higher coupon yields than traditional FDs"->"Coupon set by issuer; carries credit risk"; app.js:922 "with sovereign-like security"->"issued by the named public sector entities"; app.js:923 "predictable coupon schedules with superior credit underwriting"->"coupon schedules as set by the issuer; credit risk applies".

**C-09 Calculators present return assumptions as expectations; 4 of 5 lack market-risk / illustrative line.** 611 "Expected Annual Return Rate (CAGR %)" default 12%, slider labels 621 "25% (High Alpha)", 698, 845 "Expected ...", 645 "Expected Future Corpus". Only SIP note (670) has "market risks". Notes at 739, 811, 871, 931 are formula-only; 574/2021/739 "Benchmarked against official SEBI ... formulas" can read as SEBI endorsement.
Fix: "Expected Annual Return Rate"->"Assumed Annual Return (illustrative, set by you)"; "Expected Future Corpus"->"Illustrative Future Corpus"; "25% (High Alpha)"->"25%"; "12% (Balanced/Eq)"->"12%"; append to 739/811/871/931: " Illustrative only, based on assumptions you set. Not a projection or advice; mutual fund investments are subject to market risks." 574/739/2021 "Benchmarked against official SEBI..."->"Formulas follow standard compounding mathematics as published in SEBI Investor Education material."

**C-10 Commission disclosure citation is unverified (2486).** "SEBI circular SEBI/IMD/CIR No. 4/168230/09" is, as far as I know, the June 2009 load-structure circular, not a commission-disclosure circular (one search was inconclusive; confirm with counsel). Also "provided ... in all investor fact sheets" asserts documents that do not exist.
Fix: "In accordance with SEBI circular SEBI/IMD/CIR No. 4/168230/09, details of scheme-level commission earned by IRAH Services LLP from various AMCs are available upon request and provided transparently in all investor fact sheets."->"Commission earned by IRAH Services LLP from AMCs on the schemes it distributes is disclosed to investors on request, in line with applicable SEBI and AMFI requirements." Same softening for 1540 "as disclosed in our regulatory transparency policies".

**C-11 "SIF" is mislabelled vs SEBI (verify with counsel; I am fairly confident).** Site/handover expand SIF as "Specialized Investment Framework" (384, 1254, 1597, form option, footer/nav labels) and list thematic/factor/target-maturity funds. SEBI's category (effective Apr 2025) is "Specialised Investment Fund", a distinct MF product with its own investor minimum (INR 10 lakh per investor across an AMC's SIF strategies). Skeptical HNIs will notice.
Fix: expand as "Specialised Investment Fund (SIF)" everywhere, state "SEBI minimum investment threshold applies" (figure after counsel check), and drop non-SIF rows (Target Maturity Debt, Factor indices) from the SIF table or rename the tab "Thematic & Specialised Schemes".

**C-12 Contact identifiers not in handover (possible fabrication).** Phones +91 (0) 22 8492 0100/0102/0104/0199 (2257-2290; 0100 also at 1199 and 2413), toll-free 1800 209 8492 (2304), "Level 12, Platina Tower, BKC" (2303; a real third-party building), hours conflict for the same number 0100: 1200 "9:30-6:00" vs 2260 "9:00-6:30"; 2578 label "LLPIN:" with no number. Registered-office claims are statutory-sensitive.
Fix: partners to supply real numbers/registered office/LLPIN; until then show only the six @irahservices.com mailboxes already used, remove toll-free and tower/floor, unify hours to one value, and 2578 -> `<strong>Entity:</strong> Limited Liability Partnership (LLP Act, 2008), India`.

**C-13 server.py headers / auth (verified).** Docstring (line 7) advertises CSP but none is sent. `Access-Control-Allow-Origin: *` on every response incl. `/api/inquiries` (170); loopback bypass `client_address in ("127.0.0.1","::1")` (211) means behind any reverse proxy (Cloudflare tunnel, nginx) every caller is "loopback" and gets PII, and any web page in the operator's browser can read it cross-origin; hard-coded default key (30); `!=` compare (211); `Server: SimpleHTTP/0.6 Python/3.13` banner; no Permissions-Policy/HSTS.
Fix (in server.py):
```python
import hmac
ADMIN_SECRET_KEY = os.environ.get("IRAH_ADMIN_KEY") or secrets.token_urlsafe(32)   # line 30
server_version = "IRAH"; sys_version = ""                                           # in handler class
# end_headers: delete the 3 Access-Control-* lines (site is same-origin); change X-XSS-Protection to "0"; add:
self.send_header("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'; object-src 'none'")
self.send_header("Permissions-Policy","geolocation=(), microphone=(), camera=()")
# /api/inquiries gate (line 211): drop the loopback clause
if not hmac.compare_digest(auth_header.encode(), ADMIN_SECRET_KEY.encode()): ...403
```
CSP prerequisite: remove the single inline handler at index.html:2545 (`onclick=...`): give the button `id="receipt-close-btn"` and bind it in app.js next to `close-receipt-modal`. Inline `style=` (203 occurrences) needs `'unsafe-inline'` in style-src. Add HSTS at the TLS terminator, not here. Print the generated key to stdout at startup.

**C-14 POST /api/enquire abuse resistance (verified).** 40 rapid POSTs -> 40x 201 (no rate limit); declared `Content-Length: 500` with 5 bytes sent leaves the thread blocked in `rfile.read` indefinitely (no socket timeout, daemon threads accumulate); every POST re-reads and rewrites the whole file under the global lock (O(n)); 100 KB cap (248) is large for a 10-field form; `vertical`/select values not allowlisted.
Fix:
```python
class IrahHTTPRequestHandler(...): timeout = 10        # socket timeout kills slow bodies
_HITS, _HITS_LOCK = {}, threading.Lock()
def allow(ip, limit=5, window=600):
    now=time.time()
    with _HITS_LOCK:
        h=[t for t in _HITS.get(ip,[]) if now-t<window]
        if len(h)>=limit: _HITS[ip]=h; return False
        h.append(now); _HITS[ip]=h; return True
# top of do_POST /api/enquire: if not allow(self.client_address[0]): self.send_error(429,"Too many requests"); return
# line 248: 100000 -> 16384
vertical = vertical if vertical in {"investments","tourism","education"} else "investments"
```
**C-15 Data-loss paths in persistence (verified).** Corrupt/partial inquiries.json -> next POST silently resets to `[]` and overwrites (test: 1 record left, history gone) (server.py:309-312). Write failure is caught and printed (319-320) but the client still gets 201 "Inquiry recorded" (322-331).
Fix: on `JSONDecodeError`, `os.replace(INQUIRIES_FILE, f"{INQUIRIES_FILE}.corrupt-{int(time.time())}")` before starting fresh; set `saved=False` in the `except` and after the lock `if not saved: self.send_error(500,"Could not record inquiry"); return`; change message at 327 "Inquiry recorded with high security protocol"->"Inquiry received".

**C-16 Statutory directory gaps vs handover 3.6.** All footer card links (12) match 3.6 and all 43 external anchors in index.html have `target="_blank" rel="noopener noreferrer"` (no defects there). Gaps: NSE India `https://www.nseindia.com/` (#15) appears nowhere (index.html, server.py REGULATORY_PORTALS); the 15-count is met only by extras (RBI Retail Direct, plus CAMS/KFintech/CDSL in index). The dedicated `#/knowledge-repository` view (2104-2236) has 14 distinct hrefs and omits SEBI Calculators (#3) and NSE. NSDL is named at 1154 with no link.
Fix: add an NSE card to the home repository (after 1154 block) and knowledge view: `<a href="https://www.nseindia.com/" target="_blank" rel="noopener noreferrer" class="reg-link-btn">nseindia.com ↗</a>` (role "Exchange / NSE NMF II"), add the SEBI Calculators card to 2104-2236 using the 1038 markup, and append to server.py REGULATORY_PORTALS `{"acronym":"NSE","name":"National Stock Exchange of India","url":"https://www.nseindia.com/","category":"market","role":"Exchange & NMF II Platform"}`.

**C-17 inquiries.json in the distributable.** WORK contains no inquiries.json (0 files), so no shipped PII, but: server.py:33-36 creates it in the web root on first run (reachable via C-01); test_server_live.py:77-79,115 appends one realistic-looking HNI record (personal-style name, corporate-domain email, Mumbai-series mobile) to the live file; test_concurrency.py:38-40 truncates the live file (would wipe real leads if run in a production folder). Handover manifest lists inquiries.json as a deliverable.
Fix: ship no inquiries.json (or exactly `[]`); add `.gitignore`/zip exclusion; make both tests set `server.INQUIRIES_FILE` to a `tempfile` path and use obviously synthetic data (`Test User`, `test@example.invalid`, `9000000000`).

## P2
**C-18** app.js:785-787 keeps full PII (name, email, phone, note) in `localStorage.irah_inquiries` forever and even after a successful server save. Fix: write only when delivery failed (as a retry queue), cap to 5, and clear on success.
**C-19** Client `sanitizeHTML` HTML-escapes before POST (app.js:750-758) and the server then regex-strips tags (150), so stored values are double-processed ("Tata & Sons" -> `Tata &amp; Sons`); regex strip misses unclosed `<img onerror=`. Fix: send raw trimmed values, store raw, escape at output (`html.escape`) and prefix `'` to cells starting `= + - @` on any CSV export.
**C-20** Google Fonts (index.html:11-13) sends visitor IPs to Google and needs disclosure in the privacy notice; self-host Inter / Plus Jakarta Sans to keep the CSP at `font-src 'self'`.
**C-21** Platform name inconsistency: 1209 says "BSE StAR MF / NSE NMF / AMC bank account" while handover 3.3 and 1379 say "NSE NMF II". Fix 1209 and 1996 "NSE NMF"->"NSE NMF II".

## Handover gaps (spec says X, code does Y)
- 3.1 canonical sentence verbatim at 11 touchpoints -> 0 verbatim, 6 unqualified (C-04); server.py has no touchpoint.
- 3.5 ladder TATs only 48 working hours / 7 working days -> contact page adds 24h/14 days and 24-48 business hours (C-05).
- 3.6 15 portals incl. NSE -> NSE absent; knowledge view omits SEBI Calculators (C-16).
- 5 manifest / 5.4 "inquiries.json" -> not shipped; server writes it into the served web root (C-01, C-17).
- Server docstring lists CSP -> none sent (C-13); validator passes because it only checks header names for four headers, and the PII gate test only checks that the strings "ADMIN_SECRET_KEY" and "403" exist, so C-01 is invisible to it.
- 1.2/guardrail 5 "no ungrounded return projections" -> structured-product payoff figures and default 12% "Expected" CAGR (C-02, C-09).
- 3.2 "no investment advice" -> "Recommended", "Ideal for", prescriptive allocation split, "Advisory Notice" (C-08).
- 5.4 DPDP/consent -> consent captured only as an in-session checkbox; no notice link, purpose, withdrawal route or stored proof (C-06).
- Handover 6 says footer card has 12 links: confirmed, no gap.

---

## REPORT: CONTENT

# CONTENT RELEVANCE AUDIT (lens: facts, dangling promises, duplication, AI-tells, depth vs handover)
Files: I=index.html, A=app.js (WORK copy). Line numbers verified. Web-checked once each: SIF Rs 10L minimum (SEBI, Feb 2025), 54EC rules, SGB issuance paused since Feb 2024.
Test-suite constraints for every fix below (grepped, not re-run): keep "AMFI-Registered Mutual Fund Distributor", "not operate as an Investment Adviser (RIA)", "SEBI-registered Portfolio Managers", "COMING SOON", "Discover More. Travel Better", "₹50 Lakhs", "₹1.00 Crore", "Level 1/2/3", "wealth@irahservices.com", "desk-cards-grid", "Terms of Use & Platform Conditions"; never write "40+", "5-star", "Turnaround Guarantee". Rebuild standalone.html after edits (tests also scan it).

## P0
**C-01 Structured Notes carry return/payoff figures and capital-guarantee language.** I:1702 "100% Principal Protection + 50–70% of Index Upside", I:1709 "up to 18% p.a. cap", I:1716 "9.50%–11.25% fixed annualized coupon", I:1717 "1.25x Asset Cover"; I:408 tag "Capital Protection", I:409 badge "Predictable Yield", I:436 badge "Capital Protected", I:1682 "principal protection". Breaches guardrail 5 (no return projections) and 2/4.
Fix (I:1679-1717): kicker "Asymmetric Payoffs" -> "Market-Linked Debentures". Desc -> "Market-Linked Debentures (MLDs) are debt securities whose redemption value is linked to a market reference such as an equity index. They are issued by SEBI-regulated issuers; IRAH facilitates access through referral arrangements and does not issue, structure or guarantee them." Replace table with columns `Structure | Reference | Tenor | Key risks`:
- Principal-protected MLD | Equity index or G-Sec benchmark | Per issuer term sheet | Protection applies only at maturity and only if the issuer pays; exit before maturity is at market price and may be below face value.
- Capped-participation MLD | Equity index | Per issuer term sheet | Upside is limited by a cap in the term sheet; issuer credit risk; limited secondary liquidity.
- Fixed-coupon debenture | Issuer credit | Per issuer term sheet | Coupon is the issuer's obligation, not guaranteed by IRAH; security and asset cover are stated in the offer document.
Home card (I:432-457): tag "Asymmetric Payoff" -> "Market-Linked Debt"; badge "Capital Protected" -> "Market-Linked"; I:445 "Nifty 50 / G-Sec Benchmarks" -> "Per term sheet"; I:449 "24 to 36 Months" -> "Per term sheet" (also contradicts the 3 different tenors in the panel); I:453 -> "SEBI-regulated issuers". I:408 -> "Fixed Income"; I:409 -> "Rated Debt".

**C-02 Advisory / suitability language contradicts the non-RIA position.**
- A:886 gives an allocation: "anchors 60%–70% in institutional core ... 30%–40% to high-conviction alpha generators such as Category II/III AIFs and thematic PMS". A:890 labels the footer "IRAH Advisory Notice". A:911 "tailored to specific risk profiles".
- I:960 and I:1895 "Why core-satellite frameworks outperform tactically concentrated portfolios" (unsupported performance claim).
- I:502 "Formulate a core-satellite asset allocation blueprint tailored to ... mandates", I:494 "Screen ... Sharpe/Sortino ratios", I:518 "rebalance allocations during market extremes" (portfolio-management behaviour). I:543/552/561 "Ideal for:" lines. I:541 "designed to outperform inflation". I:530 "Tailored Outcomes". I:1491 "Suitable for", I:1502 th "Recommended Horizon", I:399 "5+ Years Recommended", I:1880 "published by IRAH's investment desk".
Fix:
- A:886 body -> `<p>Asset allocation means dividing money across asset classes such as equity, debt and gold. Investor-education material from SEBI and AMFI describes it as a major driver of a portfolio's risk profile. How much to hold in each class depends on an individual's goals, horizon and tax position and is a matter for the investor, or for a SEBI-registered Investment Adviser if personalised advice is wanted.</p><h4>Core-satellite, described neutrally</h4><p>Some investors hold a diversified core and a smaller set of concentrated holdings. This increases complexity, cost and liquidity risk, and does not assure higher returns.</p>`. Retitle (A:880, I:958, I:1893) "Asset Allocation Concepts: A Plain-Language Primer". Excerpt (I:960, I:1895) -> "What asset allocation means, how core-satellite portfolios are described in investor-education material, and what the approach does not assure."
- A:890 "IRAH Advisory Notice:" -> "Distributor Notice:". A:911 -> "IRAH Services LLP facilitates access to SEBI-registered portfolio managers and Category I, II and III AIF managers. Choosing a product is the investor's own decision after reading its disclosure document or PPM."
- I:1491 -> "Open-architecture access to schemes of SEBI-registered AMCs, for investors who have already decided to invest in mutual funds." I:1502 -> "Indicative Holding Period". I:399 -> "Per scheme document". I:1880 -> "Explanatory notes on regulated products and investor protections, prepared by IRAH for information only. They are not research reports or investment advice." I:948 -> "Explanatory notes on products, regulation and process. Informational only; not investment advice."
- Home I:471-521: title "Our 5-Stage Investment Lifecycle" -> "How an Engagement Works"; subtitle I:477 -> "IRAH facilitates access and execution. Product choice stays with the investor." Steps: 1 Enquiry ("Tell us your area of interest. A relationship manager contacts you.") / 2 KYC and Documents ("One-time KYC and, for PMS or AIF, the manager's onboarding documents.") / 3 Your Selection ("You choose after reading the scheme or offer documents. IRAH does not recommend or select on your behalf.") / 4 Execution ("Orders go through BSE StAR MF, NSE NMF II or directly to the AMC or manager. Money moves from your bank to them, never through IRAH.") / 5 Servicing ("Statements come from the RTA or MF Central. Service requests follow the Level 1 and Level 2 grievance matrix.").
- I:526-563: kicker "Goal-Driven Solutions" -> "Products by Investor Goal"; title -> "Products Grouped by Goal"; subtitle -> "A classification of products available through IRAH by the goal an investor has already identified. It is not a recommendation." Delete the three "Ideal for" lines. Cards: Wealth Creation -> "Equity mutual funds, PMS strategies and Category II AIFs are commonly used for long-horizon goals. Returns are not assured and capital can be lost." Capital Preservation -> "Sovereign and rated corporate bonds, and Section 54EC bonds for eligible real-estate gains. Credit, interest-rate and liquidity risks apply." Regular Income -> "Systematic withdrawal plans (SWP) from mutual funds and rated debt with periodic coupons. Payouts are not assured."

**C-03 Contact page invents turnaround times that contradict the grievance matrix.** I:2293 "Acknowledged within 24h; resolved within 14 days"; I:2308 badge "Official Response Window: 24–48 Business Hours". Spec allows only L1 48 working hours / L2 7 working days. I:2292 also labels the Compliance Officer scope "Level 1 Redressal" (Grievance page I:2406 makes the support desk Level 1, I:2421 the Compliance Officer Level 2).
Fix: I:2293 -> `<strong>Escalation TAT:</strong> Level 2 response within 7 working days (see Grievance Redressal)`. I:2292 -> `Scope: Level 2 Escalation, Regulatory Disclosures, Registration Status`. I:2308 badge -> `Level 1 Grievance TAT: 48 Working Hours`.

**C-04 Contact identifiers cannot be sourced to the handover and are inconsistent.** Phones +91 22 8492 0100/0102/0104/0199 and toll-free 1800 209 8492 (I:1199, 2257, 2268, 2279, 2290, 2304, 2413); "Level 12, Platina Tower" (I:2303) vs "BKC, Financial District" (I:1185) vs "BKC Financial District" (I:2414) vs "BKC, Mumbai" (I:2580). Same number shows hours 9:30–6:00 (I:1200) and 9:00–6:30 (I:2260). I:2578 prints the label "LLPIN:" followed by prose and no number. For a due-diligence audience, an unverifiable address, phone or LLPIN is the largest trust risk on the site.
Fix: owner confirms one block (address, phone, hours, LLPIN) and it is pasted once everywhere. Until then: I:2578 -> `<strong>Constitution:</strong> Limited Liability Partnership (LLP Act, 2008)` (add LLPIN only when issued), delete I:2304 (toll-free), make I:1200 and I:2260 identical, use the same address string at I:1185, I:2303, I:2414, I:2580. Keep wealth@irahservices.com (test).

## P1
**C-05 SIF is described wrongly.** SEBI's Specialised Investment Fund is a mutual-fund category effective 1 Apr 2025, minimum Rs 10 Lakhs per investor (aggregated across a fund house's SIF strategies), allowing limited derivative short positions. The site calls it "Specialized Investment Framework" (I:384, 1594, 1393, 1254, and handover §2), shows min ticket "₹10 Lakhs – ₹25 Lakhs" (I:391; Rs 25L is wrong), and lists ordinary funds as SIF: thematic/manufacturing, multi-asset, "Target Maturity Debt (SIF)", smart-beta (I:1615-1642). About I:1372/1393 also files SIF under PMS/AIF referral tie-ups, but SIF is an AMC scheme bought under the ARN.
Fix (I:1594-1650): kicker "Specialised Investment Funds"; h2 "Specialised Investment Funds (SIF)"; desc -> "SIF is a SEBI-defined mutual fund category for investors who can invest at least ₹10 Lakhs per investor, aggregated across a fund house's SIF strategies. Schemes may take limited derivative-based short positions, which ordinary mutual fund schemes cannot." Table `Strategy family | SEBI-defined strategy names | Key risks`: Equity-oriented | Equity Long-Short; Equity Ex-Top 100 Long-Short; Sector Rotation Long-Short | Market, derivative, short-position and concentration risk. Debt-oriented | Debt Long-Short; Sectoral Debt Long-Short | Credit, interest-rate, derivative and liquidity risk. Hybrid | Hybrid Long-Short; Active Asset Allocator Long-Short | Combined equity, debt and derivative risks. Note: "Redemption terms and exposure limits are in each scheme's SID." Compliance note I:1648 -> "SIF schemes are offered by SEBI-registered AMCs. IRAH Services LLP is an AMFI-Registered Mutual Fund Distributor (ARN registration in process of allotment by AMFI India) and facilitates access only."
Home card I:378-403: title "Specialised Investment Funds (SIF)"; tag -> "SEBI-Defined Category"; badge "Strategic" -> "HNI"; I:391 -> "₹10 Lakhs per investor (SEBI)"; I:395 -> "Long-short strategies"; I:399 -> "Per scheme document". I:1480 "SIF Frameworks" -> "SIF (₹10L+)". About I:1372 and I:1393: drop SIF from the PMS/AIF referral sentence and add "Specialised Investment Funds (SIF) are mutual fund schemes distributed under the AMFI registration."

**C-06 54EC copy is incomplete and over-reassuring.** Panel I:1668 omits the 6-month window, Rs 50 Lakh cap, land/building-only scope, and non-transferability; "Government Backed" (I:1668) and "sovereign-like security" (A:922) imply a sovereign guarantee that REC/PFC/IRFC/NHAI bonds do not carry. I:1658 "predictable cash flow"; I:550 "lock in stability while generating defensive yields"; I:413 "capital stability and predictable coupon income"; I:422 shows only "5 Yr lock".
Fix: I:1668 -> `<tr><td><strong>Section 54EC Capital Gains Bonds</strong></td><td>REC, PFC, IRFC, NHAI (government-owned issuers; not sovereign-guaranteed)</td><td>Long-term capital gains on land or building are exempt to the extent invested within 6 months of the date of transfer. Cap: ₹50 Lakhs in aggregate across the financial year of transfer and the next. Interest is taxable.</td><td>5 years; cannot be transferred or pledged</td></tr>`. I:1658 -> "Fixed-income instruments, and the Section 54EC exemption for eligible long-term capital gains on land or building. Returns depend on the issuer's ability to pay; ratings can change." I:422 -> "Land/building gains · ₹50L cap · 5-yr lock". I:413 -> "Rated corporate NCDs, Section 54EC bonds (REC, PFC, IRFC, NHAI) and existing Sovereign Gold Bond series in the secondary market. Coupons are issuer obligations and are not assured." I:550 -> "Sovereign and rated corporate bonds, and Section 54EC bonds for eligible real-estate gains." A:922 -> "Section 54EC allows exemption of long-term capital gains on land or building if invested in specified bonds within 6 months of transfer, up to ₹50 Lakhs across the year of transfer and the next, with a 5-year lock-in. Confirm the corresponding section reference under the Income-tax Act, 2025 with tax counsel before citing section numbers." I:1669 NCD advantage "Higher coupon yields than traditional FDs" -> "Fixed coupon set at issue; yield varies with rating and tenor. Credit risk applies and NCDs are not deposit-insured." I:1669 issuer -> "Corporates and NBFCs rated by SEBI-registered rating agencies".

**C-07 SGB offered as if available.** I:1670, A:924, I:413, I:550. No fresh SGB tranche since Feb 2024 (government has indicated discontinuation). "2.5% annual interest + gold price appreciation" implies appreciation.
Fix I:1670 -> `<tr><td><strong>Sovereign Gold Bonds (SGB)</strong></td><td>Government of India (issued by RBI); existing series only</td><td>2.5% p.a. fixed interest; redemption value follows the gold price, which can fall. No fresh tranches since February 2024; tradeable only on stock exchanges at market price</td><td>8 years (early redemption from year 5 on interest dates)</td></tr>`. A:924 -> "<strong>Sovereign Gold Bonds (SGB):</strong> Government of India securities issued by RBI. No new tranches have been issued since February 2024; existing series trade on stock exchanges at market prices."

**C-08 Mutual Fund panel: jargon, unqualified liquidity, missing plan disclosure, phantom policy page.** I:1515-1516 "Mid & Small Cap Alpha / High-growth emerging compounders"; "T+2 Business Days" (I:1512, 1519, 1526, 1640, 1619) and "Instant redemption on liquid" (I:1533) are stated as facts, while home I:314 says "T+1 to T+2". I:1540 points to "our regulatory transparency policies", which do not exist, and never says Regular vs Direct plan (the key conflict-of-interest fact for a skeptical HNI).
Fix: I:1515 "Mid & Small Cap Equity"; I:1516 "Capital appreciation from smaller companies; higher volatility". Liquidity cells -> "Per scheme document (SEBI outer limit: 3 working days for most open-ended schemes)"; I:1533 -> "T+1 for liquid and overnight funds; instant-redemption facilities are limited and AMC-specific"; I:314 -> "Per scheme document". I:1540 -> `<strong>Distributor Credentials and Compensation:</strong> IRAH Services LLP is an AMFI-Registered Mutual Fund Distributor (ARN registration in process of allotment by AMFI India). Distributors are paid by AMCs through Regular plans, whose expense ratio includes distributor commission; Direct plans carry no distributor commission and can be bought from the AMC. IRAH charges clients no transaction or advisory fee. Scheme-level commission details are provided in writing on request.` (Compliance to confirm.)

**C-09 PMS/AIF facts and wording.** I:1563 "Monthly audited factsheet" is not a SEBI requirement (reports at least quarterly; annual audit of the manager). A:907 PMS tax "Pass-through" is wrong (securities sit in investor's own demat). I:1585-1587, I:2003, A:905 state Rs 1 Cr for every AIF with no mention of SEBI exceptions. I:327, I:1547 "Concentrated Alpha"; I:1550 "Customized, high-conviction".
Fix: I:1563 -> "Periodic client reports at least quarterly under SEBI PMS Regulations; annual audit of the portfolio manager". A:907 PMS cell -> "Investor taxed on own capital gains per trade (securities held in the investor's name)". I:2003 -> "...Alternative Investment Funds (Category I, II, III) require a minimum commitment of ₹1.00 Crore per investor under the SEBI AIF Regulations, subject to limited SEBI exceptions." I:327 and I:1547 -> "Managed Portfolios"; I:1550 -> "Portfolios managed by SEBI-registered Portfolio Managers under a discretionary or non-discretionary mandate, held in the investor's own demat account. Minimum investment is ₹50 Lakhs, as set by SEBI. Returns are not assured and capital can be lost."

**C-10 Buttons, labels and copy that promise things that do not exist.**
- I:1950 "downloadable investor charters" (no downloads) -> "the Investor Charter, and frequently asked questions".
- I:2486 "provided transparently in all investor fact sheets" (no fact sheets) -> "provided in writing on request".
- I:2607 "Market Insights & Whitepapers" -> "Insights & Product Notes"; I:2608 "Investor FAQs & Guides" -> "Investor Resources & FAQs".
- Insight cards "Read Complete Paper →" (I:962, 974, 986, 1897, 1909, 1921) open 82–155-word notes labelled "6 / 8 / 5 min read" (A:882, 897, 917, 931). -> "Read Note →"; set readTime to "2 min read" (or drop the field).
- I:1849 "Enquire for Next Cohort →" (no cohort exists) -> "Enquire About Masterclasses →"; I:1863 "Book Corporate Workshop →" -> "Request a Workshop →"; I:1816 "Our educational modules assist investors in making informed, objective decisions" -> "Educational sessions on how markets, products and regulation work. Content is informational and recommends no product."

**C-11 Confirmation modal claims delivery that may not have happened.** A:766-798 shows the receipt even when `/api/enquire` fails (static hosting has no API; only localStorage is written). I:2542 says "routed to our specialized relationship desk"; I:2539 uses an emoji; I:2316 claims "bank-grade encryption" (unverifiable buzzword).
Fix: in A:765-776 set `let delivered=false;` and `delivered=true` inside `if (resp.ok)`; pass `payload.delivered=delivered`. In openReceiptModal set `document.getElementById('receipt-modal-title').textContent = data.delivered ? 'Inquiry Received' : 'Inquiry Saved on This Device';` and show for the false case "Your inquiry could not be transmitted from this browser. Please email connect@irahservices.com quoting the reference below." I:2542 -> "Thank you for your interest. Keep the reference below for any follow-up." I:2539 delete emoji. I:2316 -> "Your details are used only to respond to this inquiry. See the Privacy Policy."

**C-12 Tourism: no waitlist, date commitments, and unsupported destinations.** (a) Spec §2 requires an Early Access Waitlist modal; I:1799 and I:260 link to #/contact where the select defaults to Financial Services (I:1238). (b) No "no booking / no payment" notice, so cards such as "private transfers" (I:1771) read as live products. (c) Kashmir/Kerala (I:256, 1279) exist nowhere else; spec lists Rajasthan only. (d) "Q4 2026" (I:1750; A:133) is already the current quarter, so it is a date promise. (e) A:934 "operational reliability".
Fix: add after I:1755: `<p style="color:var(--slate-300); max-width:740px;">No bookings, reservations or payments are accepted at this stage. Itineraries are indicative and may change. Joining the waitlist records your interest only and creates no obligation on either side.</p>`. I:1750 -> `COMING SOON`; I:1741/1796, A:933/935 "Launching late 2026" -> "Planned for late 2026, subject to change"; A:133 title drop "• Q4 2026". I:256 -> "Heritage Domestic Circuits (Rajasthan)"; I:1279 -> "Domestic Heritage (Rajasthan)". A:934 -> "Itineraries are in planning and none is bookable yet." CTA prefill: `<a href="#/contact" data-prefill-vertical="tourism" ...>` (same for I:1849/1863 with "education") and in A init: `document.querySelectorAll('[data-prefill-vertical]').forEach(a=>a.addEventListener('click',()=>requestAnimationFrame(()=>{const s=document.getElementById('inquiry-vertical'); if(s){s.value=a.dataset.prefillVertical; s.dispatchEvent(new Event('change'));}})));`

**C-13 Grievance and Charter inaccuracies.** I:2425 "after 48 hours" (spec: 48 working hours). I:2440 "unresolved within 30 days ... SEBI or ODR" is not the SEBI sequence (SCORES first, ODR after). I:2428 officer shown only as "Principal Partner" with no name. Charter: I:2354 "dividend payouts" (SEBI term is IDCW); I:2353 "CAS on a monthly basis" overstated; I:2336 "Adopted in compliance with SEBI circulars" overclaims; page has no Responsibilities list though Resources I:1975 promises "obligations".
Fix: I:2425 -> "not resolved within 48 working hours". I:2440 -> "If the grievance is not resolved at Level 2 within 7 working days, or you are not satisfied, lodge a complaint on SEBI SCORES 2.0. If still dissatisfied after the SCORES outcome, you may start online dispute resolution on SMART ODR." I:2428 -> owner supplies name and designation. I:2354 -> "IDCW (Income Distribution cum Capital Withdrawal) payouts or redemption proceeds within SEBI timelines". I:2353 -> "Receive account statements and Consolidated Account Statements (CAS) as prescribed by SEBI". I:2336 -> "A plain-language summary of investor rights and responsibilities in mutual fund transactions, drawn from SEBI and AMFI investor-education material. Refer to SEBI and the AMC for the full Investor Charter text." Add `<h3>D. Responsibilities of Investors</h3>` with list: provide complete and accurate KYC; read the SID and KIM; verify the distributor's ARN on AMFI; pay only to the AMC or clearing corporation; review statements and report discrepancies promptly; keep contact details current.

**C-14 Registration wording contradicts itself.** I:1365 and I:1390 "Authorized to distribute mutual fund schemes across all SEBI-registered AMCs" while the ARN is still pending (I:1390 even adds "ARN registration in process"). Keep the mandated phrase, drop the authorisation claim.
Fix: I:1365 -> "AMFI-Registered Mutual Fund Distributor (ARN registration in process of allotment by AMFI India). Mutual fund transactions will be processed under IRAH's ARN once AMFI allots it." I:1390 -> same stem.

**C-15 Education is thinner than the handover curriculum.** Spec §2 requires rupee-cost averaging, asset-allocation matrices, hurdle rates, waterfall structures, drawdown risk, corporate wellness and regulatory literacy. #/education (I:1821-1865) has three cards with three bullets each, no format, duration or disclosure; "Tax Harvesting", "Section 54EC Real Estate Gains Optimization", "Salary Structuring & Tax Optimization" read as tax advice.
Fix (replace bullets): Foundation (I:1831-1833) -> "Compounding and rupee-cost averaging, worked through the IRAH calculators" / "Reading a scheme document: SID, KIM, riskometer, expense ratio" / "Asset classes and allocation concepts (education only)" / "Regulatory literacy: who regulates what, verifying an intermediary, filing a SCORES complaint". Masterclass (I:1845-1847) -> "Reading a PPM: fees, hurdle rate, carry and distribution waterfall" / "Drawdown, concentration and liquidity risk" / "PMS and AIF compared: structure, taxation, disclosure" / "Verifying PMS performance on regulator-mandated platforms" / "How Section 54EC works: eligibility, 6-month window, cap and lock-in (informational)". Corporate (I:1859-1861) -> "Reading a payslip; tax regimes and deductions (informational)" / "Basics of NPS and provident funds" / "Emergency funds and insurance basics (explained, never sold)" / "Spotting investment fraud: OTP scams, unregistered advisers". Add under I:1865: "Sessions are educational. No product is sold or recommended in a session. IRAH is not a SEBI-registered Investment Adviser." I:1828 "core physics of wealth creation" -> "how compounding, asset allocation, real returns and inflation work, and common behavioural pitfalls". I:1856 "Provide your workforce with objective personal finance frameworks" -> "Practical personal-finance basics for employees."

**C-16 Resources FAQ (3 items) and its wording.** I:1996 says funds are never in "personal bank accounts" (implies business accounts are fine) and "complete fund safety"; "NSE NMF" at I:1996 and I:1209 (spec: NMF II). Spec §5.1 promises forms, FAQs, literature; page has 3 cards plus 3 FAQs vs benchmark FAQs (Bluechip/Geojit).
Fix I:1996 -> "A: Client money never passes through IRAH Services LLP, in any account. Payments go from your bank directly to the AMC, or through BSE StAR MF or NSE NMF II, or directly to the PMS or AIF manager's designated account. IRAH does not accept cash." I:1209 NMF -> NMF II. Add FAQs (Q: A):
1. Can IRAH tell me which fund to buy? No. IRAH is not a SEBI-registered Investment Adviser and does not give personalised advice. Product choice is yours after reading the scheme documents. For advice, use a SEBI-registered Investment Adviser.
2. How is IRAH paid? By AMCs through commission on Regular plans, and by PMS, AIF and issuer partners through referral or distribution fees where applicable. IRAH charges no advisory fee. Details in writing on request.
3. Direct or Regular plan? Direct plans carry no distributor commission and can be bought from the AMC. Regular plans include it in the expense ratio and the distributor's service is paid from it.
4. How do I verify IRAH? Use AMFI Locate Distributor. IRAH's ARN registration is in process; the number will be published here once AMFI allots it.
5. How do I complain? See the Grievance Redressal page: Level 1 within 48 working hours, Level 2 within 7 working days, then SEBI SCORES 2.0 and SMART ODR.
6. Is Tourism open for booking? No. It is a preview with an Early Access Waitlist; no bookings or payments are accepted.
7. What happens to my form details? They are used only to respond to your inquiry (see Privacy Policy).

**C-17 Risk page lacks the product risk factors the spec promises (§5.1).** I:2474-2492 covers MF, PMS/AIF, commission, no-advice only. Nothing on bonds/NCDs/54EC, MLDs, SIF, SGB. Add after I:2482:
`<h3>2A. Bonds, NCDs and Section 54EC Bonds</h3><p>Debt instruments carry credit risk (the issuer may delay or default), interest-rate risk and liquidity risk. Ratings can be revised. 54EC bonds are locked in for five years, cannot be transferred or pledged, are not sovereign-guaranteed and pay taxable interest.</p><h3>2B. Market-Linked Debentures and Structured Notes</h3><p>Redemption value depends on a market reference and on the issuer's ability to pay. Principal protection, where offered, applies only at maturity and only if the issuer meets its obligations. Secondary-market liquidity may be limited.</p><h3>2C. Specialised Investment Funds</h3><p>SIF strategies may use derivatives, including short positions, and can lose value faster than conventional schemes. Redemption terms are scheme-specific.</p>` Also PMS: add "Portfolios are concentrated; no return is assured; fees apply regardless of performance."

## P2
**C-18 AI-tell / buzzword and leaked-internal-jargon copy.** Counts in index.html: "institutional" x29, "curated" x16, "architecture" x13 (used as a heading word, e.g. I:1466, 217, 181, 464, 982), "sophisticated" x6, "alpha" x6. Emoji used as icons across cards (I:154, 163-175, 230, 1355-1376, 1959-1973) and ✅ in modal; reads templated against the Swiss-private-bank tone. Internal brief wording leaks into UI: "INVESTOR CREDIBILITY" badge (I:266), "Submit Segmented Inquiry" (I:1318, 2314), "Segmented Relationship Desks" (A:139), "Sharp, actionable analysis" (I:948), "Thought Leadership" (I:945), "mathematical precision" / "actuarial" / "Benchmarked against" (I:574, 739, 2018, 2021).
Fix old -> new:
- I:137-138 "Invest with Clarity. / Build with Conviction." -> "Invest with Clarity. / Verify Every Claim." (suits a skeptical audience)
- I:266 "INVESTOR CREDIBILITY" -> "EDUCATION"; I:1318 and I:2314 "Submit Segmented Inquiry" -> "Submit Inquiry"; A:139 -> "Contact & Relationship Desks | IRAH Services LLP"
- I:945 "Thought Leadership" -> "Insights"; I:290 "Institutional Breadth across All Capital Horizons" -> "Products Available Through IRAH"; I:292 "IRAH delivers access across the entire spectrum of Indian capital markets" -> "IRAH facilitates access to regulated products from mutual funds to alternative funds."
- I:1466 "Financial Services Architecture" -> "Financial Services"; I:1468 -> "Mutual funds, PMS, AIFs, SIF, bonds and structured notes, distributed or facilitated through SEBI-registered managers and issuers." I:464 "Mandatory Regulatory Architecture Disclosure" -> "Regulatory Disclosure"
- I:574 "Simulate your financial future with mathematical precision. Benchmarked against official SEBI investor education actuarial calculators." -> "Illustrative calculators for SIP, lumpsum, goal, cost of delay and inflation. Results depend entirely on the assumptions you enter and are not forecasts." I:2021 and I:739 same idea: drop "Benchmarked against"; I:2018 kicker "Interactive Actuarial Suite" -> "Interactive Calculators"; keep the SEBI cross-check link at I:2093.
- I:220 "sophisticated lifestyle, wealth preservation, and knowledge requirements of modern individuals and corporate families" -> "IRAH Services LLP operates three verticals: regulated financial distribution, a travel preview, and investor education."
- I:611, 619-621 "Expected Annual Return Rate (CAGR %)" / "4% (Debt) / 12% (Balanced/Eq) / 25% (High Alpha)" labels read as return forecasts by asset class -> label "Assumed Annual Return (illustrative, not a forecast)"; range labels "4%" / "12%" / "25%" with no asset-class tags.

**C-19 Duplicated content across views.** Home insights cards (I:953-987) are verbatim copies of insights-view cards (I:1888-1922); the home regulatory grid (12 cards) repeats the repository (14). Fix: home insights -> keep two cards and add `<a href="#/insights" class="btn btn-secondary">View All Notes →</a>`; add an "As of" date on every note ("Informational note · Reviewed Oct 2026").

## Handover gaps (spec says X, code does Y)
1. §3.6 "15 portals" in the repository: view has 14 cards (I:2104-2230); NSE India absent everywhere; "SEBI Calc" card exists only on Home (I:1033), not in the repository view; extra RBI Retail Direct card present (I:2196).
2. §2 Tourism "Early Access Waitlist modal": none. CTA only navigates (C-12).
3. §5.1 /resources "downloadable forms, FAQs, literature": no downloads, 3 FAQs (C-10, C-16).
4. §5.1 /insights "research notes, whitepapers, regulatory updates": 4 notes of 82–155 words, no regulatory updates, no dates, no author.
5. §2 Education "rupee-cost averaging, hurdle rates, waterfall, drawdown, regulatory literacy": only partial (C-15).
6. §2 and §3.4 name SIF "Specialized Investment Framework" and group it with PMS/AIF referral; SEBI's SIF is a mutual fund category with a Rs 10 Lakh minimum. The handover itself needs correcting, not only the code (C-05).
7. §2 Structured "asymmetric participation and downside capital protection" promotes protection language that conflicts with the zero-guarantee guardrail; the code should describe protection only as issuer-dependent (C-01).
8. §3.5 L2 "Designated Compliance Officer" must be a named person; site shows "Principal Partner" only (C-13). Contact page labels the same desk "Level 1" (C-03).
9. §4 "Purge generic marketing values": emoji icons and "Institutional/Architecture" vocabulary remain (C-18).
10. Benchmark depth still missing vs Dezerv/Prudent/Bluechip/Geojit: Direct vs Regular disclosure, how-it-works process page, PMS/AIF fee and hurdle explainer, dated disclosures, LLPIN/partner names on About. About (I:1343-1398) has no compensation or conflict-of-interest statement; add the C-08 compensation sentence there too.
11. Owner inputs required (cannot be authored): registered address, phone numbers, hours, LLPIN, Compliance Officer name, and confirmation that IRAH distributes Regular plans only.

---

## REPORT: UIUX

# UI/UX audit (router, nav, tabs, modals, form, calculators, a11y) - IRAH Services LLP
Method: code read + headless Chromium probes on the WORK copy (390px mobile, 1280 desktop, 769-1024 sweep). Every item below was reproduced or read at the cited lines. WORK was not modified. Paths: app.js = A, index.html = H, styles.css = C.
Verified OK (not reported): all 14 routes + 8 subroutes resolve to the right view, title updates, scroll resets, calculator/contact teleport preserves values/active panel with no duplicate IDs, SIP/Lumpsum/Delay/Inflation/Retirement math (node-checked: SIP 10k/12%/10y = 23,23,391; LS 1L/12%/10y = 3,10,585; retirement PV independently re-derived).

## P1
**UX-01 Calculator number box and slider disagree; results use the hidden clamped value** (A:288-290, 370-372, 449-455, 550-552, 622-624; H:684/688, 711/715, 776/780, 787/791)
Repro: Lumpsum amount typed 2,00,00,000 -> box shows 20000000 but result is for Rs 50,00,000 (Rs 26.4 Cr); years 40 -> computed at 35. SIP 99999999 -> box unchanged, result for 5,00,000. Typed 12345 (step 5000) -> computed at 10,000. Retirement: cur age 62 -> ret-age box still 60 while slider/result use 63; ret-age 25 -> slider 40; expense 10000 -> slider 15000; inflation 12 -> slider 10. Root cause: slider min/max differ from number min/max/JS clamp, and number boxes are never rewritten after clamping. A skeptical HNI can read a wrong figure against the visible input.
Fix (a) align attributes: H:688 `max="5000000"`->`max="50000000"` and relabel H:691 `₹25,00,000`->`₹2,50,00,000` and H:692 `₹50,00,000`->`₹5,00,00,000`; H:715 `max="35"`->`max="40"`; H:780 `min="15000"`->`min="10000"`; H:791 `min="4" max="10"`->`min="3" max="12"`; A:452 `Math.max(minRet,`->`Math.max(40, minRet,`.
Fix (b) normalise on commit. In each bind*Inputs() after the number listeners add: `[sipAmountNum, sipRateNum, sipYearsNum].forEach(n => n && n.addEventListener('change', onRangeInput));` (same line with the ls*/ret*/delay*/inf* number vars). onRangeInput copies slider -> number, so the box snaps to what was calculated.

**UX-02 Receipt modal says "routed to our specialized relationship desk" even when nothing was sent** (A:765-799, 801-816; H:2540-2543)
Repro (file:// or any static host, i.e. Phase 1.5 Cloudflare/Vercel with no /api/enquire): fetch fails or 404 -> code still stores in localStorage and shows "Inquiry Successfully Logged". Lead is silently lost; claim is false.
Fix: A:762 add `let delivered = false;` ; A:772 `if (resp.ok) { delivered = true; ...` ; A:798 `this.openReceiptModal(payload, delivered);` ; A:801 `openReceiptModal(data, delivered) {` and at its top:
```js
document.getElementById('receipt-modal-title').textContent = delivered ? 'Inquiry Received' : 'Saved on This Device Only';
document.getElementById('receipt-modal-msg').textContent = delivered
  ? 'Thank you for contacting IRAH Services LLP. Your inquiry has been shared with the relevant desk.'
  : 'We could not reach our server, so this inquiry has not been sent. Please try again shortly or use the contact details on this page. Keep the reference below.';
```
H:2541 `<p style=` -> `<p id="receipt-modal-msg" style=`. (Phase 1.5 webhook should set `delivered` the same way.)

**UX-03 Dialogs: no focus move, no trap, no scroll lock, no focus return** (A:944-974, 990, 815; H:2526, 2536, 2545)
Repro: open insight modal -> activeElement stays BODY; 8x Tab walks out into the page behind; body still scrolls; after Esc focus lands on a background link. role=dialog/aria-modal/labelledby are present but behaviour is not. Escape listener also fires for hidden modals (harmless).
Fix: add helper and route every open/close through it.
```js
const ModalA11y = {
  open(m) { m._ret = document.activeElement; m.classList.add('active'); document.body.style.overflow = 'hidden';
    const box = m.querySelector('.modal-content-box'); box.tabIndex = -1; (m.querySelector('.modal-close-btn') || box).focus(); },
  close(m) { m.classList.remove('active'); if (!document.querySelector('.modal-overlay.active')) document.body.style.overflow = '';
    if (m._ret && m._ret.focus) m._ret.focus(); },
  key(e) { const m = document.querySelector('.modal-overlay.active'); if (!m) return;
    if (e.key === 'Escape') return this.close(m); if (e.key !== 'Tab') return;
    const f = [...m.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]')].filter(x => x.offsetParent);
    if (!f.length) return; const a = document.activeElement;
    if (e.shiftKey && (a === f[0] || a === m.querySelector('.modal-content-box'))) { e.preventDefault(); f[f.length-1].focus(); }
    else if (!e.shiftKey && a === f[f.length-1]) { e.preventDefault(); f[0].focus(); } }
};
```
Replace A:990 and A:815 `modal.classList.add('active')` -> `ModalA11y.open(modal)`; A:952/955/962/965 `X.classList.remove('active')` -> `ModalA11y.close(X)`; A:969-974 body -> `window.addEventListener('keydown', e => ModalA11y.key(e));`; H:2545 `onclick="document.getElementById('inquiry-success-modal').classList.remove('active')"` -> `onclick="document.getElementById('close-receipt-modal').click()"`. Modal close button is 36px: see UX-07.

**UX-04 Insight articles cannot be opened by keyboard** (H:953,965,977,1888,1900,1912,1924 `<div class="insight-card" data-insight-id>`; A:944-949)
Repro: Tab never reaches the cards; Enter on a focused card does nothing (tag DIV, no tabindex/role). Fix in InsightsViewer.init, replace A:944-949:
```js
document.querySelectorAll('[data-insight-id]').forEach(card => {
  card.setAttribute('role', 'button'); card.tabIndex = 0;
  const open = () => this.openArticle(card.getAttribute('data-insight-id'));
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
});
```
Add `.insight-card:focus-visible{outline:2px solid var(--navy-700);outline-offset:3px}`.

**UX-05 Mobile menu: Business Lines / Resources sub-items are unreachable; no Escape; aria incomplete** (A:1002-1037; H:30, 120)
Repro (390px): tap "Business Lines" -> the generic `nav a` handler (A:1010-1016) closes the whole menu and navigates to #/business-lines; the dropdown-toggle handler (A:1019-1028) runs on a menu that is already hidden. Financial Services, Tourism, Education, Calculators, Repository, Charter, Grievance are therefore unreachable from the mobile menu except via hub pages. Escape does not close the menu (verified). `aria-expanded` is set but no `aria-controls`; `dropdown-open` is never reset.
Fix: replace A:1009-1028 with
```js
const mq = window.matchMedia('(max-width: 960px)'); // see UX-17
const closeMenu = f => { nav.classList.remove('mobile-open'); toggle.innerHTML = '&#9776;'; toggle.setAttribute('aria-expanded', 'false'); if (f) toggle.focus(); };
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', e => {
  if (link.classList.contains('dropdown-trigger') && mq.matches) { e.preventDefault();
    link.setAttribute('aria-expanded', link.closest('.nav-item').classList.toggle('dropdown-open')); return; }
  closeMenu(false); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('mobile-open')) closeMenu(true); });
```
and add an "Overview" link as first child of each `.dropdown-menu` (H:44 `<a href="#/business-lines" class="dropdown-link">`, H:82 `<a href="#/resources" ...>`) so the hub pages stay reachable. H:30 add `id="primary-nav"`; H:120 add `aria-controls="primary-nav"`. Replace the outside-click body (A:1032-1036) with `closeMenu(false)`. Ship together with UX-17 (the nav must collapse at the same 960px the JS tests); if UX-17 is skipped use `(max-width: 768px)` in `mq`.

**UX-06 Footer legal links force horizontal overflow on every phone <=440px** (C:1897-1900; H:2663-2670)
Repro: 360/390/430px -> `documentElement.scrollWidth` = 440 on all routes; `.footer-legal-links` is a nowrap 416px flex row (6 links), so mobile browsers widen the layout viewport and the whole site renders shrunk/pannable.
Fix: C:1897 `.footer-legal-links { display: flex; gap: 1.25rem; }` -> `.footer-legal-links { display: flex; flex-wrap: wrap; gap: 0.25rem 1.25rem; }`. Also dedupe H:2670 (second `#/risk-disclosures` link, "Statutory Disclaimer").

**UX-07 Touch targets below 44px (measured at 390px)** 
Header "Contact Us" 102x37 (`.btn-sm` C:401); hamburger 33x39 (C:327); all home/hub "Explore ..." `.btn-sm` 37px; FS product tabs 42px (H:1477-1482); repo filter pills 32px (H:2122+); `.reg-link-btn` 33px (C:1266); `.reg-direct-link` 37px (C:1791, 12 footer + repo links); breadcrumb "Home" 21px (C:1941); footer legal links 21-37px wide; home CAMS/KFintech/CDSL links 26px (H:1156-1158); calc number inputs 28px (C:1045); modal close 36px (C:1580); consent checkbox 13px (H:1310); range sliders 6px hit area (see UX-16).
Fix (append to C):
```css
@media (max-width: 768px), (pointer: coarse) {
  .btn, .fs-product-nav-btn, .reg-filter-pill, .calc-tab-btn, .calc-number-input, .reg-link-btn,
  .reg-direct-link, .page-breadcrumb a, .footer-legal-links a { min-height: 44px; }
  .mobile-toggle { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .reg-link-btn, .page-breadcrumb a, .footer-legal-links a, .reg-card a:not(.reg-link-btn) { display: inline-flex; align-items: center; padding-inline: 0.25rem; }
  .modal-close-btn { width: 44px; height: 44px; }
  .checkbox-label { min-height: 44px; } .checkbox-label input { width: 22px; height: 22px; margin-top: 0; }
}
```
(`.mobile-toggle` base rule stays `display:none` above 768px.)

**UX-08 No `prefers-reduced-motion` anywhere** (C:81 `scroll-behavior: smooth`, C:1716 infinite `pulseEmerald`, C:1803, C:1916 `pageEnter`, C:2000 `fadeIn`, C:255 dropdown, card-interactive lift C:1980). Verified with reducedMotion emulation: smooth scroll, page-enter animation and infinite pulse all still run.
Fix (append to C):
```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```
And A:165 `el.scrollIntoView({ behavior: 'smooth' })` -> `el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })`.

**UX-09 No skip link; no focus/announcement on route change** (H:15-18; A:144-173)
No "skip" markup exists. After a route change focus stays on the clicked nav link, so a keyboard user must Tab through the header again and a screen reader hears nothing (only `document.title` changes). Do NOT use `<a href="#main">`: any non-`#/` hash falls through the router's final `else` to Home (verified with `#policy-dpdp`).
Fix: H after `<body>`: `<button type="button" class="skip-link" id="skip-link">Skip to main content</button>`; C:
```css
.skip-link { position: absolute; left: -9999px; top: 0; z-index: 4000; }
.skip-link:focus { left: 1rem; top: 1rem; padding: 0.75rem 1rem; background: var(--navy-900); color: var(--white); border: 1px solid var(--gold-500); border-radius: var(--radius-sm); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
```
A: insert before A:173 `this.updateActiveNav(hash);`
```js
const h1 = targetEl && targetEl.querySelector('h1');
if (h1 && this._routed) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
this._routed = true;
```
and in DOMContentLoaded: `document.getElementById('skip-link').addEventListener('click', () => { const h = document.querySelector('.page-view-container.active h1'); h.tabIndex = -1; h.focus(); });`. C: `h1:focus { outline: none; }`.

**UX-10 Tab widgets: ARIA half-implemented, no arrow keys; FS tabs not linked to URL** (H:581-586, 1477-1482; A:252-264, 222-231, 666-684)
Calc tabs have role=tab/tabpanel but no `aria-selected`, `aria-controls`, `aria-labelledby`, roving tabindex or arrow keys (verified `//` for all five). FS product tabs: clicking never updates the hash (deep link/refresh/back lose state), and `#/financial-services` after `#/financial-services/pms` leaves PMS active (`if (!subRoute) return;` A:224); unknown subroute (`/bogus`) also keeps the previous tab.
Fix calc tabs (replace A:252-264):
```js
bindTabButtons() {
  const tabs = [...document.querySelectorAll('.calc-tab-btn')];
  const select = (btn, focus) => { tabs.forEach(b => { const on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    document.querySelectorAll('.calc-panel').forEach(p => p.classList.toggle('active', p.id === btn.dataset.targetPanel)); if (focus) btn.focus(); };
  tabs.forEach((b, i) => { b.id = 'tab-' + b.dataset.targetPanel; b.setAttribute('aria-controls', b.dataset.targetPanel);
    document.getElementById(b.dataset.targetPanel).setAttribute('aria-labelledby', b.id);
    b.addEventListener('click', () => select(b));
    b.addEventListener('keydown', e => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); } }); });
  select(tabs.find(b => b.classList.contains('active')) || tabs[0]);
}
```
Fix FS tabs: A:223-231 -> `const sub = hash.replace('#/financial-services','').replace(/^\//,''); setTimeout(() => (document.querySelector('[data-fs-tab="'+sub+'"]') || document.querySelector('[data-fs-tab="mutual-funds"]')).click(), 20);` ; inside the FS click handler (A:668) add `tabs.forEach(t => t.setAttribute('aria-pressed', t === btn)); history.replaceState(null, '', '#/financial-services' + (tabKey === 'mutual-funds' ? '' : '/' + tabKey));` (replaceState does not fire hashchange, so no scroll jump). Add `aria-live="polite"` to each `.calc-metric-big` (H:646 etc.) so result changes are announced.

## P2
**UX-11 Form validation / submit flow** (A:711-799; H:1218, 1285-1286, 1233)
(a) Two inconsistent error paths: browser-native bubbles for empty required fields (JS never runs), custom toasts for the rest. Toast (A:818-831) has no `role="alert"`/aria-live, no `.error` style (C has only `.toast-msg`/`.show`), and a stacked call is hidden early by the first 4s timer. No focus moves to the bad field.
(b) Phone check is lenient (A:734): `'abc 1234567890 9876543210'` passes and saves `9876543210`; `+1 98765 43210` passes.
(c) Double submit creates 2 leads (reproduced: 2 records). No busy state.
(d) After success `reset()` (A:793-795) forces only the investment block visible: if tourism was selected, the travel block stays visible too, while the select reverts to Investments.
(e) "Target Travel Window" input (H:1285-1286) has no id/for and is never read, so that data is lost; payload also sends hidden investment-field values for tourism/education leads (A:754-757) instead of 'N/A'.
Fix: keep native UI, one path: A:722-743 ->
```js
const form = e.target, submitBtn = form.querySelector('[type=submit]'); if (this.busy) return;
const phoneEl = document.getElementById('form-phone'), emailEl = document.getElementById('form-email');
emailEl.setCustomValidity(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter a valid email address.');
const m = phone.replace(/[\s().-]/g, '').match(/^(?:\+91|91|0)?([6-9]\d{9})$/);
phoneEl.setCustomValidity(m ? '' : 'Enter a valid 10-digit Indian mobile number starting with 6-9.');
if (!form.reportValidity()) return;
const cleanPhone = m[1]; this.busy = true; submitBtn.disabled = true;
```
(delete the old `const cleanPhone` at A:734 and the 4 toast checks; add `minlength="2"` to `#form-name` H:1222), in init `['form-phone','form-email'].forEach(id => document.getElementById(id).addEventListener('input', e => e.target.setCustomValidity('')))`, and a `try { ... } finally { this.busy = false; submitBtn.disabled = false; }` around the fetch/store/modal block. A:793-795 -> `e.target.reset(); document.getElementById('inquiry-vertical').dispatchEvent(new Event('change'));`. A:754-757: wrap with `vertical === 'investments' ? ... : 'N/A'` per field. H:1285-1286 give the label `for="form-travel-window"`, the input `id="form-travel-window" name="travelWindow"`, and add `travelWindow: document.getElementById('form-travel-window')?.value || 'N/A'` to the payload. Toast: `toast.setAttribute('role','alert')` at A:824, `clearTimeout(this._t); this._t = setTimeout(...)`, and C `.toast-msg.error{border-left-color:#ef4444}`.

**UX-12 Copy-reference flow missing (handover 5.4 "copy-to-clipboard")** (A:805-813; H:2544-2545) - no button, no clipboard code anywhere.
Fix: A:807 wrap id: `<span id="receipt-ref" style=...>${data.reference_id || 'IRAH-LOGGED'}</span>`; H after line 2544: `<button type="button" class="btn btn-secondary btn-sm" id="copy-ref-btn">Copy Reference</button> <span id="copy-ref-status" class="sr-only" role="status"></span>`; A (InsightsViewer.init):
```js
document.getElementById('copy-ref-btn')?.addEventListener('click', async () => {
  const ref = document.getElementById('receipt-ref').textContent.trim();
  try { await navigator.clipboard.writeText(ref); } catch (_) { const t = document.createElement('textarea'); t.value = ref; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
  document.getElementById('copy-ref-status').textContent = 'Reference copied';
  document.getElementById('copy-ref-btn').textContent = 'Copied';
});
```

**UX-13 Router edge cases** (A:92-125, 210-220; C: no scroll-margin)
(a) Handover route `#/home` is not a route: falls to final `else` (A:123) -> Home renders but nav shows nothing active and the URL stays `#/home`. Same for `#`, `#/nonsense`, `#policy-dpdp`.
(b) `hash.startsWith('#/financial-services')` (A:98) also matches `#/financial-servicesX`.
(c) Parent nav never highlights: on Financial Services/Tourism/Education/Calculators/Repository/Charter/Grievance only the hidden dropdown link gets `.active`; "Business Lines"/"Resources" triggers stay plain. No `aria-current`.
(d) `#/privacy-policy`/`#/terms-of-use` scroll target sits under the 74px sticky header (no `scroll-margin-top`).
Fix: A:72-76 after trailing-slash strip add `if (hash === '#/home' || hash === '#') hash = '#/';` ; A:98 -> `} else if (hash === '#/financial-services' || hash.startsWith('#/financial-services/')) {` ; A:123-125 -> `} else { targetId = 'view-home'; hash = '#/'; history.replaceState(null, '', '#/'); }` ; replace updateActiveNav body (A:211-219):
```js
const links = document.querySelectorAll('.nav-link, .dropdown-link');
links.forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
links.forEach(l => { const href = l.getAttribute('href');
  if (href === hash || (href !== '#/' && hash.startsWith(href + '/'))) { l.classList.add('active'); l.setAttribute('aria-current', 'page');
    const t = l.closest('.nav-item') && l.closest('.nav-item').querySelector('.dropdown-trigger'); if (t) t.classList.add('active'); } });
```
C: `#policy-dpdp, #policy-terms { scroll-margin-top: 96px; }`.

**UX-14 Static placeholders differ from computed defaults (flash of wrong numbers; also what no-JS/crawlers see)** (H:798, 807, 858, 863, 867)
JS-off vs JS-on: corpus `₹4.85 Cr` vs `₹6.82 Cr`; SIP `₹13,760` vs `₹19,316`; delay now `₹2.84 Cr` vs `₹2.85 Cr`, delayed `₹1.69 Cr` vs `₹1.94 Cr`, cost `₹1.15 Cr` vs `₹90.26 L`.
Fix: H:798 `₹4.85 Cr`->`₹6.82 Cr`; H:807 `₹13,760`->`₹19,316`; H:863 `₹2.84 Cr`->`₹2.85 Cr`; H:867 `₹1.69 Cr`->`₹1.94 Cr`; H:858 `₹1.15 Cr`->`₹90.26 L`.

**UX-15 Retirement model deviates from handover 5.3 and hides an assumption** (A:493-504, 514; H:811)
Spec: post-retirement inflation 6%, yield 8%, life expectancy 85. Code reuses the pre-retirement inflation slider (3-12%) as post-retirement inflation: slider 10% -> corpus Rs 33.5 Cr vs Rs 20.7 Cr with fixed 6% (node-checked); slider 4% -> Rs 3.09 Cr vs 3.85 Cr. Required-SIP uses a hard-coded 12% return (A:514) that the disclaimer never states.
Fix: A:504 `const realRate = (postRetReturn - inf) / (1 + inf);` -> `const postInf = 0.06; const realRate = (postRetReturn - postInf) / (1 + postInf);` ; H:811 -> `*Assumes life expectancy 85, 8% post-retirement return and 6% post-retirement inflation; the Monthly SIP figure assumes a 12% p.a. return. Illustrative only; not a projection or advice.`

**UX-16 Range sliders: no visible keyboard focus, Firefox unstyled, 6px hit area** (C:1083-1108)
`outline: none` (C:1090) with no replacement; only `::-webkit-slider-thumb` is styled (Firefox shows native thumb/track mismatch); touch hit area is the 6px bar. Also `.calc-number-input:focus` gold border (C:1059-1063) on white is ~2.3:1.
Fix: replace C:1083-1091 and add after C:1108:
```css
.calc-range-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 44px; background: transparent; cursor: pointer; }
.calc-range-slider::-webkit-slider-runnable-track { height: 6px; background: var(--slate-200); border-radius: var(--radius-full); }
.calc-range-slider::-moz-range-track { height: 6px; background: var(--slate-200); border-radius: var(--radius-full); }
.calc-range-slider::-webkit-slider-thumb { margin-top: -7px; }
.calc-range-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: var(--navy-900); border: 2px solid var(--gold-400); }
.calc-range-slider:focus-visible { outline: 2px solid var(--navy-700); outline-offset: 2px; }
.calc-number-input:focus { border-color: var(--navy-700); box-shadow: 0 0 0 2px rgba(197,160,89,0.35); }
```

**UX-17 Header nav labels wrap onto two lines at 769-930px (iPad portrait 810/820/834)** (C:2140 breakpoint, C:214)
Measured: nav links 67px tall ("About Us", "Business Lines" wrap), logo/nav touch with no gap; fine from 940px.
Fix: move the mobile-menu rules (C:2143-2185 `.nav-menu`, `.mobile-toggle`, `.nav-item`, `.nav-link`, `.dropdown-menu`, `.dropdown-open`) from `@media (max-width: 768px)` into a new `@media (max-width: 960px)` block, add `.nav-link { white-space: nowrap; }` (C:214), and use `matchMedia('(max-width: 960px)')` in A (see UX-05) instead of `innerWidth <= 768`.

**UX-18 formatINR compact rounding and unit edge cases** (A:8-20)
`formatINR(9999999, true)` -> `₹100.00 L` (should be `₹1.00 Cr`); `99999` -> `₹100.0 k` (non-Indian unit; Rs 1 L expected); Infinity -> `₹∞`.
Fix: replace A:9-18 with
```js
const num = Number.isFinite(Number(val)) ? Math.round(Number(val)) : 0;
if (compact) {
  if (num >= 9999500) return '₹' + (num / 1e7).toFixed(2) + ' Cr';
  if (num >= 99995) return '₹' + (num / 1e5).toFixed(2) + ' L';
}
```
(drops the `k` tier so sub-lakh values use full Indian grouping, consistent with the other fields).

**UX-19 Repository search/filter** (H:2120-2124; A:844-872) - search input has no label (placeholder only; add `aria-label="Search regulators and portals"` and `type="search"`); filter pills have no `aria-pressed`; when nothing matches the grid silently empties (add `<p id="reg-empty" hidden>No portals match your search.</p>` and toggle it with `hidden = visibleCount > 0` after the loop at A:848-860). Filter also queries global `.reg-card`, so it mutates the home-page cards too.

## Out-of-lens, spotted in passing (confirm in compliance/content reports)
- H:2308 "Official Response Window: 24-48 Business Hours" is a turnaround claim not in the handover (only L1 48 working hours / L2 7 working days allowed); H:2316 "bank-grade encryption" is an unverifiable claim.
- A:890 article footer "IRAH Advisory Notice" uses advisory wording against the non-RIA guardrail (suggest "IRAH Distribution Notice").

## Handover gaps (spec says X, code does Y)
1. 5.1/8: first route `#/home`; code canonical is `#/` and `#/home` only works via the fallthrough (UX-13). Code also adds undocumented routes `#/financial-services/<tab>`, `#/privacy-policy`, `#/terms-of-use` (14 views, 22 hashes).
2. 5.3 #3: post-retirement inflation fixed 6%; code reuses the slider (UX-15). Required-SIP return 12% is undocumented in spec and UI.
3. 5.3: "all 16 numeric variables ... synchronized sliders and number inputs"; five of them desync on out-of-range entry (UX-01).
4. 5.4 UX: "confirmation modal with tracking reference and copy-to-clipboard"; no copy control exists (UX-12), and modal confirms even when delivery failed (UX-02).
5. 5.2: "User form input is never lost" - holds for the teleport, but a successful submit resets the form and leaves stale conditional blocks (UX-11d).
6. 2 / 5.4: tourism "Target Travel Window" is collected in the UI but not in the payload (UX-11e).
7. 4 Step 3 / brief rule 7: ">=44px touch targets" - fails widely (UX-07); "accessible vanilla JS" - modals, tabs, insight cards, skip link, reduced motion not met (UX-03/04/08/09/10).
8. 6: spec says the footer card has "12 Direct Statutory Links" while 3.6 lists 15 portals; the 12 `.reg-direct-link` anchors match, so this is a doc inconsistency rather than a code defect.

---

## REPORT: DESIGN

# Design / Elements audit (styles.css + index.html markup)
Method: full read of styles.css; token/class cross-check script; WCAG script (exp/contrast.py); ONE Playwright pass (390 + 1024, home + #/financial-services, file:// copy). Items marked (static) are from code reading only.

## P1

**D1. Horizontal overflow at 390px (measured).** documentElement.scrollWidth = 440 on home and financial-services (vw 390).
- `styles.css:1897` `.footer-legal-links{display:flex;gap:1.25rem}` has no wrap: width 416px, last link ("Statutory Disclaimer") spans x=379-440, so it is clipped and unreachable (body is overflow-x:hidden).
  FIX: `.footer-legal-links{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem}`
- Home contact form (`#contact-slot-home`, `.contact-info-col`, `.contact-box`, `#master-contact-container`) is 383px wide inside a 342px column (right edge 407). The 1fr tracks (`.contact-section-wrap` L1438, `.form-grid-2` L1490) resolve to `minmax(auto,1fr)`, so wide content (likely the long `<option>` text in the `<select class="form-control">` at index.html:1237-1270) stretches them. Cause inferred, overflow measured.
  FIX (append inside the `@media (max-width:768px)` block at L2140):
  `.contact-section-wrap,.form-grid-2{grid-template-columns:minmax(0,1fr)} .contact-section-wrap>*,.form-grid-2>*,.form-group{min-width:0} .form-control{min-width:0;max-width:100%;text-overflow:ellipsis}`

**D2. Home hero is clipped at 390 (measured).** `h1.hero-title` is 398px wide in a 342px container, and `.hero-section{overflow:hidden}` (L441) hides the overflow. `.hero-title{font-size:3.25rem}` (L478, 52px) is never reduced at <=768, because the `h1{font-size:2.15rem}` rule at L2141 loses to the class selector. `.hero-grid` (L457) is `1.15fr .85fr`, then `1fr` at <=1024, with no `min-width:0`.
FIX: change L2104-block `.hero-grid{grid-template-columns:minmax(0,1fr)}` and add `.hero-grid>*{min-width:0}`. In the 768 block add `.hero-title{font-size:clamp(2rem,8.6vw,2.6rem)}` and `.hero-section{padding:3.5rem 0}`.

**D3. Badges/pills lack `white-space:nowrap` (guardrail 7, handover 4 Step 3).** Only the footer chip (L1705), `.btn`, `.calc-tab-btn` and `.statutory-aside-badge` have it. Missing on `.badge` L413, `.hero-tagline-pill` L464, `.cockpit-status` L538, `.universe-tag` L838, `.reg-role-badge` L1242, `.edu-card-badge` L1358, `.desk-badge` L2041. Measured: `.cockpit-status` ("● Institutional Platform") wraps to 2 lines (43px high) at 390.
Statically likely: the grievance rows index.html:2407/2422/2437 (`display:flex;justify-content:space-between` with no wrap, h3 plus `.badge`) and `.reg-card-head` L1229 (e.g. "Bima Bharosa" + "INSURANCE GRIEVANCE" in 4-col cards) will wrap the badge text.
FIX:
```
.badge,.hero-tagline-pill,.cockpit-status,.universe-tag,.reg-role-badge,.edu-card-badge,.desk-badge{white-space:nowrap;flex-shrink:0}
.reg-card-head{flex-wrap:wrap;gap:.35rem .75rem}
```
and add `flex-wrap:wrap;gap:.5rem` to the 3 inline grievance header rows (index.html:2406, 2420, 2435 style attrs).
Exception: `index.html:2308` ("Official Response Window: 24-48 Business Hours", inline 0.85rem + padding 1rem) is about 375px wide with nowrap, which overflows 342px. Shorten it, or use `style="white-space:normal;text-align:center;border-radius:var(--radius-md)"`. Content note: the "24-48 Business Hours" TAT is not in handover 3.5 (L1 is 48 working hours); see guardrail 5.

**D4. Light badges on a dark card (guardrail 7).** `index.html:1750-1751` puts `.badge-gold` (bg #faf4e8) and `.badge-navy` (bg #e8eef8) inside `.tourism-showcase` (styles.css:1282, navy gradient). They render as stark light pills.
FIX (add after L1291):
```
.tourism-showcase .badge-gold{background:rgba(197,160,89,.12);color:var(--gold-300);border:1px solid rgba(197,160,89,.4)}
.tourism-showcase .badge-navy{background:rgba(255,255,255,.06);color:var(--slate-300);border:1px solid rgba(255,255,255,.14)}
```
The measured pass found no other light-on-dark badges in home or financial-services; the tourism route was not rendered.

**D5. Undefined CSS variables cause a visible bug on the statutory card.** `--gold-200` is used at L1809 (`.reg-direct-link:hover{color:var(--gold-200) !important}`) and L1824 (`.ext-arrow` hover) but is not in :root. The declaration is invalid at computed time, so the hover text falls back to the inherited colour and gets dimmer than the resting `--slate-100`. `--emerald-400` at L543 (`.cockpit-status`) is also undefined, so the intended emerald text is lost.
FIX in :root: `--gold-200:#e5c985;` (brief's Champagne light; no token holds it today) and `--emerald-400:#34d399;`.

**D6. WCAG contrast (script, ratios).**
- Dark surfaces are fine: gold-500/400/300 on #060c18, #0a1428, #0e1b36 and brief #0F1D38 = 6.8-12.9. slate-300 = 11.3-13.2. slate-400 = 6.5-7.6. Only `slate-500` on navy fails (3.5-4.1): `.footer-bottom-bar` L1894 at 0.775rem = 4.11.
  FIX: L1894 `color:var(--slate-400)`.
- Light surfaces fail:
  - `.btn-gold` (L366) white on a gold-500 to gold-600 gradient = 2.46 to 3.98 (header CTA, hero, form submit). FIX: `.btn-gold{color:var(--navy-950)}` (7.96 / 4.92; the hover already uses navy-950).
  - gold-600 text on white/slate-50/gold-100 = 3.6-4.0 at 0.65-0.75rem: `.logo-text-sub` L194, `.section-kicker` L691, `.badge-gold` L430, `.desk-badge` L2041, `.check-icon` L805, `.contact-detail-row .icon` L1474, `.reg-link-btn:hover` L1278, inline index.html:1839/2265.
    FIX: add `--gold-700:#85651f` (5.4 white / 4.9 gold-100) and use it for those text colours; keep gold-600 for the button gradient.
  - slate-400 on white/slate-50 = 2.45-2.56: `.dropdown-group-title` L265, `.calc-range-labels` L1110, `.insight-meta` L1405. FIX: `var(--slate-500)` (4.76 white / 4.55 slate-50).
  - `.badge-emerald` L436 = 3.58 -> `color:#047857` (5.21). `.badge-amber` L442 = 2.86 -> `color:#92400e` (6.37).

**D7. Focus visibility.** There is no `:focus-visible` anywhere in styles.css.
- `L1090` `.calc-range-slider{outline:none}` has no replacement, so all 8+ calculator sliders (index.html:601-768) give keyboard users zero focus indication.
- `L1060` and `L1522` (`.calc-number-input`, `.form-control`) drop the outline for a 2-3px ring at 12-20% alpha, which is below 3:1.
- `.insight-card` (index.html:953/965/977) is a `<div>` with `cursor:pointer` and a click handler (app.js:944-949), so it is not keyboard operable.
FIX:
```
/* delete outline:none at L1090; replace L1060/L1522 outline:none with: */
:where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:2px solid var(--gold-500);outline-offset:2px}
.section-bg-navy :focus-visible,.hero-section :focus-visible,.master-footer :focus-visible,.calc-output-card :focus-visible{outline-color:var(--gold-300)}
.form-control:focus-visible,.calc-number-input:focus-visible{outline:2px solid var(--navy-700);outline-offset:1px}
```
app.js insight init, inside the existing forEach: `card.tabIndex=0;card.setAttribute('role','button');card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click();}});`

**D8. Touch targets under 44px (measured at 390; same at 1024).**
- `.btn` / `.btn-gold` / `.btn-secondary` 37px (L338; `.btn-sm` L401 is about 32)
- `.mobile-toggle` 33x39 (L327)
- `.reg-direct-link` 37px x12 (L1791)
- `.reg-link-btn` 33px x11 (L1266)
- `.calc-number-input` 28px (L1045)
- `.footer-links-list a` and legal links 16px (L1636, L1897)
- `.modal-close-btn` 36px (L1580)
- `.insight-read-more` 21px
Handover section 6 requires "ergonomic single-column tap targets" at <=768, and `.reg-direct-link` is 37px.
FIX (append to the 768 block, or use `@media (pointer:coarse)`):
```
.btn,.reg-link-btn,.calc-number-input,.form-control{min-height:44px}
.mobile-toggle,.modal-close-btn{min-width:44px;min-height:44px}
.reg-direct-link,.footer-reg-action-btn{min-height:44px}
.footer-links-list a,.footer-legal-links a{display:inline-flex;align-items:center;min-height:44px}
```

**D9. `#footer-regulatory-directory` vs handover section 6.** Matches: gradient stops, 2px gold top bar, hairline border, single `.footer-reg-status-chip` with nowrap and emerald beacon, 12 links, action button to `#/knowledge-repository`, `grid-column:1/-1` at <=1024 (measured 976px wide, 3 columns at 1024), single column at 390 (292px). Gaps:
- `L1771` `.footer-reg-links-highlight{max-height:380px;overflow-y:auto}` applies above 1024px. Measured content height is 534px at 390 (same row height on desktop), so about 4 of the 12 statutory links sit behind a nested 4px scrollbar. Hiding statutory links from due-diligence readers is a trust defect. FIX: delete `max-height:380px;overflow-y:auto;padding-right:.25rem` and the 3 `::-webkit-scrollbar` rules (L1779-1788), then drop `max-height:none` from the 1024 block.
- `L1725-1745` `.footer-reg-badge-row` and `.footer-reg-status-pill` are the dual-pill remnants the handover says were purged. Both are unused in HTML. FIX: delete the two rules.
- `L1713` `background:#10b981` is the only hardcoded hex outside :root, while `--emerald-500` is defined and unused. FIX: `background:var(--emerald-500)`.
- 25 `!important` (L1792-2016) exist only to beat `.footer-links-list a` (L1636). FIX: scope selectors as `.footer-links-list .reg-direct-link` and `.footer-links-list .footer-reg-action-btn`, then drop every `!important`. The `.fs-product-nav-btn.active` and `.reg-filter-pill.active` ones are also unneeded: the later source order with equal specificity already wins.
- Semantics: the card is a bare `<div>`. Use `<section id="footer-regulatory-directory" aria-labelledby="footer-reg-title">`, put `id="footer-reg-title"` on the h4, and add `aria-hidden="true"` to `.footer-reg-card-glow`. The 🏛️ emoji (`.reg-crest-icon`) is an AI tell on a Swiss-private-bank card; replace it with a 16px inline SVG or remove it.

## P2

**D10. Motion.** There is no `prefers-reduced-motion` rule (L81 `scroll-behavior:smooth`; infinite `pulseEmerald` L1716; `pageEnter`; `fadeIn`; hover lifts). 16 rules use `transition:all` (L145, 223, 350, 562, 733...), some with `!important`, which animates layout properties. The dropdown opacity/transform transition (L241-262) never plays because it flips `display:none`.
FIX:
```
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition-duration:.01ms!important}}
@media (hover:hover) and (pointer:fine){ /* move .business-card:hover, .reg-card:hover, .tour-card:hover, .insight-card:hover, .card-interactive:hover, .reg-direct-link:hover transforms here */ }
```
Replace `transition:all var(--transition-fast)` with explicit `background-color,border-color,color,box-shadow,transform`.

**D11. Palette drift vs brief/handover.** :root has `--navy-950:#060c18` (brief #060C1A), `--navy-900:#0a1428` (#0A142A), `--navy-850:#0e1b36` (#0F1D38, which handover calls "Navy 900"). Gold has no #E5C985 token (see D5). rgba literals mix 6,12,24 / 6,12,26, 10,20,40 / 10,20,42, and 14,27,54.
FIX: `--navy-950:#060C1A;--navy-900:#0A142A;--navy-850:#0F1D38;--gold-200:#E5C985;` and normalise literals to `rgba(6,12,26,.x)`, `rgba(10,20,42,.x)`, `rgba(15,29,56,.x)`.
Inline off-palette colours: index.html:858 `#ef4444`, 2370-2371 `#fef2f2/#b91c1c`. Add `--danger-600:#b91c1c; --danger-50:#fef2f2` tokens (or navy/gold treatment) and use them.

**D12. Data tables (6 x `.data-table`, index.html:1495/1554/1579/1603/1662/1686).** At 390 the 5-col table is contained (wrapper 340px, content 645px, no page overflow), but:
- the scroller is not keyboard-reachable and has no scroll cue
- 18 `<th>` lack `scope`
- columns squeeze to 115px
FIX: `sed -i 's/<div class="data-table-wrap">/<div class="data-table-wrap" tabindex="0" role="region" aria-label="Scrollable table">/; s/<th>/<th scope="col">/g' index.html`. CSS: `.data-table{min-width:620px} .data-table th{white-space:nowrap}`.

**D13. Responsive gaps.**
- Only the 1024/768 breakpoints exist, and there are no `@container` rules although handover section 4 Step 4 asks for them (gap).
- The 768 block never reduces padding: `.calc-panel` L1004 (2.5rem), `.form-card` L1479 (2.5rem), `.tourism-showcase` L1282 (3.5rem) leaves only 230px of inner width at 390, `.modal-content-box` 2.5rem, `.section` 5rem.
- `.toast-msg` L2216 is fixed with `right:2rem`.
FIX (768 block): `.tourism-showcase{padding:2rem 1.25rem} .calc-panel,.form-card,.modal-content-box{padding:1.5rem 1.25rem} .section{padding:3.5rem 0} .toast-msg{left:1rem;right:1rem;bottom:1rem}`.

**D14. Mobile nav (static).** At <=768, `.nav-item:hover/:focus-within .dropdown-menu{display:block}` (L258, specificity 0,3,0) beats the mobile `.dropdown-menu{display:none}` (0,1,0), so sticky hover/focus keeps submenus open regardless of `.dropdown-open`. Also app.js:1011-1016 closes the whole menu on any `nav a` click, including `.dropdown-trigger`, so the mobile submenus are effectively unreachable (the trigger navigates and closes).
FIX: in the 768 block add `.nav-item:hover .dropdown-menu,.nav-item:focus-within .dropdown-menu{display:none}` immediately before `.nav-item.dropdown-open .dropdown-menu{display:block}`. In app.js exclude triggers on mobile: `nav.querySelectorAll('a:not(.dropdown-trigger)')`, or skip the close when `window.innerWidth<=768 && link.classList.contains('dropdown-trigger')`.

**D15. Dead / duplicate CSS (cross-checked against index.html + app.js).**
- Unused classes: `.container-narrow` L127, `.pillar-num` L902 (plus `.pillar-title` and `.pillar-desc`, because the cards use inline styles), `.card-glass-dark` L1972, `.badge-dot-live` (L1708 selector), `.footer-reg-badge-row` and `.footer-reg-status-pill` (D9).
- Used in HTML but undefined in CSS: `.hero-content`, `.card`, `.about-architecture-grid`.
- Unused tokens: `--emerald-500`, `--emerald-100`, `--amber-500`, `--blue-100`, `--blue-600`, `--navy-600`.
- No duplicate selectors.
- `.calc-range-slider` styles only `::-webkit-slider-thumb`; Firefox gets an unstyled thumb. FIX: duplicate the thumb rules under `::-moz-range-thumb` and add `::-moz-range-track`.

**D16. Inline-style and type hygiene.** There are 203 inline `style=` attributes in index.html (tourism block, grievance cards, About, calculators), which bypass tokens and breakpoints (that is how D3 and D4 slipped through). Sub-12px type is used in 13 rules: `.logo-text-sub` and `.mini-vertical-sub` at 0.65rem, `.reg-role-badge` at 0.675rem, and `.dropdown-group-title`, `.tour-dest-tag`, `.desk-badge` at 0.7rem. FIX: set a 0.75rem floor (`font-size:max(.75rem,...)`) for badge/label classes. Emoji icons (📈✈️🎓🚀🛡️💰📍✉️📞) in `.card-icon-wrap` / `.contact-detail-row .icon` are inconsistent across OS and off-tone; replace with inline SVG line icons.

## Handover gaps (spec says X, code does Y)
- Sec 4 Step 3 "strict nowrap on status indicators": 7 badge/pill classes lack it (D3); a light-on-dark badge pair persists (D4).
- Sec 4 Step 4 "strict responsive CSS container queries": zero `@container` rules (D13).
- Sec 4 Step 5 "verify tablet <=1024 / mobile <=768 transitions": mobile overflows at 390 (D1, D2).
- Sec 4 palette: tokens are #060c18 / #0a1428 / #0e1b36, not the spec hexes; #E5C985 is not tokenised (D11, D5).
- Sec 6 trust card: "12 links ... elevated micro-cards" are partly hidden behind a 380px nested scroll on desktop (D9), tap targets are 37px (D8), and dual-pill remnants remain in CSS (D9). Everything else in section 6 matches.
- Guardrail 7 (>=44px targets): see D8.
- Out of lens, for content agents: index.html:2308 "24-48 Business Hours" TAT is not in handover 3.5; index.html:1560 "Manager advises; investor explicitly approves every trade" uses advisory wording about PMS.
