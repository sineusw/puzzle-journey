#!/bin/sh
# Rebuild the static preview bundle into $1 (default: scratch preview-dist).
set -e
OUT=${1:-/tmp/claude-0/-home-claude/b929bcc4-5c3d-5106-a292-9d563534b856/scratchpad/preview-dist}
MINIFY=${2:-true}
cd /home/claude/puzzle-journey
sed "s#outDir: \"[^\"]*\"#outDir: \"$OUT\"#" node_modules/.preview/vite.preview.config.mts > node_modules/.preview/vite.out.config.mts
./node_modules/.bin/vite build --config node_modules/.preview/vite.out.config.mts --minify $MINIFY 2>&1 | grep -E "built in|rror"
cd "$OUT"
rm -rf __grok og.jpg x-banner.jpg
python3 - <<'PY'
import glob
for f in glob.glob('assets/*.js'):
    s=open(f).read()
    for p in ['/art/','/icons/','/characters/','/music/']:
        s=s.replace('"'+p,'"./'+p[1:]).replace('`'+p,'`./'+p[1:])
    for p in ['/isle-bg.jpg','/favicon.svg']:
        s=s.replace('"'+p,'"./'+p[1:])
    s=s.replace('url(/art/','url(./art/')
    open(f,'w').write(s)
PY
JS=$(ls assets/*.js | xargs -n1 basename); CSS=$(ls assets/*.css | xargs -n1 basename)
cat > index.html <<HTML
<title>Block Journey</title>
<meta name="theme-color" content="#071428" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800&display=swap" />
<link rel="stylesheet" href="./assets/$CSS" />
<style>
  /* Single dark look: the game paints its own night-island scene. */
  :root { color-scheme: dark; --pj-page: #071428; }
  /* The viewer pads <html> for the notch and home bar; keep that padding
     inside the 100% height instead of adding to it. */
  html { height: 100%; min-height: 0; box-sizing: border-box; background: var(--pj-page); }
  body { height: 100%; min-height: 0; margin: 0; background: var(--pj-page); }
  body { overflow: hidden; }
  #root { height: 100%; min-height: 0; }
  /* Fit inside the host's safe-area padding instead of the full 100dvh. */
  .pj-root, .pj-stage { height: 100%; min-height: 0; }
</style>
<div id="root"></div>
<script type="module" src="./assets/$JS"></script>
HTML
echo "leftover absolute asset paths: $(grep -o '[("`]/\(art\|icons\|characters\|music\)/' assets/*.js | wc -l)"
ls assets
