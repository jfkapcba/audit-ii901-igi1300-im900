# -*- coding: utf-8 -*-
"""Assemble les corpus officiels et le catalogue de contrôle en fichiers JSON
destinés à être inclus tels quels dans la page HTML."""
import json, re, sys
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chemins import REFS, BUILD, SOURCE, SORTIE, OUTILS


def lire(fichier):
    """Lit un JSON de refs/ ou, si le nom contient un séparateur, du chemin donné."""
    chemin = fichier if os.path.isabs(fichier) else (
        REFS + fichier.split("/", 1)[1] if fichier.startswith("refs/") else OUTILS + os.sep + fichier)
    return json.load(open(chemin, encoding="utf-8"))

def cle_num(k):
    return [int(x) if x.isdigit() else 0 for x in k.split(".")]

# ----------------------------------------------------------------- II 901
def corpus_ii901():
    arts = lire("refs/ii901.json")
    regles = lire("refs/ii901_regles.json")
    sections, ordre = {}, []
    for i in range(1, 22):
        k = "art%d" % i
        if k not in arts: continue
        sections[k] = {"t": "Article %d — %s" % (i, arts[k]["titre"]), "x": arts[k]["texte"]}
        ordre.append(k)
    for k in ("anx2", "anx3"):
        if k in arts:
            sections[k] = {"t": "Annexe %s — %s" % (k[-1], arts[k]["titre"]), "x": arts[k]["texte"]}
            ordre.append(k)
    for code, v in sorted(regles.items(), key=lambda kv: kv[1]["ordre"]):
        k = "R:" + code
        sections[k] = {"t": "%s — %s" % (code, v["t"]), "x": v["x"], "fam": v["fam"]}
        ordre.append(k)
    return {
        "id": "II901", "code": "II 901",
        "titre": "Protection des systèmes d'information sensibles",
        "reference": "Instruction interministérielle n° 901/SGDSN/ANSSI du 28 janvier 2015 "
                     "(NOR : PRMD1503279J), publiée sur Légifrance",
        "provenance": "numerise",
        "avertissement": "Seul un exemplaire numérisé de l'II 901 est publié. Le texte ci-dessous est "
                         "une transcription automatique de ce document : les codes de règles et les "
                         "valeurs chiffrées sont à vérifier sur l'original avant toute citation.",
        "sections": sections, "ordre": ordre,
    }

# --------------------------------------------------------------- IGI 1300
def corpus_igi1300():
    s = lire("refs/igi1300.json")
    ordre = sorted(s, key=cle_num)
    sections = {}
    for k in ordre:
        v = s[k]
        titre = v["titre"] if v["niveau"] > 2 else v["titre"]
        sections[k] = {"t": "%s %s" % (k, titre), "x": v.get("texte", "")}
    return {
        "id": "IGI1300", "code": "IGI 1300",
        "titre": "Protection du secret de la défense nationale",
        "reference": "Instruction générale interministérielle n° 1300/SGDSN/PSE/PSD, approuvée par "
                     "l'arrêté du 9 août 2021 (en vigueur au 1er juillet 2021)",
        "provenance": "numerique",
        "avertissement": "Les annexes de l'IGI 1300 (dont l'annexe 1 relative à la mention Diffusion "
                         "Restreinte et l'annexe 37 relative aux timbres) sont publiées séparément et "
                         "ne sont pas reprises ici.",
        "sections": sections, "ordre": ordre,
    }

# ----------------------------------------------------------------- IM 900
def corpus_im900():
    s = lire("refs/im900.json")
    def rang(k):
        if k.startswith("T"):
            base = k[1:].split(".")
            return (int(base[0]), 0 if len(base) == 1 else 0.5)
        if k.startswith("A"): return (100, int(k[1:]))
        a, b = k.split("."); return (int(a), int(b))
    ordre = sorted(s, key=rang)
    sections = {k: {"t": ("%s — %s" % (k, s[k]["titre"])) if not s[k]["titre"].startswith(("Titre", "Annexe", "Introduction"))
                         else s[k]["titre"],
                    "x": s[k].get("texte", "")} for k in ordre}
    return {
        "id": "IM900", "code": "IM 900",
        "titre": "Protection de l'information et des données",
        "reference": "Instruction ministérielle n° 900/ARM/CAB du 27 août 2025, approuvée par l'arrêté "
                     "du 27 août 2025 (JORF du 1er octobre 2025, texte 17) — en vigueur au 1er novembre 2025, "
                     "abroge l'IM 900 du 15 mars 2021",
        "provenance": "numerique",
        "avertissement": "",
        "sections": sections, "ordre": ordre,
    }

# ------------------------------------------------------------- Catalogue
#
# Métadonnées des référentiels, tenues ici afin qu'une mise à jour de texte
# (nouvel arrêté, nouvelle version) se fasse en un seul endroit.
METADONNEES = {
    "II901": {
        "ref": "Instruction interministérielle n° 901/SGDSN/ANSSI du 28 janvier 2015 "
               "(NOR : PRMD1503279J)",
    },
    "IGI1300": {
        "ref": "Instruction générale interministérielle n° 1300/SGDSN/PSE/PSD, approuvée par "
               "l'arrêté du 9 août 2021",
    },
    "IM900": {
        "code": "IM 900",
        "nom": "Protection de l'information et des données",
        "ref": "Instruction ministérielle n° 900/ARM/CAB du 27 août 2025 (arrêté du 27 août 2025, "
               "JORF du 1er octobre 2025), en vigueur au 1er novembre 2025",
        "portee": "Protection du secret, des informations Diffusion Restreinte et sensibles au sein "
                  "du ministère des Armées et chez ses cocontractants ; sécurité numérique associée.",
        "niveaux": ["DR", "S", "TS"],
    },
}

def catalogue():
    """Catalogue des points de contrôle, enrichi du rattachement aux textes."""
    cat = lire("catalogue-source.json")
    mapping = lire("mapping.json")
    for ref in cat["referentiels"]:
        ref.update(METADONNEES.get(ref["id"], {}))
        for dom in ref["domaines"]:
            for ex in dom["exigences"]:
                ex["sec"] = mapping.get(ex["id"], [])
                ex.pop("texte", None)
    return cat

if __name__ == "__main__":
    for nom, produire in (("corpus-II901", corpus_ii901), ("corpus-IGI1300", corpus_igi1300),
                          ("corpus-IM900", corpus_im900), ("catalogue", catalogue)):
        donnees = produire()
        json.dump(donnees, open(BUILD + nom + ".json", "w", encoding="utf-8"),
                  ensure_ascii=False, separators=(",", ":"))
        if "sections" in donnees:
            volume = sum(len(v["x"]) for v in donnees["sections"].values())
            print("%-16s %4d sections  %8d caractères" % (nom, len(donnees["sections"]), volume))
        else:
            n = sum(len(d["exigences"]) for r in donnees["referentiels"] for d in r["domaines"])
            orphelins = [e["id"] for r in donnees["referentiels"] for d in r["domaines"]
                         for e in d["exigences"] if not e["sec"]]
            print("%-16s %4d référentiels  %5d points de contrôle  %d sans rattachement"
                  % (nom, len(donnees["referentiels"]), n, len(orphelins)))
