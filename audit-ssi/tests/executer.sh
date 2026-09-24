#!/bin/bash
# Exécute la suite d'assertions dans un navigateur réel, réseau coupé.
#
# Le harnais est injecté dans une copie de la page ; le fichier livré n'est
# jamais modifié. Chromium est cherché dans $CHROME, puis dans le PATH.
set -euo pipefail
cd "$(dirname "$0")"

PAGE="../audit-ssi.html"
[ -f "$PAGE" ] || { echo "audit-ssi.html introuvable — lancez outils/pipeline.sh"; exit 1; }

NAVIGATEUR="${CHROME:-}"
if [ -z "$NAVIGATEUR" ]; then
  for c in chromium chromium-browser google-chrome google-chrome-stable chrome; do
    if command -v "$c" >/dev/null 2>&1; then NAVIGATEUR="$(command -v "$c")"; break; fi
  done
fi
[ -n "$NAVIGATEUR" ] || { echo "aucun navigateur trouvé ; définissez CHROME=/chemin/vers/chrome"; exit 1; }

TRAVAIL="$(mktemp -d)"
trap 'rm -rf "$TRAVAIL"' EXIT

python3 - "$PAGE" harnais.html "$TRAVAIL/page-de-test.html" <<'PY'
import sys
page, harnais, sortie = sys.argv[1:4]
html = open(page, encoding="utf-8").read()
test = open(harnais, encoding="utf-8").read()
open(sortie, "w", encoding="utf-8").write(html.replace("</body>\n</html>", test + "\n</body>\n</html>"))
PY

# --host-resolver-rules coupe toute résolution DNS : si la page tentait le
# moindre accès réseau, il échouerait et les assertions le verraient.
"$NAVIGATEUR" --headless --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --user-data-dir="$TRAVAIL/profil" --host-resolver-rules="MAP * ~NOTFOUND" \
  --window-size=1400,900 --virtual-time-budget=9000 \
  --dump-dom "file://$TRAVAIL/page-de-test.html" > "$TRAVAIL/dom.html" 2>/dev/null

python3 - "$TRAVAIL/dom.html" <<'PY'
import sys, re, html
dom = open(sys.argv[1], encoding="utf-8").read()
bloc = re.search(r'<pre id="RESULTATS">(.*?)</pre>', dom, re.S)
if not bloc:
    print("Le harnais n'a produit aucun résultat : la page n'a pas abouti."); sys.exit(1)
lignes = html.unescape(bloc.group(1)).split("\n")
echecs = [l for l in lignes if not l.startswith("OK") and "aucune" not in l]
for l in lignes:
    print(l)
print()
print("%d assertions passées, %d échec(s)" % (len([l for l in lignes if l.startswith("OK")]), len(echecs)))
sys.exit(1 if echecs else 0)
PY
