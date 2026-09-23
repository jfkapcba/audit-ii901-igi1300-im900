# -*- coding: utf-8 -*-
"""Découpe l'annexe 1 de l'II 901 en règles codées (ORG-SSI, PDT-CONFIG, …).

Le seul exemplaire disponible de l'II 901 est un document numérisé ; le texte
est donc issu d'une océrisation. Les corrections appliquées ci-dessous sont
limitées aux confusions de caractères systématiques et documentées.
"""
import json, re, sys
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chemins import REFS, BUILD, SOURCE, SORTIE, OUTILS
RACINE = REFS

# Confusions d'océrisation constatées et vérifiées dans le document : O/D, V/Y, i/l.
CORRECTIONS_CODES = {
    "POT-STOCK": "PDT-STOCK", "POT-SAUV-LOC": "PDT-SAUV-LOC", "POT-PART-FIC": "PDT-PART-FIC",
    "POT-SUPPR-PART": "PDT-SUPPR-PART", "POT-AMOY": "PDT-AMOV", "POT-NOMAD-STOCK": "PDT-NOMAD-STOCK",
    "POT-NOMAD-CONNEX": "PDT-NOMAD-CONNEX", "POT-NOMAD-OESACTIV": "PDT-NOMAD-DESACTIV",
    "POT-TEL-CODES": "PDT-TEL-CODES", "PDT-NOMAD-PAREFEU": "PDT-NOMAD-PAREFEU",
    "PDT-CONF-YERIF": "PDT-CONF-VERIF", "PDT-VEROUIL-FIXE": "PDT-VERROUIL-FIXE",
    "PDT-VEROUIL-PORT": "PDT-VERROUIL-PORT", "PDT-MUL-SECNUM": "PDT-MUL-SECNUM",
    "EXP-DOM-SERY": "EXP-DOM-SERV", "DEY-FUITES": "DEV-FUITES", "DEY-LOG-ADHER": "DEV-LOG-ADHER",
    "DEY-LOG-CRIT": "DEV-LOG-CRIT", "DEY-LOG-CYCLE": "DEV-LOG-CYCLE", "DEY-LOG-PASS": "DEV-LOG-PASS",
    "LOG-WEB": "DEV-LOG-WEB", "EXP-RESTR-DROITS": "EXP-RESTR-DROITS",
}
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
    "SI":    "Sécurité des systèmes de sûreté",
    "RES":   "Sécurité des réseaux",
    "ARCHI": "Architecture d'hébergement et passerelles",
    "EXP":   "Exploitation, administration et maintien en condition de sécurité",
    "PDT":   "Postes de travail, nomadisme et périphériques",
    "DEV":   "Développement et acquisition de logiciels",
    "INTEGR":"Développement et acquisition de logiciels",
    "SOUS":  "Développement et acquisition de logiciels",
    "APPL":  "Développement et acquisition de logiciels",
    "TI":    "Traitement des incidents",
    "INC":   "Traitement des incidents",
    "PCA":   "Continuité et reprise d'activité",
    "CONTR": "Contrôles et audits",
    "PASS":  "Exploitation, administration et maintien en condition de sécurité",
}

def decouper_regles():
    s = json.load(open(RACINE + "ii901.json", encoding="utf-8"))
    texte = s["anx1"]["texte"]
    for a, b in CORRECTIONS_TEXTE:
        texte = re.sub(a, b, texte)
    motif = re.compile(r'\b([A-Z]{2,6}(?:-[A-Z0-9]{2,10}){0,3})\s*:\s*(?=[a-zà-ÿ])')
    coups = [(m.start(), m.end(), m.group(1)) for m in motif.finditer(texte)
             if m.group(1) not in ("PSSI", "SSI", "ANSSI", "PSSIE", "PSSIM", "RSSI", "DR", "II")]
    regles = {}
    for i, (d, f, code) in enumerate(coups):
        fin = coups[i + 1][0] if i + 1 < len(coups) else len(texte)
        bloc = texte[f:fin].strip()
        # le libellé de la règle est la première phrase, le reste est son énoncé
        m = re.match(r'^([^.]{5,150})\.\s*(.*)$', bloc, re.S)
        libelle, enonce = (m.group(1).strip(), m.group(2).strip()) if m else (bloc[:100], bloc)
        code = CORRECTIONS_CODES.get(code, code)
        if code in regles:            # occurrence ultérieure : on garde la plus longue
            if len(enonce) <= len(regles[code]["x"]):
                continue
        famille = code.split("-")[0]
        regles[code] = {
            "code": code,
            "t": libelle[0].upper() + libelle[1:],
            "x": re.sub(r'\s{2,}', ' ', enonce).strip(),
            "fam": FAMILLES.get(famille, "Autres règles"),
            "ordre": i,
        }
    return regles

if __name__ == "__main__":
    r = decouper_regles()
    json.dump(r, open(RACINE + "ii901_regles.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    from collections import Counter
    c = Counter(v["fam"] for v in r.values())
    print("règles extraites : %d, volume %d caractères" % (len(r), sum(len(v["x"]) for v in r.values())))
    for fam, n in c.most_common():
        print("  %-62s %3d" % (fam, n))
    courtes = [k for k, v in r.items() if len(v["x"]) < 60]
    print("règles au texte très court (à vérifier) :", len(courtes), courtes[:12])
