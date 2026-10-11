"""Shared test setup: every test runs against a throwaway data directory and never touches the real
inquiries.json / assessment_submissions.json / assessment_reports/. Import this BEFORE `import server`."""
import os
import tempfile

TEST_DATA_DIR = tempfile.mkdtemp(prefix="irah_test_")
os.environ["IRAH_DATA_DIR"] = TEST_DATA_DIR
os.environ["IRAH_DISABLE_RATE_LIMIT"] = "1"
for _k in ("IRAH_GMAIL_APP_PASSWORD", "IRAH_SMTP_HOST", "IRAH_SMTP_PORT", "IRAH_SMTP_USER"):
    os.environ.pop(_k, None)
