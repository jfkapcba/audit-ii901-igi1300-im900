# -*- coding: utf-8 -*-
"""IGI 1300 : découpage du corps de l'instruction en sections numérotées."""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chemins import REFS
from extraire import decouper

if __name__ == "__main__":
    sections = decouper(REFS + "igi1300.txt", entetes=[],
                        debut_marqueur="\n1 PRINCIPES GENERAUX\n",
                        fin_marqueur="LISTE DES ANNEXES")
    json.dump(sections, open(REFS + "igi1300.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    volume = sum(len(v.get("texte", "")) for v in sections.values())
    print("IGI 1300 : %d sections, %d caractères" % (len(sections), volume))
