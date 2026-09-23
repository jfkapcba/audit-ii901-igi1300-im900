# Chaîne de fabrication du fichier d'audit

Ces scripts reconstruisent `../audit-ssi.html` à partir des PDF officiels. Ils ne sont pas
nécessaires pour utiliser l'outil : ils servent à le régénérer quand un texte est mis à jour.

## Pré-requis

`pdftotext` (paquet `poppler-utils`), Python 3, et les trois PDF officiels placés dans
`refs/` sous les noms `ii901.pdf`, `igi1300.pdf`, `im900.pdf` :

* II 901 — <https://www.legifrance.gouv.fr/circulaire/id/39217>
* IGI 1300 — arrêté du 9 août 2021, PDF publié par le ministère des Armées
* IM 900 — arrêté du 27 août 2025, JORF du 1er octobre 2025

```bash
for f in ii901 igi1300 im900; do pdftotext -layout -enc UTF-8 refs/$f.pdf refs/$f.txt; done
./pipeline.sh          # extraction et découpage -> refs/*.json puis build/*.json
python3 assembler.py   # assemblage de la page finale
```

## Rôle de chaque script

| Script | Rôle |
|---|---|
| `extraire.py` | Découpage générique d'un texte `pdftotext -layout` en sections numérotées : retrait des en-têtes, des pieds de page et des blocs de notes, recollage des paragraphes. Utilisé pour l'IGI 1300. |
| `extraire2.py` | Découpage de l'II 901 par article, avec correction des artefacts d'océrisation (le seul exemplaire publié est un scan). |
| `extraire_im900.py` | Découpage de l'IM 900. Les intitulés du corps étant éclatés par la mise en page du Journal officiel, le sommaire sert de plan et le corps n'est repéré que par ses marqueurs de numéro. |
| `recoller.py` | Recolle les intitulés de section coupés sur deux lignes. |
| `regles901.py` | Découpe l'annexe 1 de l'II 901 en ses 178 règles codées (`ORG-SSI`, `PDT-CONFIG`…). |
| `mapping.json` | Rattachement des 254 points de contrôle aux sections officielles. C'est le seul fichier à compléter à la main quand on ajoute un point de contrôle. |
| `construire_donnees.py` | Assemble les corpus et le catalogue en JSON compact pour l'injection dans la page. |
| `assembler.py` | Concatène styles, balisage, blocs de données et modules de code en un fichier unique. |

## Ajouter un point de contrôle

1. L'ajouter dans le catalogue source, avec son identifiant, son intitulé, son énoncé de contrôle
   et ses éléments de preuve.
2. Ajouter son rattachement dans `mapping.json` : une liste de clés de sections du corpus du
   référentiel concerné (`"art9"`, `"R:ORG-RSSI"`, `"7.1.2.3"`, `"6.9"`…).
3. Relancer `construire_donnees.py` puis `assembler.py`. La suite de tests vérifie que toutes les
   cibles existent et ne sont pas vides.
