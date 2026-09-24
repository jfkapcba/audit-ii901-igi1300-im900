# -*- coding: utf-8 -*-
"""Assemble la page finale : morceaux de source/ + données de outils/build/.

Le fichier produit est autonome : styles, balisage, données et code y sont
réunis, sans aucune référence externe.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chemins import SOURCE, BUILD, SORTIE

# Morceaux assemblés dans l'ordre. Les fichiers .js portent déjà leur balise
# <script> ouvrante ou fermante ; ils sont concaténés tels quels.
MORCEAUX = [
    "01-styles.html",
    "02-balisage.html",
]
CODE = [
    "03-socle.js",
    "04-audit-marquage-navigation.js",
    "05-ecran-audit-et-textes.js",
    "06-ecrans-synthese-et-dossier.js",
    "07-exports-et-import.js",
    "08-evenements-et-demarrage.js",
]

# Blocs de données : (identifiant du <script>, fichier de build/, commentaire)
DONNEES = [
    ("donnees-catalogue", "catalogue.json",
     "Catalogue des points de contrôle : référentiels, domaines, exigences."),
    ("donnees-corpus-II901", "corpus-II901.json",
     "II 901 — articles 1 à 21, annexes 2 et 3, et les 178 règles codées de l'annexe 1."),
    ("donnees-corpus-IGI1300", "corpus-IGI1300.json",
     "IGI 1300 — corps de l'instruction, découpé par section numérotée."),
    ("donnees-corpus-IM900", "corpus-IM900.json",
     "IM 900 — titres, sections et annexes de l'instruction ministérielle."),
]

PREAMBULE_DONNEES = """
<!-- ===================================================================
     DONNÉES
     Le catalogue des points de contrôle et le texte officiel des trois
     instructions sont placés dans des blocs JSON distincts du code, afin
     que celui-ci reste lisible. Ils sont lus au démarrage par
     lireBlocJSON().
     =================================================================== -->
"""

def bloc_json(identifiant, fichier, commentaire):
    """Un bloc <script type="application/json">, dont le contenu ne peut pas
    refermer la balise : tout « < » y est écrit \\u003c."""
    donnees = open(BUILD + fichier, encoding="utf-8").read().replace("<", "\\u003c")
    return ('\n<!-- %s -->\n<script type="application/json" id="%s">%s</script>\n'
            % (commentaire, identifiant, donnees))

def assembler():
    parties = [open(SOURCE + f, encoding="utf-8").read() for f in MORCEAUX]
    parties.append(PREAMBULE_DONNEES)
    parties += [bloc_json(*d) for d in DONNEES]
    parties += [open(SOURCE + f, encoding="utf-8").read() for f in CODE]
    contenu = "".join(parties)
    open(SORTIE, "w", encoding="utf-8").write(contenu)
    return contenu

if __name__ == "__main__":
    contenu = assembler()
    print("audit-ssi.html : %.2f Mo (%d caractères)"
          % (os.path.getsize(SORTIE) / 1048576, len(contenu)))
