#!/usr/bin/env python3
"""
IRAH Services LLP - Standalone HTML Asset Bundler
Packages index.html, styles.css, and app.js into a single zero-dependency standalone.html file.
"""

import os

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(DIRECTORY, "index.html"), "r", encoding="utf-8") as f:
    html = f.read()

with open(os.path.join(DIRECTORY, "styles.css"), "r", encoding="utf-8") as f:
    css = f.read()

with open(os.path.join(DIRECTORY, "app.js"), "r", encoding="utf-8") as f:
    js = f.read()

# Replace stylesheet link with inline <style>
html = html.replace(
    '<link rel="stylesheet" href="styles.css">',
    f'<style>\n{css}\n</style>'
)

# Replace script tag with inline <script>
html = html.replace(
    '<script src="app.js"></script>',
    f'<script>\n{js}\n</script>'
)

out_path = os.path.join(DIRECTORY, "standalone.html")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Successfully generated standalone bundle: {out_path} ({os.path.getsize(out_path):,} bytes)")
