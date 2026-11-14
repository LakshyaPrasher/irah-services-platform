# IRAH Services Application Audit

**Date:** 21 November 2026  
**Scope:** Static review of the checked-out application source, local server, Cloudflare Worker/Pages Functions, Docker configuration, browser flows, assessment/report generator, privacy copy, and existing test layout.  
**Overall assessment:** **High risk; not ready for an internet-facing deployment in its current state.**

## Executive summary

The most serious defect is a path traversal in the Python server's static-file allowlist. A request that begins with an allowed `/assets/` or `/disclosures/` prefix can be decoded and normalized by `SimpleHTTPRequestHandler` to a file outside that directory. The workspace contains mail configuration, inquiry records, assessment submissions, generated reports, and Git metadata, so this can expose secrets and personal data when the server is reachable.

The Docker image has a separate data exposure risk: the production Dockerfile copies the entire repository context without a `.dockerignore`. That includes ignored local configuration and data files. The Cloudflare code also has materially weaker abuse controls and failure handling than the Python server. Contact forms assert consent without asking, and the edge inquiry implementation can report success while dropping the inquiry if email delivery fails.

The review was static. I did not start the application, run tests, exercise a live endpoint, inspect a deployed Cloudflare account, or verify regulatory claims. Findings below describe code paths and configuration present in this workspace; cloud deployment behavior should be confirmed against the actual Pages project.

## Findings

### F-01 — Critical: static-file allowlist can be escaped with path traversal

