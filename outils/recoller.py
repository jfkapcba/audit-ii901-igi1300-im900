# -*- coding: utf-8 -*-
"""Recolle les intitulés de section coupés sur deux lignes par la mise en page du PDF."""
import re, json, sys
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chemins import REFS, BUILD, SOURCE, SORTIE, OUTILS
RACINE = REFS
MOTS_SUSPENDUS = r"(un|une|de|des|du|la|le|les|qui|que|et|en|à|au|aux|d’|l’|d'|l'|pour|dans|sur|par|avec|sans|ou)$"

def recoller(sections):
    n = 0
    for v in sections.values():
        t, txt = v["titre"].strip(), v.get("texte", "")
        if not txt: continue
        prem, reste = (txt.split("\n", 1) + [""])[:2]
        prem = prem.strip()
        if not prem or len(prem) > 95: continue
        maj_titre = t == t.upper() and len(t) > 12
        fusion = False
        if maj_titre and prem == prem.upper() and not prem.endswith("."):
            fusion = True                              # intitulé en capitales coupé
        elif re.search(MOTS_SUSPENDUS, t, re.I) and prem[:1].islower():
            fusion = True                              # intitulé terminé par un mot suspendu
        if fusion:
            v["titre"] = re.sub(r"\s{2,}", " ", t + " " + prem).strip()
            v["texte"] = reste.lstrip("\n")
            n += 1
    return n

if __name__ == "__main__":
    for nom in ("igi1300", "im900", "ii901"):
        s = json.load(open(RACINE + nom + ".json", encoding="utf-8"))
        if nom == "ii901" and "art1" in s and s["art1"]["titre"].startswith("er :"):
            s["art1"]["titre"] = s["art1"]["titre"][4:].strip()
        n = recoller(s)
        json.dump(s, open(RACINE + nom + ".json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("%-8s : %d intitulé(s) recollé(s)" % (nom, n))
