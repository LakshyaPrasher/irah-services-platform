# IRAH Services Cybersecurity Audit

**Assessment date:** 21 November 2026  
**Scope:** Cybersecurity review of the checked-out website and its Python server, Cloudflare Pages Advanced Mode Worker, Pages Function source, Docker image instructions, local storage, email integrations, and existing security-test coverage. I also made non-mutating `HEAD`/`OPTIONS` requests to the production origin `https://irah.co.in/`.  
**Overall risk:** **Critical for any reachable Python/Docker deployment. High for the Cloudflare edge implementation.**  
**Code changes:** None. This file is the audit deliverable.

## Executive assessment

The Python server has a **confirmed unauthenticated path traversal** through its static-file allowlist. I verified it against an isolated loopback instance using `HEAD` requests only: `/irah.env` directly returned 404, while an encoded traversal under `/assets/` returned 200 for both the environment file and inquiry store. I did not read either file's contents. When this server is reachable by an untrusted network user, the same flaw can expose mail credentials, client inquiry data, assessment records, generated reports, source, and Git metadata.

The Dockerfile independently copies the entire workspace into the image, including files that `.gitignore` excludes. The live Cloudflare origin accepts wildcard CORS preflights on both public API paths. The Worker has no application-level request limits or rate limits, and the inquiry path reports success even if it did not durably save or email the inquiry. The default Python server also listens on every network interface over plain HTTP. The live HTML has no inquiry consent control; the live JavaScript matches the workspace copy.

“Every single vulnerability” cannot be proven by an audit. This report distinguishes confirmed behavior from configuration-dependent exposure and unknown deployment state. I reviewed local code/configuration, made one safe local probe, and checked only public production response headers, CORS preflights, and static asset hashes. I did not send a POST to the production APIs, inspect Cloudflare secrets/settings, build a Docker image, send email, or run the repository's test suites. Current dependency CVEs cannot be established because the project has no resolved dependency lockfile and the active production versions were not available.

## Highest-priority findings

### C-01 — Critical: encoded path traversal reads files outside the allowed static directories

**Affected component:** Python server (`server.py`), including a Docker deployment of that server.

