# -*- coding: utf-8 -*-
"""Extraction des sections de l'IM 900 (JO) et de l'II 901 (scan OCR)."""
import re, json, sys
from extraire import assembler, petites_capitales, BARE_NUM
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chemins import REFS, BUILD, SOURCE, SORTIE, OUTILS

RACINE = REFS

# --------------------------------------------------------------- IM 900
JO = re.compile(r'JOURNAL OFFICIEL DE LA R[ÉE]PUBLIQUE|^\s*Texte \d+ sur \d+\s*$')
T_TITRE = re.compile(r'^\s*TITRE (\d+)\s*:\s*(.+?)\s*\d*\s*$')
T_SOUS  = re.compile(r'^\s*(\d+\.\d+)\s*:\s*(.+?)\s*\d*\s*$')
T_INTRO = re.compile(r'^\s*INTRODUCTION\s*:\s*(.+?)\s*\d*\s*$')

def im900():
    brut = open(RACINE + "im900.txt", encoding="utf-8").read()
    i = brut.find("\n                                       TITRE 1 : PRINCIPES G")
    if i < 0:
        i = brut.rindex("TITRE 1 : PRINCIPES G")
    corps = brut[i:]
    j = corps.find("ANNEXE 1 : LISTE DE EMPLOIS SENSIBLES")
    annexes = corps[j:] if j > 0 else ""
    corps = corps[:j] if j > 0 else corps
    lignes = []
    for l in corps.split("\n"):
        if JO.search(l) or re.search(r'\.{4,}', l):
            continue
        lignes.append(l.replace("", "-").replace(" x ", " - "))
    sections, courant, tampon, titre_courant = {}, None, [], None
    for l in lignes:
        m1, m2, m3 = T_TITRE.match(l), T_SOUS.match(l), T_INTRO.match(l)
        cle = lib = None
        if m1:  cle, lib = "T" + m1.group(1), "Titre " + m1.group(1) + " — " + m1.group(2).strip()
        elif m2: cle, lib = m2.group(1), m2.group(2).strip()
        elif m3 and courant: cle, lib = courant + ".0", "Introduction — " + m3.group(1).strip()
        if cle and lib and len(lib) < 200:
            if titre_courant: sections[titre_courant]["texte"] = assembler(tampon)
            titre_courant = cle
            sections[cle] = {"num": cle, "titre": petites_capitales(lib),
                             "niveau": 1 if cle.startswith("T") else 2}
            if m1 or m2: courant = cle
            tampon = []
        elif titre_courant:
            tampon.append(l)
    if titre_courant: sections[titre_courant]["texte"] = assembler(tampon)
    return sections

# --------------------------------------------------------------- II 901
ART = re.compile(r'^\s*Article\s+(\d+|1er|1 er|Il|II)\s*:?\s*(.*)$')
ANX = re.compile(r'^\s*Annexe\s+(\d+)\s*[-–—]\s*(.+)$', re.I)

def corriger_ocr(t):
    """Corrections mécaniques des artefacts d'océrisation les plus fréquents."""
    paires = [
        (r"\bd' ", "d'"), (r"\bl' ", "l'"), (r"\bn' ", "n'"), (r"\bs' ", "s'"),
        (r"\bqu' ", "qu'"), (r"\bj' ", "j'"), (r"\bc' ", "c'"), (r"\bm' ", "m'"),
        (r"\bI' ", "l'"), (r"\b1' ", "l'"), (r"\bI’", "l’"), (r"\b1’", "l’"),
        (r"\bI'Etat\b", "l'État"), (r"\bI' Etat\b", "l'État"), (r"\bEtat\b", "État"),
        (r"techni~ue", "technique"), (r"\(PPSTi", "(PPST)"), (r"\bPPSTi\b", "PPST"),
        (r"\bAt1icle\b", "Article"), (r"\bArtic le\b", "Article"), (r"\bartic le\b", "article"),
        (r"\bTitre Il\b", "Titre II"), (r"\bTitre Ill\b", "Titre III"),
        (r"\bArticle Il\b", "Article 11"), (r"\bclasse l\b", "classe 1"),
        (r"\bExtemalisation\b", "Externalisation"), (r"\bextemalisation\b", "externalisation"),
        (r"\bsystè mes\b", "systèmes"), (r"\binformatio n\b", "information"),
        (r"\bap plication\b", "application"), (r"\bsensi bilité\b", "sensibilité"),
        (r"\bd’ ", "d’"), (r"\bl’ ", "l’"), (r"\bs’ ", "s’"), (r"\bn’ ", "n’"),
        (r"\bqu’ ", "qu’"), (r"\bc’ ", "c’"), (r"\bm’ ", "m’"), (r"\bj’ ", "j’"),
        (r"\b([LDNSCJMTldnscjmt])['’] ", r"\1'"),   # « L' entité » -> « L'entité »
        (r"(\w) ['’] (\w)", r"\1'\2"),               # « d ' information » -> « d'information »
        (r"\bl'Etat\b", "l'État"), (r"\bI\b", "l"),
        (r" ,", ","), (r"«\s+", "« "), (r"\s+»", " »"),
    ]
    for a, b in paires:
        t = re.sub(a, b, t)
    return re.sub(r"\s{2,}", " ", t)

def ii901():
    brut = open(RACINE + "ii901.txt", encoding="utf-8").read()
    pages = brut.split("\f")
    lignes = []
    for pg in pages:
        ls = pg.split("\n")
        while ls and not ls[-1].strip(): ls.pop()
        while ls and BARE_NUM.match(ls[-1]):
            ls.pop()
            while ls and not ls[-1].strip(): ls.pop()
        lignes.extend(l for l in ls if not re.search(r'\.{4,}', l))
        lignes.append("")
    texte = "\n".join(lignes)
    i = texte.find("Titre 1 - Définition et périmètre")
    if i < 0: i = texte.find("Article 1er : Définitions")
    texte = texte[i:]
    sections, courant, tampon = {}, None, []
    for l in texte.split("\n"):
        m, a = ART.match(l), ANX.match(l)
        cle = lib = None
        if m and len(m.group(2)) < 120:
            n = m.group(1).replace("1 er", "1er").replace("Il", "11").replace("II", "11")
            cle, lib = "art" + ("1" if n == "1er" else n), m.group(2).strip(" :.")
        elif a:
            cle, lib = "anx" + a.group(1), a.group(2).strip()
        if cle and lib:
            # les numéros de page isolés survivent parfois à l'océrisation
            if courant: sections[courant]["texte"] = corriger_ocr(
                assembler([x for x in tampon if not re.fullmatch(r'\s*\d{1,3}\s*', x)]))
            courant = cle
            sections[cle] = {"num": cle, "titre": corriger_ocr(lib),
                             "niveau": 1 if cle.startswith("anx") else 2}
            tampon = []
        elif courant:
            tampon.append(l)
    if courant: sections[courant]["texte"] = corriger_ocr(
        assembler([x for x in tampon if not re.fullmatch(r'\s*\d{1,3}\s*', x)]))
    return sections

if __name__ == "__main__":
    # im900 est produit par extraire_im900.py (extraction pilotée par le sommaire)
    for nom, f in (("ii901", ii901),):
        s = f()
        json.dump(s, open(RACINE + nom + ".json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        vol = sum(len(v.get("texte", "")) for v in s.values())
        print("%-7s : %3d sections, %7d caractères" % (nom, len(s), vol))
        for k in list(s)[:6]:
            print("        %-8s %-62s %6d car." % (k, s[k]["titre"][:62], len(s[k].get("texte", ""))))
