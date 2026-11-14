#!/usr/bin/env python3
"""IRAH Services LLP - Standalone HTML Asset Bundler (index.html + styles.css + app.js -> standalone.html)."""
import os
import re

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
read_asset = lambda name: open(os.path.join(DIRECTORY, name), "r", encoding="utf-8").read()

html, css, js = read_asset("index.html"), read_asset("styles.css"), read_asset("app.js")
html = re.sub(r'<link rel="stylesheet" href="styles\.css(?:\?[^"]*)?">', lambda _: f"<style>\n{css}\n</style>", html)
html = re.sub(r'<script src="app\.js(?:\?[^"]*)?"></script>', lambda _: f"<script>\n{js}\n</script>", html)
html = "\n".join(line for line in html.splitlines() if line.strip()) + "\n"

out_path = os.path.join(DIRECTORY, "standalone.html")
with open(out_path, "w", encoding="utf-8", newline="\n") as f:
    f.write(html)

print(f"Successfully generated standalone bundle: {out_path} ({os.path.getsize(out_path):,} bytes, {len(html.splitlines()):,} lines)")