**Evidence:** The server accepts any raw request path beginning with `/assets/` or `/disclosures/` at [server.py](server.py#L633), then passes it to `SimpleHTTPRequestHandler` at lines 638–642. The base handler URL-decodes and normalizes the path while mapping it to a file. The prefix check is therefore performed on a different path representation from the one ultimately opened. Python documents that `SimpleHTTPRequestHandler` maps requests to local files and follows symlinks; the request mapping behavior is also confirmed by the local probe ([Python `http.server` docs](https://docs.python.org/3.12/library/http.server.html#security-considerations)).

**Verification:** On an isolated copy of the server bound to `127.0.0.1`, with an empty temporary data directory and email disabled:

- `HEAD /irah.env` → **404**
- `HEAD /assets/%2e%2e/%2e%2e/irah.env` → **200**
- `HEAD /assets/%2e%2e/%2e%2e/inquiries.json` → **200**

The probe read response headers only, not file contents. It confirms the allowlist escape. The workspace contains the referenced files, but their values and records are not reproduced here. The existing traversal checks in [test_server_live.py](tests/test_server_live.py#L157) test paths outside the allowed prefixes; they do not cover traversal that starts inside an allowed prefix.

**Impact and prerequisites:** Anyone able to reach the Python server can fetch files under the application root without authentication. `HOST` defaults to `0.0.0.0` at [server.py](server.py#L931), so the server is not loopback-only by default. Sensitive targets include `irah.env`, `inquiries.json`, `assessment_submissions.json`, files under `assessment_reports/`, `.git`, and application source. Exact reachability depends on the host firewall and deployment routing.

**Fix:** Serve only an explicit asset allowlist, or map public URLs to a separate static root and verify the resolved canonical path remains inside that root before opening it. Do not rely on raw URL prefix checks. Add regression cases for encoded `..` and encoded separators within every permitted prefix. If this service or any derived image has been reachable by untrusted users, rotate the configured mail credentials after fixing the exposure.

### H-01 — High: Docker image includes ignored secrets and personal data

**Affected component:** Docker build from this workspace.

**Evidence:** [Dockerfile](Dockerfile#L20) uses `COPY . .`. There is no `.dockerignore`. The workspace contains an ignored `irah.env`, inquiry and assessment JSON stores, generated assessment PDFs, a build directory, and `.git`. `.gitignore` only affects Git; it does not filter the Docker build context. Docker documents that files in the selected local build context are available to `COPY`, and `.dockerignore` is the mechanism for excluding them ([Docker build context docs](https://docs.docker.com/build/concepts/context/)).

**Impact and prerequisites:** A build from this directory can place mail credentials and client data in the image filesystem and image layers. Image registry access, build-cache access, or image export can then disclose them. This is conditional on building/distributing an image from this workspace; no image was built during this audit.

**Fix:** Add a restrictive `.dockerignore`, use an explicit source allowlist, provide credentials through runtime secret injection, and put persistent data on a protected volume or managed database. Treat previously published images as compromised and rotate credentials if they contained this local configuration.

### H-02 — High: Cloudflare public endpoints can be used for unmetered email and compute abuse

**Affected component:** `_worker.js` in Pages Advanced Mode.

**Evidence:** The Worker accepts public requests in [_worker.js](_worker.js#L1196), sets `Access-Control-Allow-Origin: *` at lines 1199–1203, parses bodies directly with `request.json()` at lines 1220 and 1343, and has no application-level body-size, field-length, request-rate, or bot checks on `/api/enquire` and `/api/submit-assessment-report`. The report route generates a PDF and sends an email attachment from caller-provided data. The Worker retries Resend with a second sender on failure at lines 1141–1185.

**Live confirmation:** `OPTIONS` requests to both production API paths from an unrelated Origin returned HTTP 200 with `Access-Control-Allow-Origin: *`. No production POST was sent.

Cloudflare Pages Advanced Mode ignores the entire `/functions` directory when `_worker.js` is used ([Cloudflare Advanced Mode docs](https://developers.cloudflare.com/pages/functions/advanced-mode/)). This workspace's build output contains both, so the Worker is the operative implementation for an Advanced Mode deployment; reviewing or fixing only `functions/api/*` would not secure it.

**Impact and prerequisites:** Any unauthenticated caller can repeatedly trigger PDF generation and provider requests, consume email quota, generate unwanted messages to the configured desk, and send large fields/bodies for parsing. Wildcard CORS makes browser-based cross-origin calls easy. CORS is not the root cause—the endpoints are intentionally public—but it increases the number of ways to drive the abuse. Cloudflare's platform protections may reduce volumetric traffic, but they do not replace endpoint-level limits.

**Fix:** Apply edge rate limits and bot controls; reject oversized `Content-Length` and oversized streamed bodies before JSON parsing; cap every field, category count, and action-plan length; bound PDF work; use idempotency keys; allow only the actual site origin; and alert on provider quota/volume anomalies.

### H-03 — High: local/Docker server exposes personal data over plaintext HTTP on all interfaces

**Affected component:** Python server and direct Docker port exposure.

**Evidence:** `HOST` defaults to `0.0.0.0` in [server.py](server.py#L931), and the application uses `http.server` without TLS. The launcher opens `http://127.0.0.1:8088`, but binding to all interfaces also permits connections through the machine's LAN address unless blocked by the host firewall. The Dockerfile exposes port 8080 at [Dockerfile](Dockerfile#L22).

**Impact and prerequisites:** If accessed from another device or exposed directly to the Internet, inquiry details, assessment data, PDF responses, and the `X-Admin-Key` header travel without application-layer transport encryption. A network observer can read or alter traffic. This is mitigated only if a trusted TLS reverse proxy is in front and the backend hop is also protected or isolated.

**Fix:** Bind the local/dev server to `127.0.0.1` by default. For production, terminate HTTPS at a hardened reverse proxy, force HTTPS/HSTS at the edge, restrict the backend to that proxy, and do not publish the Python port directly.

### H-04 — High: administrator secret is printed into process logs

**Affected component:** Python `/api/inquiries` endpoint.

**Evidence:** [server.py](server.py#L937) prints `ADMIN_SECRET_KEY` at startup. That key is accepted in `X-Admin-Key` and authorizes the full inquiry list at lines 608–630. The key is initialized during module import at line 45, before `load_env_file()` is called at line 951; therefore, setting `IRAH_ADMIN_KEY` only in `irah.env` does not configure the key used by the process.

**Impact and prerequisites:** Anyone with retained process/container logs can recover the active key and retrieve the inquiry store. The environment-file ordering also makes operator expectations about key rotation/persistence unreliable.

**Fix:** Never log the secret. Load trusted configuration before constructing it, use a real admin identity/authentication mechanism instead of a shared header key, rotate any key in existing logs, and restrict access to the inquiry endpoint at the network layer.

### H-05 — High: inquiry forms manufacture a consent record without user consent

**Affected component:** Browser inquiry forms, Python and edge intake endpoints.

**Evidence:** Neither inquiry form in [index.html](index.html#L1216) or [index.html](index.html#L1389) presents an affirmative consent control. Both browser handlers set `consent.given: true` unconditionally at [app.js](app.js#L502) and [app.js](app.js#L543). The server accepts that client-provided boolean and stores it as consent at [server.py](server.py#L731). The privacy notice says the collection is based on explicit consent at [index.html](index.html#L1358). The assessment share checkbox exists, but its API flag is also caller-controlled and can be set to true by any direct request.

**Live confirmation:** The fetched production HTML contains the assessment-share checkbox but no inquiry consent control; the live `app.js` SHA-256 matches the workspace `app.js`.

**Impact:** The system records a consent assertion that was not actually made in the inquiry flows. This undermines the integrity of consent evidence and creates a privacy-control failure. This is a cybersecurity/privacy finding, not a determination of legal compliance.

**Fix:** Add a clear unchecked consent control to both inquiry forms and require it in the UI and API payload. Record the notice version actually shown, timestamp on the server, and the action taken. Do not claim an API boolean proves a person's identity or consent; protect the resulting records and honor withdrawal/deletion requests.

### H-06 — High: Cloudflare inquiry route can falsely acknowledge and lose submissions

**Affected component:** Cloudflare Worker inquiry route and browser receipt logic.

**Evidence:** The Worker only attempts email delivery at [_worker.js](_worker.js#L1306); it does not persist the inquiry. It returns a success response and reference ID even when `email_delivery` is `fallback` at lines 1314–1327. The browser treats any `resp.ok` response with a reference ID as delivered at [app.js](app.js#L505), ignoring `email_dispatched`.

**Impact:** With missing/invalid Resend credentials, provider restrictions, or an outage, an inquiry can be discarded while the user sees a success receipt. An attacker can also trigger this path repeatedly to create operational confusion and consume provider calls.

**Fix:** Write the inquiry to durable storage/queue before acknowledging it. Return a distinct queued/failed result, and only clear the form after durable acceptance. The UI should not equate “HTTP 200” or “reference ID exists” with delivery.

## Additional cybersecurity findings

### M-01 — Medium: public report API accepts caller-invented scores and report contents

**Evidence:** The Python report endpoint checks that the request contains dictionaries and `consent_to_share: true`, then passes client-supplied scores/categories into the PDF generator at [server.py](server.py#L826) and [server.py](server.py#L841). The Worker clamps scores but still takes them from the caller at [_worker.js](_worker.js#L1238) and renders caller-provided categories/action plans at lines 1243–1258. There is no server-side recomputation from a canonical answer set.

**Impact:** Anyone can generate and email an IRAH-branded report containing fabricated scores and recommendations, and create storage/email work. Because this is a self-assessment, user-provided answers are expected; the security risk is treating caller-controlled derived scores as authentic server-validated results.

**Fix:** Recompute scores server-side from validated answers and a versioned canonical questionnaire, or label the output clearly as user-submitted and never rely on it as a verified assessment. Apply the abuse limits in H-02.

### M-02 — Medium: `/api/inquiries` responses lack explicit no-store policy

**Evidence:** The protected GET response returns the full inquiry JSON at [server.py](server.py#L627), but does not set `Cache-Control: no-store`. The shared `end_headers()` method only adds `no-store` for the public HTML/JS/CSS paths at lines 570–572. The secret is in `X-Admin-Key`, which is not a standard `Authorization` header and is not added to `Vary`.

**Impact:** A reverse proxy or non-default cache rule could store a successful response and later reuse it without the custom key. Default CDNs may not cache this route, so exploitability depends on intermediary configuration; the sensitive response should not rely on that default.

**Fix:** Add `Cache-Control: no-store, private` to all admin and report responses, set appropriate `Vary` if needed, and explicitly bypass caching at every proxy/CDN layer.

### M-03 — Medium: client and assessment records have no enforced expiry or secure deletion

**Evidence:** Inquiry and assessment records are appended indefinitely by [server.py](server.py#L519); generated PDFs are written under `assessment_reports` at lines 859–860. There is no retention/expiry or deletion routine. Failed browser submissions are copied to `localStorage` at [app.js](app.js#L526) and [app.js](app.js#L562), capped at five entries but never time-expired or automatically retried/deleted.

**Impact:** Financial profile data, contact details, and PDFs persist on disk and in browser profiles beyond the stated purpose. More retained data increases the impact of a later filesystem, backup, device, or account compromise.

**Fix:** Define short retention periods by data type, automate deletion and backup expiry, provide a deletion workflow, and add a clear action/TTL for local browser data. Prefer a protected datastore over rewrite-on-every-request JSON files.

### M-04 — Medium: inquiry email `Reply-To` is caller-controlled and not verified

**Evidence:** The Worker uses the submitted `email` directly as `replyTo` at [_worker.js](_worker.js#L1306)–1311. The edge intake checks only that `email` is nonempty at lines 1233–1245; it does not validate format or verify control of the mailbox.

**Impact:** A submitter can make an official-looking IRAH notification appear to come from another person by setting that person's address as Reply-To. Staff replying to the message may disclose information to an attacker-controlled address. Email providers may reject malformed values, but a syntactically valid spoofed address is sufficient for the social-engineering risk.

**Fix:** Validate email syntax, mark the address as unverified, do not reply with sensitive information until ownership is verified, and include a safe support workflow. Consider keeping inbound mail replies directed to a controlled mailbox until verification.

### M-05 — Medium: SMTP encryption can be disabled while credentials are still sent

**Evidence:** [server.py](server.py#L225) allows `IRAH_SMTP_STARTTLS=0`; the send path still calls `smtp.login()` whenever a password is configured at lines 393–400 and 492–499.

**Impact:** If deployed with STARTTLS disabled and credentials present, SMTP authentication and report contents may travel in plaintext or without authenticated transport to the configured SMTP host. The default is STARTTLS on, so this is configuration-dependent.

**Fix:** Disallow password authentication unless TLS is established and certificate-validated. Restrict non-TLS SMTP to a local test sink with no credentials and fail closed in production.

### M-06 — Medium: configurable Resend URL can receive the bearer API key

**Evidence:** [server.py](server.py#L246) accepts `IRAH_RESEND_URL` from environment configuration; `_send_via_resend()` sends `Authorization: Bearer <key>` to that URL at lines 323–329 without requiring HTTPS or allowlisting the host.

**Impact:** A misconfigured or attacker-influenced environment variable can send the Resend API key and report data to an arbitrary endpoint, potentially over plaintext HTTP. No user request directly controls this value, so this is a configuration/secret-egress risk, not an unauthenticated SSRF finding.

**Fix:** Hard-code the official HTTPS endpoint or allowlist `https://api.resend.com/emails`; reject other schemes/hosts and never forward the bearer token to a configurable URL.

### M-07 — Medium: denial-of-service paths remain in the Python server

**Evidence:** The server uses `ThreadingMixIn` with no maximum worker-thread count at [server.py](server.py#L544), and a 10-second per-connection timeout at line 553. The in-memory `_HITS` map at lines 48–62 prunes entries only for the current IP, so entries for inactive unique IPs remain indefinitely. JSON stores are rewritten in full on every append at lines 519–537, with no retention or total-size limit. The Python endpoint limits are per IP and process-local; they do not constrain the Cloudflare Worker.

**Impact:** Distributed clients can bypass per-IP limits, cause many PDF jobs/provider calls, grow the hit-map, keep request threads occupied with slow connections, and grow the data directory until disk exhaustion. On a deployment behind a proxy, all traffic may also be counted as the proxy address and legitimate users can be rate-limited together.

**Fix:** Put a production-grade reverse proxy in front; cap concurrent connections and request read time; use distributed rate limiting at the edge; bound total stored records and PDFs; add disk-space alerts; and use a bounded datastore/queue.

### M-08 — Medium: Linux container runs as root and creates data without restrictive modes

**Evidence:** [Dockerfile](Dockerfile#L2) contains no `USER` directive, so the application runs as root by default. The server creates data/report directories and files with ordinary `os.makedirs`/`open` calls at [server.py](server.py#L64), [server.py](server.py#L859), and [server.py](server.py#L872), without setting restrictive permissions or a process umask.

**Impact:** In the standard Debian container environment, default umask behavior can make created directories/files readable by other local processes. Root execution also increases the impact of any future code execution or dependency compromise. This assumes the container is built and run with default permissions; mounted-volume settings can differ.

**Fix:** Run as a dedicated non-root UID, set a restrictive umask, create data directories with owner-only access, make the application filesystem read-only where possible, and mount only the required data directory.

### M-09 — Medium: edge deployment has no explicit browser security headers

**Evidence:** There is no `_headers` file. The Worker returns static assets directly through `env.ASSETS.fetch(request)` at [_worker.js](_worker.js#L1472); it does not add CSP, `frame-ancestors`/`X-Frame-Options`, HSTS, `Referrer-Policy`, `X-Content-Type-Options`, or `Permissions-Policy`. The Python server sets several of these locally, but those headers do not automatically carry over to Cloudflare. A live `HEAD https://irah.co.in/` returned HTTP 200 via Cloudflare with `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`, but no CSP, X-Frame-Options, Strict-Transport-Security, or Permissions-Policy. A live HTTP `HEAD` returned 301 to HTTPS; HSTS was absent on the HTTPS response.

**Impact:** The edge-served website lacks defense-in-depth against framing/clickjacking, content injection, MIME sniffing, and referrer leakage unless equivalent headers are configured in the Cloudflare dashboard or another outer layer. This is a conditional deployment finding. I did not identify an obvious path from untrusted user input into the current `innerHTML` sinks: the receipt values are escaped, while article and questionnaire content are static.

**Fix:** Add and verify a production header policy at the Cloudflare layer, including a tested CSP, `frame-ancestors 'none'` (or the intended embedding policy), HSTS, `nosniff`, and a strict referrer policy. Confirm actual response headers after deployment.

### M-10 — Medium: no dependency lock, hashes, or observed vulnerability scan

**Evidence:** [requirements.txt](requirements.txt) specifies only minimum versions (`reportlab>=4.0`, `matplotlib>=3.7`, `numpy>=1.24`). There is no lockfile or hash-pinned install and no dependency scanning configuration in the workspace. The Docker base tag is mutable and apt packages are not pinned.

**Impact:** Different builds can resolve different dependency versions, and there is no reproducible inventory to match against advisories or investigate a supply-chain incident. This is not evidence that a specific package has a known vulnerability; the resolved production versions were unavailable.

**Fix:** Generate and review a lockfile with hashes, pin base-image digests and build inputs, generate an SBOM, scan dependencies/images in CI, and define a patch cadence.

### M-11 — Medium: duplicate edge implementations create a security-fix trap

**Evidence:** Similar inquiry/report handlers exist in both `_worker.js` and `functions/api/`. The build copies both into `build/`. Cloudflare documents that when Pages Advanced Mode uses `_worker.js`, the entire `/functions` directory is ignored ([Cloudflare docs](https://developers.cloudflare.com/pages/functions/advanced-mode/)). Local test suites import `server.py`; no Cloudflare Worker test harness or Pages deployment config is present.

**Impact:** A fix applied only to `functions/api/*` or validated only through Python tests may not affect the deployed Worker. This increases the chance that the actual public route remains vulnerable after a claimed fix.

**Fix:** Choose one edge execution model, remove or clearly isolate the inactive implementation, and test the exact generated Pages output/Worker routes in CI.

## Lower-severity observations

- `HEAD /api/inquiries` returns `200` before checking `X-Admin-Key` in [server.py](server.py#L652). It returns no inquiry body, so this is endpoint-existence disclosure rather than a PII bypass; make authentication behavior consistent anyway.
- The Cloudflare Worker returns raw `err.message` values on some 500 responses and a `worker_build` marker. This can disclose implementation details but did not reveal a secret in the reviewed code.
- The browser fallback stores full inquiry payloads in `localStorage`. Browser-origin isolation helps, but any same-origin script or person using the same browser profile can read them. No clear/delete control or expiry was found.
- The code review found output escaping in email/PDF paths and no obvious reflected/stored DOM XSS source feeding the current HTML sinks. This reduces evidence of XSS in reviewed flows; it does not prove the absence of all XSS or third-party compromise.

## Exposure matrix

| Deployment mode | Most relevant risks |
|---|---|
| Local `launch.bat` / `python server.py` | Confirmed path traversal; all-interface plaintext HTTP; admin key in logs; unbounded local data retention |
| Docker backend | All Python risks, plus build-context data/secret inclusion, root execution, and weak filesystem permissions |
| Cloudflare Pages Advanced Mode | Public unthrottled endpoints, wildcard CORS, lost inquiries on email failure, no explicit edge headers, duplicate-source maintenance trap |
| Static-only Pages without the Worker | Edge API behavior depends on Pages routing and may fall through to static rewrites; live routing must be inspected before concluding which handler runs |

## Production checks performed

- `HEAD https://irah.co.in/` returned HTTP 200 through Cloudflare. Observed headers included `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Cache-Control: public, must-revalidate, max-age=0`.
- `HEAD http://irah.co.in/` returned HTTP 301 to `https://irah.co.in/`. The HTTPS root response did not include HSTS.
- `OPTIONS` to `/api/enquire` and `/api/submit-assessment-report` from `https://audit-probe.invalid` returned HTTP 200 and wildcard `Access-Control-Allow-Origin`.
- The production `app.js` has the same byte length and SHA-256 as the workspace `app.js`; production `styles.css` also matches. Production `index.html` differs in size/hash, so I checked the live HTML itself for consent controls rather than assuming exact markup parity.
- No production POST was sent; no email or report was generated.

## Recommended order of work

1. Close and regression-test C-01. If the Python service has been reachable, rotate mail credentials and review logs/records for access.
2. Add `.dockerignore`; remove credentials and personal data from all build contexts/layers; rebuild and rotate any exposed secret.
3. Bind the local server to loopback; require HTTPS and isolate the Python backend behind a trusted proxy.
4. Add Cloudflare request/body limits, rate controls, and bot mitigation; secure the actual `_worker.js` route.
5. Remove admin-key logging and repair secret initialization/authentication.
6. Fix consent capture and make edge inquiry acceptance durable.
7. Add data retention/deletion, secure storage permissions, and explicit no-store headers.
8. Lock/scan dependencies and add CI checks against the deployed artifact, not only the Python code.

## Audit limits

The local probe confirmed only HTTP status and content length on the isolated server; no sensitive file body was read. Production checks were limited to public `HEAD`/`OPTIONS` requests and retrieval of public static assets. I did not inspect live DNS/TLS/CDN settings beyond the observed responses, Cloudflare secrets or logs, email-provider configuration, host firewall rules, container registry/cache, filesystem ACLs on a production machine, resolved dependency versions, or actual user traffic. The report therefore marks those exposures conditional instead of asserting they are active in production. No assessment can guarantee discovery of every vulnerability without a defined live target, deployment access, and an agreed penetration-test scope.
