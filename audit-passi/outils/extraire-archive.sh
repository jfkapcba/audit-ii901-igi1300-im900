#!/bin/bash
# Extrait, en UNE passe, les textes, sections et articles de tous les arrêtés
# recensés. Les trois niveaux partagent le préfixe numérique de répertoire dérivé
# de l'identifiant du texte (000033518925 -> 00/00/33/51), ce qui permet de tout
# attraper sans connaître à l'avance les identifiants de sections et d'articles.
set -euo pipefail
cd "$(dirname "$0")"
python3 - << 'PY'
import json
ids = json.load(open("arretes-recenses.json", encoding="utf-8"))
motifs = []
for identifiant in ids:
    chiffres = identifiant.replace("JORFTEXT", "")
    prefixe = "/".join(chiffres[i:i+2] for i in range(0, 8, 2))   # quatre paires
    for niveau in ("TEXT", "SCTA", "ARTI"):
        motifs.append("*/JORF/%s/%s/*" % (niveau, prefixe))
open("motifs-tous.txt", "w").write("\n".join(sorted(set(motifs))))
print("  %d textes, %d motifs d'extraction" % (len(ids), len(set(motifs))))
PY
mapfile -t motifs < motifs-tous.txt
mkdir -p extrait
tar -xzf jorf-global.tar.gz -C extrait --wildcards --no-anchored "${motifs[@]}" 2>/dev/null || true
echo "  fichiers présents : $(find extrait -name 'JORF*.xml' | wc -l)"
