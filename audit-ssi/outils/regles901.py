# -*- coding: utf-8 -*-
"""Découpe l'annexe 1 de l'II 901 en règles codées (ORG-SSI, PDT-CONFIG, …).

Le seul exemplaire publié de l'II 901 est un document numérisé : les codes de
règles sont donc issus d'une reconnaissance optique de caractères. Deux familles
d'artefacts ont été constatées et sont corrigées ici, chacune vérifiée sur le
document d'origine :

  1. Des espaces parasites à l'intérieur du code (« DEY -SOUS-TRAIT »,
     « EXP-INIT -PASS », « DEY-FIL T -APPL ») : simplement supprimées.

  2. Des confusions de caractères systématiques, corrigées uniquement lorsque le
     sens du code les rend certaines :
       DEY -> DEV      (développement)          V lu Y, cf. aussi AMOY -> AMOV
       POT -> PDT      (poste de travail)       D lu O
       Tl  -> TI       (traitement des incidents) I lu l
       SERY -> SERV, YERIF -> VERIF, OESACTIV -> DESACTIV
       SECX -> SEC     (EXP-SEC-DIST, cohérent avec EXP-ACC-DIST)

L'orthographe du document est en revanche conservée telle quelle lorsqu'elle est
lisible sans ambiguïté, même fautive : « PDT-VEROUIL-FIXE » garde son R unique.
"""
import os, sys, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chemins import REFS

# Corrections de caractères, appliquées au code entier après suppression des espaces.
SUBSTITUTIONS = [
    (r'^DEY\b',   'DEV'), (r'^POT\b', 'PDT'), (r'^Tl\b',  'TI'),
    (r'-SERY\b',  '-SERV'), (r'-YERIF\b', '-VERIF'), (r'-OESACTIV\b', '-DESACTIV'),
    (r'-AMOY\b',  '-AMOV'), (r'^SECX\b', 'SEC'), (r'-SECX-', '-SEC-'),
]
# Jetons de code cassés par l'océrisation, réparés avant toute recherche : ici
# l'espace tombe au milieu d'un segment, et non autour d'un tiret, ce que la
# recherche ne peut pas rattraper seule.
JETONS_CASSES = [
    (r'\bTl\s?-', 'TI-'),          # Tl-INC-REM : I lu l
    (r'\bFIL\s+T\s?-', 'FILT-'),   # DEY-FIL T -APPL
]

# Sigles qui ne sont pas des codes de règle.
NON_CODES = {"PSSI", "SSI", "ANSSI", "PSSIE", "PSSIM", "RSSI", "DR", "II", "NB",
             "PCA", "PCI", "SI", "TIC", "OIV", "PDT", "EXP", "ORG", "RES"}

CORRECTIONS_TEXTE = [
    (r"\brestnctlon\b", "restriction"), (r"\bJe cycle\b", "le cycle"),
    (r"\bd 'accès\b", "d'accès"), (r"\bd 'ap", "d'ap"), (r"\bd 'activité\b", "d'activité"),
    (r"\btracabilité\b", "traçabilité"), (r"\barrivees\b", "arrivées"),
    (r"\bcouches basse\b", "couches basses"), (r"\bsecunte\b", "sécurité"),
]

FAMILLES = {
    "ORG":   "Politique, organisation et gouvernance de la SSI",
    "RH":    "Ressources humaines et sensibilisation",
    "GDB":   "Gestion des biens : inventaire, cartographie et qualification",
    "INT":   "Intégration de la SSI et relations avec les tiers",
    "PHY":   "Sécurité physique et environnementale",
    "RES":   "Sécurité des réseaux",
    "ARCHI": "Architecture d'hébergement et passerelles",
    "EXP":   "Exploitation, administration et maintien en condition de sécurité",
    "PDT":   "Postes de travail, nomadisme et périphériques",
    "DEV":   "Développement et acquisition de logiciels",
    "TI":    "Traitement des incidents",
    "PCA":   "Continuité et reprise d'activité",
    "CONTR": "Contrôles et audits",
}

# Un code : 2 à 6 capitales, puis 1 à 3 segments, avec d'éventuelles espaces
# parasites autour des tirets. Suivi de « : » puis d'une minuscule, d'un
# guillemet ou d'une majuscule (certaines règles commencent par une majuscule).
MOTIF = re.compile(r'\b([A-Z][A-Z0-9]{1,5}(?:\s?-\s?[A-Z0-9]{1,14}){1,3})\s*:\s*(?=[a-zà-ÿ«A-ZÀ-Ý])')

def normaliser(code):
    code = re.sub(r'\s+', '', code)
    for motif, remplacement in SUBSTITUTIONS:
        code = re.sub(motif, remplacement, code)
    return code

def decouper_regles():
    sections = json.load(open(REFS + "ii901.json", encoding="utf-8"))
    texte = sections["anx1"]["texte"]
    for motif, remplacement in CORRECTIONS_TEXTE + JETONS_CASSES:
        texte = re.sub(motif, remplacement, texte)

    reperes = [(m.start(), m.end(), normaliser(m.group(1))) for m in MOTIF.finditer(texte)]
    reperes = [r for r in reperes if r[2] not in NON_CODES]

    regles = {}
    for i, (debut, fin, code) in enumerate(reperes):
        borne = reperes[i + 1][0] if i + 1 < len(reperes) else len(texte)
        bloc = texte[fin:borne].strip()
        # Le libellé de la règle est sa première phrase ; le reste est l'énoncé.
        m = re.match(r'^([^.]{5,150})\.\s*(.*)$', bloc, re.S)
        libelle, enonce = (m.group(1).strip(), m.group(2).strip()) if m else (bloc[:110], bloc)
        if code in regles and len(enonce) <= len(regles[code]["x"]):
            continue                      # occurrence secondaire (renvoi) : on garde la plus complète
        regles[code] = {
            "code": code,
            "t": libelle[0].upper() + libelle[1:] if libelle else code,
            "x": re.sub(r'\s{2,}', ' ', enonce).strip(),
            "fam": FAMILLES.get(code.split("-")[0], "Autres règles"),
            "ordre": i,
        }
    return regles

if __name__ == "__main__":
    regles = decouper_regles()
    json.dump(regles, open(REFS + "ii901_regles.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    from collections import Counter
    familles = Counter(v["fam"] for v in regles.values())
    print("règles extraites : %d, volume %d caractères"
          % (len(regles), sum(len(v["x"]) for v in regles.values())))
    for fam, n in familles.most_common():
        print("  %-64s %3d" % (fam, n))
    courtes = [k for k, v in regles.items() if len(v["x"]) < 60]
    if courtes:
        print("règles au texte très court (à vérifier) :", courtes)
