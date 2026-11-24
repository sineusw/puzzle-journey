#!/usr/bin/env bash
# Builds the game and snapshots it into mobile/www for the iPhone app:
# the server-rendered home page becomes index.html, plus every static asset.
set -euo pipefail
cd "$(dirname "$0")/../.."
[ "${SKIP_BUILD:-}" = 1 ] || npm run build
PORT=8091
npx --no-install vite preview --port $PORT --host 127.0.0.1 --strictPort >/tmp/pj-ssr.log 2>&1 &
SSR=$!
trap 'kill $SSR 2>/dev/null || true' EXIT
for i in $(seq 1 40); do curl -sf "http://127.0.0.1:$PORT/" -o /dev/null && break; sleep 0.5; done
rm -rf mobile/www && mkdir -p mobile/www
cp -R .vercel/output/static/. mobile/www/
curl -sf "http://127.0.0.1:$PORT/" -o mobile/www/index.html
# The website-only preview badge script and web analytics don't belong in the app.
python3 - mobile/www/index.html <<'PY'
import re, sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()
s = re.sub(r'<script[^>]*grok\.com[^>]*>\s*</script>', '', s)
s = re.sub(r'<script[^>]*/_vercel/insights[^>]*>\s*</script>', '', s)
open(p, "w", encoding="utf-8").write(s)
PY
rm -rf mobile/www/__grok
echo "www ready: $(du -sh mobile/www | cut -f1)"
