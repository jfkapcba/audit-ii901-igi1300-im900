# -*- coding: utf-8 -*-
"""IGI 1300 : découpage du corps de l'instruction puis de ses annexes.

Les annexes figurent dans le même PDF que le corps, à la suite de la liste des
annexes. Elles sont numérotées « Annexe N – Titre » et non par sections
décimales : elles font donc l'objet d'une seconde passe.
"""
import os, sys, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chemins import REFS
from extraire import decouper, assembler, nettoyer_page

# Intitulé d'annexe dans le corps du document : « Annexe 37 – Modèles de timbres… »
TITRE_ANNEXE = re.compile(r'^\s*Annexe\s+(\d{1,2})\s*[–—-]\s*(.+?)\s*$')

def decouper_annexes(chemin):
    """Renvoie {« A37 »: {titre, texte}} pour chacune des annexes."""
    brut = open(chemin, encoding="utf-8").read()
    # Le corps des annexes commence après la table qui les énumère.
    debut = brut.rfind("LISTE DES ANNEXES")
    pages = brut[debut:].split("\f")
    lignes = []
    for page in pages:
        corps, _ = nettoyer_page(page, [])
        lignes.extend(l for l in corps if not re.search(r'\.{4,}', l))
        lignes.append("")

    annexes, courante, tampon = {}, None, []
    for ligne in lignes:
        m = TITRE_ANNEXE.match(ligne)
        # Un intitulé d'annexe occupe sa propre ligne, souvent centrée, et reste
        # court. Les renvois « cf. annexe 37 » sont en milieu de ligne et ne
        # peuvent donc pas être confondus avec lui.
        if m and len(m.group(2)) < 130:
            if courante:
                annexes[courante]["texte"] = assembler(tampon)
            numero = int(m.group(1))
            courante = "A%d" % numero
            annexes[courante] = {"num": courante, "niveau": 1,
                                 "titre": "Annexe %d — %s" % (numero, m.group(2).strip())}
            tampon = []
        elif courante:
            tampon.append(ligne)
    if courante:
        annexes[courante]["texte"] = assembler(tampon)
    return annexes

if __name__ == "__main__":
    chemin = REFS + "igi1300.txt"
    sections = decouper(chemin, entetes=[],
                        debut_marqueur="\n1 PRINCIPES GENERAUX\n",
                        fin_marqueur="LISTE DES ANNEXES")
    annexes = decouper_annexes(chemin)
    sections.update(annexes)
    json.dump(sections, open(REFS + "igi1300.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    volume = sum(len(v.get("texte", "")) for v in sections.values())
    print("IGI 1300 : %d sections dont %d annexes, %d caractères"
          % (len(sections), len(annexes), volume))
    vides = [k for k in annexes if len(annexes[k].get("texte", "")) < 80]
    if vides:
        print("  annexes au texte très court :", sorted(vides, key=lambda k: int(k[1:])))