**Evidence:** [server.py](server.py#L633) checks whether the parsed path equals a public filename or starts with `/assets/` or `/disclosures/`, then delegates the request to `SimpleHTTPRequestHandler` at lines 638–642. The base handler URL-decodes and normalizes paths when mapping them to files. The check therefore happens before path normalization and does not constrain the resolved file to the allowed directory. The server binds to `0.0.0.0` by default at [server.py](server.py#L931).

**Impact:** An encoded traversal such as `/assets/%2e%2e/%2e%2e/irah.env` can pass the prefix check and resolve to a root-level file. The same technique can reach inquiry/submission JSON, PDFs, and potentially `.git` content. The workspace contains a local `irah.env` with configured mail credential keys and personal-data files. This finding is based on static tracing; I did not send a request.

**Remediation:** Replace prefix checks with a static-file handler that maps only explicit files or resolves paths and verifies the final canonical path remains beneath a specific public directory. Do not serve from the repository root. After closing the path, rotate mail credentials if this server or a derived image has been reachable by untrusted users.

### F-02 — High: Docker build copies secrets and customer data into the image

**Evidence:** [Dockerfile](Dockerfile#L20) uses `COPY . .`; there is no `.dockerignore` in the workspace. The repository's [.gitignore](.gitignore) excludes `irah.env`, inquiry/submission JSON, and report files from Git, but Docker does not use `.gitignore` as its build-context filter.

**Impact:** A Docker build from this directory can bake the local mail configuration, customer records, generated assessment PDFs, `.git`, and build artifacts into the image and its layers. Anyone who can pull or inspect that image may recover them, even if the application itself does not serve them. This is conditional on building or distributing an image from this tree.

**Remediation:** Add a restrictive `.dockerignore` before the next build; explicitly allowlist runtime source and assets. Inject secrets at runtime through the deployment secret store. Store records outside the image in a protected volume or managed datastore. If an image has already been published, remove it and rotate credentials.

### F-03 — High: public Cloudflare endpoints lack request caps and abuse controls

**Evidence:** The advanced-mode Worker handles requests in [_worker.js](_worker.js#L1196), enables wildcard CORS at lines 1199–1203, and parses inquiry/report bodies directly with `request.json()` without an application-level byte limit. Its inquiry and report routes at lines 1216 and 1339 have no rate limit. The Pages Functions repeat this pattern; for example, [enquire.js](functions/api/enquire.js#L64) has wildcard CORS and no body-size or rate check. The Python server, by contrast, caps the inquiry/report request bodies and applies per-IP throttles at [server.py](server.py#L669) and [server.py](server.py#L807).

**Impact:** If the Worker/Functions are the deployed API, unauthenticated callers can repeatedly trigger email-provider requests and PDF generation, consume provider quota, and submit arbitrarily large fields/bodies. This makes service and email abuse materially easier than the local implementation. Wildcard CORS makes browser-based cross-origin submission straightforward; the endpoints are public regardless, so it is an amplifier rather than the root issue.

**Remediation:** Enforce body and field-size limits, rate limits, and abuse controls at the edge for both routes. Restrict accepted origins to the actual site. Apply limits before parsing or generating PDFs, and return consistent `413`/`429` responses. Keep the Python and edge policies in one shared specification.

### F-04 — High: inquiry payloads claim consent that the forms never collect

**Evidence:** The two inquiry forms in [index.html](index.html#L1216) and [index.html](index.html#L1389) contain no consent checkbox or equivalent affirmative control. Both submission handlers construct `consent: { given: true, ... }` unconditionally at [app.js](app.js#L502) and [app.js](app.js#L543). The server then records that value as consent at [server.py](server.py#L731), while the privacy policy says the processing is based on explicit consent at [index.html](index.html#L1358).

**Impact:** A person can submit personal data through either inquiry flow without taking an explicit consent action, while the stored record asserts that they did. This conflicts with the product's own privacy notice and makes the consent record unreliable. This is a product/privacy control finding, not a legal conclusion.

**Remediation:** Add a clear, initially unchecked consent control to both forms, require it before submission, and record the notice version actually shown. Do not synthesize `given: true` in client code. Have the privacy notice and retention practice reviewed by qualified counsel.

### F-05 — High: edge inquiries can be acknowledged and then lost

**Evidence:** The Worker and Pages Function send the inquiry through Resend but do not persist it. The Function returns HTTP 200 with a reference ID even when `emailDelivery` is `fallback` at [enquire.js](functions/api/enquire.js#L165); the Worker follows the same pattern at [_worker.js](_worker.js#L1306). The browser treats any successful response with a reference ID as delivered at [app.js](app.js#L505), regardless of `email_dispatched`.

**Impact:** If the email key is absent, invalid, restricted, or Resend is unavailable, the edge path can still show a successful receipt and discard the submitted inquiry. The local Python path persists before attempting email, so behavior changes depending on which backend is active.

**Remediation:** Persist the inquiry to a durable queue/store before returning success. Make the UI distinguish “accepted and queued” from “email sent,” and only clear the form after durable acceptance. Return a retryable failure if the record was not saved.

### F-06 — High: the running assessment has 15 questions, not the documented 54

**Evidence:** The browser assessment declares methodology `2026.4-condensed-15` and `total_questions: 15` at [app.js](app.js#L1973); it renders 8 health and 7 risk questions. The UI also states 15 at [index.html](index.html#L1077). However, [README.md](README.md) describes a 54-question quantitative questionnaire. `assessment_engine_data.json` also declares `total_questions: 15`; the HTML loads `app.js` but does not load this JSON as its live question source.

**Impact:** The checked-in documentation and live assessment describe different product scope. Reviewers and operators may believe the runtime performs the broader assessment, and tests/data built around a separate dataset may not validate the questions users actually answer.

**Remediation:** Decide which assessment is intended. Update the README and related handover material to describe the 15-question runtime, or make the UI load the canonical 54-question data and remove duplicated hard-coded question definitions. Add a check that the documented/runtime question count agrees.

### F-07 — Medium: administrator access key is written to application logs

**Evidence:** [server.py](server.py#L937) prints the full `ADMIN_SECRET_KEY` at startup. That key authorizes `GET /api/inquiries`, which returns the complete inquiry store at lines 608–630.

**Impact:** Anyone with access to shared container/process logs can recover the credential and read all stored inquiries through the protected endpoint. Log access is often broader and longer-lived than application-secret access.

**Remediation:** Remove the key from startup output. Provision admin access through a proper secret-management and authentication mechanism, and rotate any key that may already be present in retained logs.

### F-08 — Medium: retention promises are not enforced by the application

**Evidence:** The privacy policy says inquiry data is retained only as long as necessary and then erased at [index.html](index.html#L1362). The Python service appends inquiry/submission records indefinitely and writes each report PDF to `assessment_reports` at [server.py](server.py#L859) and [server.py](server.py#L872); the JSON append helper has no expiry at [server.py](server.py#L519). No retention or deletion workflow was found in the reviewed code.

**Impact:** Records and detailed assessment PDFs can accumulate indefinitely, and the application has no mechanism to carry out the stated deletion/erasure lifecycle. This increases the amount of sensitive data exposed by a storage or backup incident.

**Remediation:** Define retention periods by record type, implement deletion/expiry and access logging, and ensure backups follow the same policy. Align the privacy statement with the actual process.

### F-09 — Medium: required profile fields are silently replaced with defaults

**Evidence:** Stage 1 presents required profile controls in [index.html](index.html#L1058), but its “Proceed” button is `type="button"`; the handler only checks the client name before advancing at [app.js](app.js#L2056). `collectProfile()` substitutes default age, family, employment, income, and goal values at [app.js](app.js#L2126).

**Impact:** Users can skip fields marked required and receive a report containing plausible but unprovided profile values. Those fields can affect report interpretation and may mislead the client or staff reviewing it.

**Remediation:** Run `checkValidity()`/`reportValidity()` on the full profile form before advancing, and avoid filling missing user data with substantive profile defaults in generated reports.

### F-10 — Medium: personalized product guidance needs a compliance boundary review

**Evidence:** The PDF generator derives score-based product category statements, including equity, liquid, hybrid, and debt mutual-fund language at [assessment_pdf_generator.py](assessment_pdf_generator.py#L329) and generates a client-specific action plan at lines 383–402. The site also says the service is non-advisory at [index.html](index.html#L1353).

**Impact:** The generated report presents individualized product-oriented actions alongside a non-advisory description. This is a material content and distribution-boundary risk that a code audit cannot determine as compliant or non-compliant.

**Remediation:** Have the actual questionnaire, score interpretation, action plan, distribution flow, and disclosures reviewed together by qualified compliance counsel. Ensure the report's wording and intended use match the approved operating model.

## Positive controls observed

- The Python report endpoint caps request size and checks an explicit assessment-share flag.
- The inquiry endpoint requires a consent field, sanitizes text, and escapes email HTML; the issue is that the browser invents the consent value.
- The Python backend serializes PDF generation and uses atomic JSON-file replacement for threaded writes.
- The local server sets a restrictive CSP and several standard browser security headers.
- Report generation returns a PDF download even when email delivery is not configured, and the local inquiry path persists data before email dispatch.

## Recommended remediation order

1. Close F-01, then rotate credentials if this server or a Docker image was exposed.
2. Add `.dockerignore`, rebuild clean images, and move all secrets and customer data out of image layers (F-02).
3. Apply request caps and abuse controls to the Cloudflare endpoints (F-03).
4. Correct consent capture and durable inquiry acceptance (F-04 and F-05).
5. Remove admin-key logging; define and enforce retention (F-07 and F-08).
6. Align the assessment question source, profile validation, and approved content boundary (F-06, F-09, F-10).

## Audit limits

This is a static review of the workspace only. I did not run the existing test suite, launch a local server, build the Docker image, send requests to the endpoints, inspect the deployed Cloudflare configuration or provider logs, review dependency vulnerabilities, or validate legal/regulatory statements against external authorities. The path-traversal finding follows the handler's allowlist and delegated path-normalization behavior; it should be confirmed in a controlled environment after the fix is prepared.
