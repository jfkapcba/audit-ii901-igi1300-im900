# -*- coding: utf-8 -*-
"""Listing officiel des exigences SSI de l'IGI 1300, publié par l'ANSSI.

Source : ANSSI-NP-IGI1300-listing_des_exigences-v0.4.xlsx, téléchargeable depuis
la page IGI 1300 de cyber.gouv.fr. Le classeur porte la mention NP (non protégé).

Il contient, dans la feuille « Exigences SSI », une exigence par ligne avec son
identifiant officiel (HOMOL_01, MARQ_04, ACC_12…), son énoncé, la section de
l'IGI 1300 dont elle découle et son applicabilité aux niveaux Secret et Très
Secret. Des lignes « titre » intercalées donnent le plan retenu par l'ANSSI.

La lecture se fait directement dans le XML du classeur : aucune dépendance.
"""
import os, sys, json, re, zipfile
import xml.etree.ElementTree as ET
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chemins import REFS

CLASSEUR = "anssi-igi1300-exigences.xlsx"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

# Colonnes de la feuille « Exigences SSI ».
COL_ID, COL_ENONCE, COL_REF, COL_S, COL_TS = "A", "B", "C", "D", "E"

def lire_feuille(archive, nom_feuille):
    """Renvoie les lignes de la feuille comme des dictionnaires {colonne: valeur}."""
    chaines = ["".join(t.text or "" for t in si.iter(NS + "t"))
               for si in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
    classeur = ET.fromstring(archive.read("xl/workbook.xml"))
    noms = [s.get("name") for s in classeur.iter(NS + "sheet")]
    index = noms.index(nom_feuille) + 1
    feuille = ET.fromstring(archive.read("xl/worksheets/sheet%d.xml" % index))

    def valeur(cellule):
        v = cellule.find(NS + "v")
        if v is None or v.text is None:
            return ""
        if cellule.get("t") == "s" and v.text.isdigit():
            return chaines[int(v.text)]
        return v.text

    lignes = []
    for ligne in feuille.iter(NS + "row"):
        cellules = {}
        for cellule in ligne.iter(NS + "c"):
            colonne = re.match(r'[A-Z]+', cellule.get("r") or "A").group()
            cellules[colonne] = valeur(cellule)
        lignes.append(cellules)
    return lignes

def extraire():
    with zipfile.ZipFile(REFS + CLASSEUR) as archive:
        lignes = lire_feuille(archive, "Exigences SSI")

    exigences, section_courante = [], None
    for ligne in lignes[1:]:                       # la première ligne est l'en-tête
        identifiant = (ligne.get(COL_ID) or "").strip()
        if not identifiant:
            continue
        if identifiant == "titre":
            section_courante = re.sub(r'\s{2,}', ' ', (ligne.get(COL_ENONCE) or "").strip())
            continue
        enonce = re.sub(r'\s{2,}', ' ', (ligne.get(COL_ENONCE) or "").strip())
        if not enonce:
            continue
        exigences.append({
            "id": identifiant,
            "enonce": enonce,
            "ref": (ligne.get(COL_REF) or "").strip(),
            "niveaux": [n for n, col in (("S", COL_S), ("TS", COL_TS))
                        if (ligne.get(col) or "").strip().upper() == "X"] or ["S", "TS"],
            "section": section_courante or "",
            "famille": re.match(r'([A-Z]+)', identifiant).group(1) if re.match(r'[A-Z]', identifiant) else "AUTRE",
        })
    return exigences

if __name__ == "__main__":
    exigences = extraire()
    json.dump(exigences, open(REFS + "anssi_igi1300.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    from collections import Counter
    familles = Counter(e["famille"] for e in exigences)
    sections = Counter(e["section"] for e in exigences)
    print("exigences ANSSI extraites : %d  (%d familles, %d sections, %d caractères d'énoncés)"
          % (len(exigences), len(familles), len(sections),
             sum(len(e["enonce"]) for e in exigences)))
    sans_ref = [e["id"] for e in exigences if not e["ref"]]
    if sans_ref:
        print("  sans référence IGI :", len(sans_ref), sans_ref[:8])
