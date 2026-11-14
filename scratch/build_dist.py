import os
import shutil
import zipfile

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BUILD_DIR = os.path.join(BASE_DIR, "build")

os.makedirs(BUILD_DIR, exist_ok=True)
os.makedirs(os.path.join(BUILD_DIR, "functions", "api"), exist_ok=True)

# Files to copy to root of build/
root_files = [
    "index.html",
    "styles.css",
    "app.js",
    "standalone.html",
    "assessment_engine_data.json",
    "favicon.ico",
    "_redirects",
    "_worker.js"
]

for rf in root_files:
    src = os.path.join(BASE_DIR, rf)
    dst = os.path.join(BUILD_DIR, rf)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"Copied {rf} to build/")

# Functions api files
api_files = ["enquire.js", "submit-assessment-report.js"]
for af in api_files:
    src = os.path.join(BASE_DIR, "functions", "api", af)
    dst = os.path.join(BUILD_DIR, "functions", "api", af)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"Copied functions/api/{af} to build/functions/api/")

# Directories to copy
dirs_to_copy = ["disclosures", "assets"]
for d in dirs_to_copy:
    src = os.path.join(BASE_DIR, d)
    dst = os.path.join(BUILD_DIR, d)
    if os.path.exists(src):
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        print(f"Copied directory {d}/ to build/{d}/")

# Create fresh build.zip in BASE_DIR
zip_path = os.path.join(BASE_DIR, "build.zip")
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(BUILD_DIR):
        for f in files:
            full_p = os.path.join(root, f)
            rel_p = os.path.relpath(full_p, BUILD_DIR)
            z.write(full_p, rel_p)

print(f"Successfully created {zip_path} ({os.path.getsize(zip_path):,} bytes)")
