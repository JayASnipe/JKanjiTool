"""
bump.py — J Kanji Tool deploy helper
Run from your repo root: python bump.py

Updates the version string in sw.js and index.html using today's date,
then prints the git commands to copy-paste.
"""

import re
from datetime import datetime

# Version format: YYYYMMDDHHmm (e.g. 202506151430)
NEW_V = datetime.now().strftime("%Y%m%d%H%M")

# ── sw.js ──────────────────────────────────────────────────────────────────
with open("sw.js", "r", encoding="utf-8") as f:
    sw = f.read()

# Replace cache name: kanji-vX  →  kanji-YYYYMMDD
sw_new = re.sub(r"kanji-v?\d[\w]*", f"kanji-{NEW_V}", sw)

# Replace all ?v=X query strings in PRECACHE
sw_new = re.sub(r"\?v=[\w]+", f"?v={NEW_V}", sw_new)

with open("sw.js", "w", encoding="utf-8") as f:
    f.write(sw_new)

print(f"sw.js      → cache name: kanji-{NEW_V}, query strings: ?v={NEW_V}")

# ── index.html ─────────────────────────────────────────────────────────────
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

html_new = re.sub(r"var V = '\?v=[\w]+'", f"var V = '?v={NEW_V}'", html)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_new)

print(f"index.html → var V = '?v={NEW_V}'")

# ── done ───────────────────────────────────────────────────────────────────
print()
print("Now run:")
print("  git add -A")
print(f'  git commit -m "deploy {NEW_V}"')
print("  git push")
