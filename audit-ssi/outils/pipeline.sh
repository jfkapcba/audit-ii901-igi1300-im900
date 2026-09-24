#!/bin/bash
# Chaîne de fabrication complète : PDF officiels -> audit-ssi.html
#
# Pré-requis : pdftotext (poppler-utils), Python 3, et les trois PDF officiels
# déposés dans outils/refs/ sous les noms ii901.pdf, igi1300.pdf, im900.pdf.
set -euo pipefail
cd "$(dirname "$0")"

echo "== 0. Extraction du texte des PDF =="
for f in ii901 igi1300 im900; do
  [ -f "refs/$f.pdf" ] || { echo "manquant : outils/refs/$f.pdf — voir outils/README.md"; exit 1; }
  pdftotext -layout -enc UTF-8 "refs/$f.pdf" "refs/$f.txt"
  printf '   %-8s %s lignes\n' "$f" "$(wc -l < "refs/$f.txt")"
done

[ -f "refs/anssi-igi1300-exigences.xlsx" ] || {
  echo "manquant : outils/refs/anssi-igi1300-exigences.xlsx — voir outils/README.md"; exit 1; }
printf '   %-8s listing des exigences ANSSI\n' "igi1300"

echo "== 1. Découpage en sections =="
python3 extraire_igi1300.py
python3 extraire_ii901.py
python3 extraire_im900.py | head -2

echo "== 2. Recollage des intitulés coupés =="
python3 recoller.py

echo "== 3. Exigences officielles =="
python3 regles901.py | head -1
python3 extraire_anssi_igi1300.py

echo "== 4. Construction des données =="
python3 construire_donnees.py

echo "== 5. Assemblage de la page =="
python3 assembler.py
