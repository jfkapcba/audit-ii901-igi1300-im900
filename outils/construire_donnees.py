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
    """Ordre de lecture : sections décimales d'abord, puis annexes numérotées."""
    if k.startswith("A") and k[1:].isdigit():
        return [999, int(k[1:])]
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
        # Les annexes portent déjà leur numéro dans l'intitulé (« Annexe 37 — … ») ;
        # seules les sections décimales sont préfixées de leur numéro.
        prefixe = "" if k.startswith("A") and k[1:].isdigit() else k + " "
        sections[k] = {"t": prefixe + v["titre"], "x": v.get("texte", "")}
    return {
        "id": "IGI1300", "code": "IGI 1300",
        "titre": "Protection du secret de la défense nationale",
        "reference": "Instruction générale interministérielle n° 1300/SGDSN/PSE/PSD, approuvée par "
                     "l'arrêté du 9 août 2021 (en vigueur au 1er juillet 2021)",
        "provenance": "numerique",
        "avertissement": "",
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
# Les exigences II 901 et IGI 1300 proviennent des sources officielles :
#   - II 901   : les 21 articles de l'instruction et les règles codées de son
#                annexe 1 (ORG-SSI, PDT-CONFIG…), extraites du document publié.
#   - IGI 1300 : le listing des exigences SSI publié par l'ANSSI, avec ses
#                identifiants officiels (HOMOL_01, MARQ_04…).
# Ce listing ne couvrant que le volet « systèmes d'information » de l'IGI 1300,
# les points de contrôle rédigés pour les domaines qu'il laisse de côté
# (habilitation, locaux, contrats, supports papier…) sont conservés et signalés
# comme tels par le champ « redige ».
# Les exigences IM 900 restent celles rédigées pour ce projet.

METADONNEES = {
    "II901": {
        "code": "II 901", "nom": "Protection des systèmes d'information sensibles",
        "ref": "Instruction interministérielle n° 901/SGDSN/ANSSI du 28 janvier 2015 "
               "(NOR : PRMD1503279J)",
        "portee": "Systèmes d'information traitant d'informations sensibles, dont celles portant "
                  "la mention Diffusion Restreinte.",
        "niveaux": ["DR"],
    },
    "IGI1300": {
        "code": "IGI 1300", "nom": "Protection du secret de la défense nationale",
        "ref": "Instruction générale interministérielle n° 1300/SGDSN/PSE/PSD, approuvée par "
               "l'arrêté du 9 août 2021 — exigences SSI issues du listing ANSSI-NP-IGI1300 v0.4",
        "portee": "Informations et supports classifiés au niveau Secret ou Très Secret, et "
                  "systèmes d'information qui les traitent.",
        "niveaux": ["S", "TS"],
    },
    "IM900": {
        "code": "IM 900", "nom": "Protection de l'information et des données",
        "ref": "Instruction ministérielle n° 900/ARM/CAB du 27 août 2025 (arrêté du 27 août 2025, "
               "JORF du 1er octobre 2025), en vigueur au 1er novembre 2025",
        "portee": "Protection du secret, des informations Diffusion Restreinte et sensibles au sein "
                  "du ministère des Armées et chez ses cocontractants ; sécurité numérique associée.",
        "niveaux": ["DR", "S", "TS"],
    },
}

# Articles de l'II 901 retenus au plan de contrôle : les articles 1 à 4 posent
# les définitions et le champ d'application, les articles 20 et 21 sont
# transitoires ; ils ne sont pas auditables en tant que tels.
ARTICLES_II901 = range(5, 20)

# Regroupement des exigences du listing ANSSI en domaines, d'après la section de
# l'IGI 1300 dont chacune découle.
DOMAINES_ANSSI = [
    ("1.",        "INC", "Réponses aux incidents de sécurité (§ 1.4.2.4)"),
    ("6.1",       "HOM", "Homologation du système classifié (§ 6.1)"),
    ("6.2",       "ITC", "Homologation des interconnexions (§ 6.2)"),
    ("6.3",       "SST", "Sous-traitance du développement et de la maintenance (§ 6.3)"),
    ("6.4",       "PHY", "Sécurité physique et signaux parasites compromettants (§ 6.4)"),
    ("6.5",       "DIS", "Dispositifs de sécurité et produits agréés (§ 6.5)"),
    ("6.6",       "EXP", "Conception et exploitation du système (§ 6.6)"),
    ("6.7",       "MOB", "Sécurité en mobilité (§ 6.7)"),
    ("6.8",       "AMO", "Supports amovibles (§ 6.8)"),
    ("6.9",       "AUD", "Audit des systèmes d'information (§ 6.9)"),
    ("7.",        "SUP", "Marquage, transport et rebut des supports (§ 7)"),
    ("Annexe 30", "CLS", "Classes de protection physique et logique (annexe 30)"),
]

# Domaines des points de contrôle rédigés que le listing ANSSI ne couvre pas.
# SIC et COM sont supprimés : le listing les traite intégralement.
DOMAINES_IGI_CONSERVES = ["ORG", "HAB", "CLA", "GES", "LOC", "TRA", "REP", "CTR", "INS"]

def domaine_anssi(reference):
    for prefixe, identifiant, nom in DOMAINES_ANSSI:
        if reference.startswith(prefixe):
            return identifiant, nom
    return "AUT", "Autres exigences"

def catalogue_ii901():
    """II 901 : les articles de l'instruction, puis les règles codées de l'annexe 1."""
    articles = lire("refs/ii901.json")
    regles = lire("refs/ii901_regles.json")

    domaines = [{
        "id": "ART", "nom": "Dispositions de l'instruction (articles 5 à 19)",
        "exigences": [{
            "id": "II901-art%d" % n,
            "t": articles["art%d" % n]["titre"],
            "enonce": articles["art%d" % n]["texte"],
            "src": "II 901, article %d" % n,
            "sec": ["art%d" % n],
        } for n in ARTICLES_II901 if ("art%d" % n) in articles],
    }]

    par_famille = {}
    for code, regle in sorted(regles.items(), key=lambda kv: kv[1]["ordre"]):
        par_famille.setdefault(regle["fam"], []).append({
            "id": code,
            "t": regle["t"],
            "enonce": regle["x"],
            "src": "II 901, annexe 1 — règle %s" % code,
            "sec": [],
        })
    for nom, exigences in par_famille.items():
        domaines.append({"id": exigences[0]["id"].split("-")[0], "nom": nom, "exigences": exigences})

    return dict(METADONNEES["II901"], id="II901", domaines=domaines)

def catalogue_igi1300(source, mapping):
    """IGI 1300 : listing officiel ANSSI, complété des domaines qu'il ne couvre pas."""
    officielles = lire("refs/anssi_igi1300.json")
    corpus = lire("refs/igi1300.json")

    par_domaine = {}
    for exigence in officielles:
        identifiant, nom = domaine_anssi(exigence["ref"])
        # « 6.6.3.1.a) » renvoie à la section 6.6.3.1 du texte ; l'annexe 30
        # n'est pas publiée avec l'instruction et n'a donc pas de section.
        reference = re.sub(r'\.[a-z]\)$', '', exigence["ref"])
        m = re.match(r'Annexe\s+(\d+)', reference, re.I)
        if m:
            reference = "A" + m.group(1)
        par_domaine.setdefault((identifiant, nom), []).append({
            "id": exigence["id"],
            "t": intitule(exigence),
            "enonce": exigence["enonce"],
            "src": "IGI 1300 § %s" % exigence["ref"] if exigence["ref"] else "IGI 1300",
            "sec": [reference] if reference in corpus else [],
            "n": exigence["niveaux"],
        })
    domaines = [{"id": i, "nom": n, "exigences": e} for (i, n), e in par_domaine.items()]

    # Points de contrôle rédigés, pour les domaines hors du champ du listing.
    for referentiel in source["referentiels"]:
        if referentiel["id"] != "IGI1300":
            continue
        for domaine in referentiel["domaines"]:
            if domaine["id"] not in DOMAINES_IGI_CONSERVES:
                continue
            for exigence in domaine["exigences"]:
                exigence["sec"] = mapping.get(exigence["id"], [])
                exigence["redige"] = True
                exigence.pop("texte", None)
            domaines.append(dict(domaine, nom=domaine["nom"] + " — hors listing ANSSI"))

    return dict(METADONNEES["IGI1300"], id="IGI1300", domaines=domaines)

def catalogue_im900(source, mapping):
    """IM 900 : points de contrôle rédigés pour ce projet, inchangés."""
    for referentiel in source["referentiels"]:
        if referentiel["id"] != "IM900":
            continue
        for domaine in referentiel["domaines"]:
            for exigence in domaine["exigences"]:
                exigence["sec"] = mapping.get(exigence["id"], [])
                exigence["redige"] = True
                exigence.pop("texte", None)
        return dict(METADONNEES["IM900"], id="IM900", domaines=referentiel["domaines"])
    raise SystemExit("référentiel IM900 absent du catalogue source")

def intitule(exigence, limite=92):
    """Intitulé court pour l'arborescence.

    On prend la première phrase de l'énoncé officiel si elle est assez courte
    pour tenir seule ; sinon on reprend le nom de la section du listing, ce qui
    évite de couper une phrase officielle au milieu."""
    texte = re.sub(r'\s+', ' ', exigence["enonce"]).strip()
    phrase = re.split(r'(?<=[.;])\s', texte)[0].rstrip(" .;")
    if 12 <= len(phrase) <= limite and ":" not in phrase:
        return phrase
    section = re.sub(r'^([0-9.]+|[a-z]\.)\s*', '', exigence["section"]).strip()
    return section or (phrase[:limite] + "…")

def catalogue():
    source = lire("catalogue-source.json")
    mapping = lire("mapping.json")
    return {
        "version": "2026.09.2",
        "referentiels": [catalogue_ii901(),
                         catalogue_igi1300(source, mapping),
                         catalogue_im900(source, mapping)],
    }

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
            for referentiel in donnees["referentiels"]:
                n = sum(len(d["exigences"]) for d in referentiel["domaines"])
                officielles = sum(1 for d in referentiel["domaines"] for e in d["exigences"]
                                  if not e.get("redige"))
                print("%-16s %-9s %3d domaines  %4d exigences  dont %d officielles"
                      % (nom, referentiel["code"], len(referentiel["domaines"]), n, officielles))
