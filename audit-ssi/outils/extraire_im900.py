# -*- coding: utf-8 -*-
"""IM 900 : le sommaire fournit les intitulés complets, le corps fournit le texte.

Les intitulés du corps sont éclatés par la mise en page du Journal officiel ; on
se repère donc sur les marqueurs de numéro (« 2.6 : », « TITRE 5 : », « ANNEXE 3 »)
et on reprend l'intitulé exact du sommaire.
"""
import re, json, sys
from extraire import assembler
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chemins import REFS, BUILD, SOURCE, SORTIE, OUTILS

RACINE = REFS
JO = re.compile(r'JOURNAL OFFICIEL DE LA R[ÉE]PUBLIQUE|^\s*Texte \d+ sur \d+\s*$')

def lire_sommaire(brut):
    """Renvoie [(cle, intitule, motif_de_reperage), ...] dans l'ordre du document."""
    i = brut.find("TABLE DES MATIÈRES")
    j = brut.find("ANNEXE 23 :", i)
    j = brut.find("\n", brut.find("\n", j) + 1)
    somm = brut[i:j]
    # recoller les entrées écrites sur plusieurs lignes : une entrée se termine par « … 123 »
    entrees, courant = [], ""
    for l in somm.split("\n")[1:]:
        l = l.strip()
        if not l or JO.search(l):
            continue
        courant = (courant + " " + l).strip()
        if re.search(r'\.+\s*\d{1,3}\s*$', courant):
            entrees.append(re.sub(r'\s*\.+\s*\d{1,3}\s*$', '', courant))
            courant = ""
    sections, titre_courant = [], None
    for e in entrees:
        e = re.sub(r'\s{2,}', ' ', e).strip()
        m = re.match(r'^TITRE (\d+)\s*:\s*(.+)$', e)
        if m:
            titre_courant = "T" + m.group(1)
            sections.append((titre_courant, "Titre " + m.group(1) + " — " + m.group(2).strip(),
                             r'TITRE\s+' + m.group(1) + r'\s*:'))
            continue
        m = re.match(r'^INTRODUCTION\s*:\s*(.+)$', e)
        if m and titre_courant:
            sections.append((titre_courant + ".0", "Introduction — " + m.group(1).strip(), r'INTRODUCTION\s*:'))
            continue
        m = re.match(r'^(\d+\.\d+)\s*:\s*(.+)$', e)
        if m:
            sections.append((m.group(1), m.group(2).strip(),
                             r'(?<![\d.])' + re.escape(m.group(1)) + r'\s*:'))
            continue
        m = re.match(r'^ANNEXE (\d+)\s*:\s*(.+)$', e)
        if m:
            sections.append(("A" + m.group(1), "Annexe " + m.group(1) + " — " + m.group(2).strip(),
                             r'ANNEXE\s+' + m.group(1) + r'\s*:'))
    return sections

# Le Journal officiel répète en tête de chaque page le titre courant et le
# numéro de section, et en pied le numéro de page. Les véritables intitulés
# ayant déjà servi à délimiter les sections, tout ce qui subsiste dans un corps
# de section est du bandeau de page, que l'on retire.
BANDEAU = re.compile(r'^\s*(TITRE\s+\d+\s*:|ANNEXE\s+\d+\b)', re.I)
NUM_PAGE = re.compile(r'^\s*\d{1,3}\s*$')

def nettoyer_corps(lignes):
    return [l for l in lignes if not NUM_PAGE.match(l) and not BANDEAU.match(l)]

def extraire():
    brut = open(RACINE + "im900.txt", encoding="utf-8").read()
    brut = re.sub(r"[\x02\x03\x0e\x10]", " ", brut)   # espaces codés par le PDF
    plan = lire_sommaire(brut)
    # corps = tout ce qui suit la dernière ligne du sommaire
    debut = brut.find("ANNEXE 23 :")
    debut = brut.find("\n", brut.find("\n", debut) + 1)
    corps = "\n".join(l for l in brut[debut:].split("\n")
                      if not JO.search(l) and not re.search(r'\.{4,}', l))
    corps = corps.replace("", "-").replace("", "-")
    corps = re.sub(r'^\s*[x¾]\s+', '  - ', corps, flags=re.M)

    # repérer chaque section, dans l'ordre, à partir de la position de la précédente
    bornes, pos = [], 0
    for cle, titre, motif in plan:
        m = re.search(motif, corps[pos:])
        if not m:
            bornes.append((cle, titre, None)); continue
        debut_sec = pos + m.end()
        bornes.append((cle, titre, debut_sec))
        pos = debut_sec
    sections = {}
    for idx, (cle, titre, d) in enumerate(bornes):
        if d is None:
            sections[cle] = {"num": cle, "titre": titre, "texte": "", "manquant": True}
            continue
        f = next((b[2] for b in bornes[idx + 1:] if b[2] is not None), len(corps))
        # retirer la fin d'intitulé restée collée : lignes en capitales du début
        lignes = corps[d:f].split("\n")
        k = 0
        while k < len(lignes) and (not lignes[k].strip() or
              (lignes[k].strip() == lignes[k].strip().upper() and len(lignes[k].strip()) < 95
               and not lignes[k].strip().startswith("-"))):
            k += 1
        sections[cle] = {"num": cle, "titre": titre,
                         "niveau": 1 if cle.startswith("T") and "." not in cle else 2,
                         "texte": assembler(nettoyer_corps(lignes[k:]))}
    return sections

if __name__ == "__main__":
    s = extraire()
    json.dump(s, open(RACINE + "im900.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    manq = [k for k, v in s.items() if v.get("manquant")]
    print("IM 900 : %d sections, %d caractères de texte officiel" %
          (len(s), sum(len(v.get("texte", "")) for v in s.values())))
    print("sections non localisées dans le corps :", manq or "aucune")
    for k, v in list(s.items())[:8] + list(s.items())[-4:]:
        print("  %-6s %-80s %6d" % (k, v["titre"][:80], len(v.get("texte", ""))))
