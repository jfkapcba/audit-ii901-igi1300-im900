# -*- coding: utf-8 -*-
"""Chemins du dépôt, déduits de l'emplacement de ce fichier.

Aucun chemin absolu n'est codé en dur : la chaîne de fabrication fonctionne
quel que soit l'endroit où le dépôt est cloné.
"""
import os

OUTILS = os.path.dirname(os.path.abspath(__file__))
PROJET = os.path.dirname(OUTILS)
REFS   = os.path.join(OUTILS, "refs") + os.sep      # PDF officiels et texte extrait
BUILD  = os.path.join(OUTILS, "build") + os.sep     # JSON intermédiaires
SOURCE = os.path.join(PROJET, "source") + os.sep    # morceaux de la page
SORTIE = os.path.join(PROJET, "audit-ssi.html")     # fichier livré

os.makedirs(REFS, exist_ok=True)
os.makedirs(BUILD, exist_ok=True)
