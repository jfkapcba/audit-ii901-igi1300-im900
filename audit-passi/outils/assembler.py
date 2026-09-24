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

# Bloc de données : le catalogue seul. Aucun texte officiel n'est embarqué.
DONNEES = [
    ("donnees-catalogue", "catalogue.json",
     "Référentiels RGS et LPM, secteurs d'activités d'importance vitale, points de contrôle."),
]

PREAMBULE_DONNEES = """
<!-- ===================================================================
     DONNÉES
     Le catalogue des points de contrôle est placé dans un bloc JSON distinct
     du code, afin que celui-ci reste lisible. Il est lu au démarrage par
     lireBlocJSON(). Les énoncés officiels ne sont pas embarqués : ils sont
     saisis par l'auditeur et conservés avec l'audit.
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
    print("%s : %.0f Ko (%d caractères)"
          % (os.path.basename(SORTIE), os.path.getsize(SORTIE) / 1024, len(contenu)))
