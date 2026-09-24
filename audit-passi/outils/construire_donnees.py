# -*- coding: utf-8 -*-
"""Assemble le catalogue de l'outil d'audit PASSI (RGS et LPM)."""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chemins import BUILD
import donnees_lpm as lpm
import donnees_rgs as rgs

def arretes():
    """Annexes I extraites et arrêtés dont l'annexe n'est pas publiée."""
    chemin = os.path.join(os.path.dirname(os.path.abspath(__file__)), "refs", "arretes_lpm.json")
    if not os.path.exists(chemin):
        return {"secteurs": {}, "sansAnnexe": []}
    return json.load(open(chemin, encoding="utf-8"))

def referentiel_lpm(textes):
    # L'intitulé officiel de chaque règle est repris de l'annexe I ; à défaut
    # d'extraction, on retombe sur le libellé court employé par l'ANSSI.
    titres = {}
    for secteur in textes.values():
        for numero, regle in secteur["regles"].items():
            titres.setdefault(int(numero), regle["titre"])
    domaines = {}
    for numero, intitule, domaine, controle, preuves in lpm.REGLES:
        domaines.setdefault(domaine, []).append({
            "id": "LPM-R%02d" % numero,
            "t": titres.get(numero, intitule),
            "src": "Arrêté sectoriel, annexe I, règle %d" % numero,
            "ctrl": controle,
            "pr": list(preuves),
            "redige": True,          # l'intitulé est officiel, l'énoncé de contrôle est rédigé
            "officielTitre": True,   # signale que l'intitulé, lui, vient du texte
        })
    return {
        "id": "LPM", "code": "LPM",
        "nom": "Règles de sécurité des systèmes d'information d'importance vitale",
        "ref": "Annexe I des arrêtés sectoriels pris en application des articles R. 1332-41-1, "
               "R. 1332-41-2 et R. 1332-41-10 du code de la défense",
        "portee": "Systèmes d'information d'importance vitale des opérateurs d'importance vitale. "
                  "Les vingt règles de l'annexe I sont communes à tous les secteurs.",
        "avertissement": "Le texte des règles diffère d'un arrêté sectoriel à l'autre : choisissez "
                         "le secteur pour que l'énoncé applicable s'affiche. Quatre sous-secteurs "
                         "— activités militaires, judiciaires, industrielles de l'armement et "
                         "espace — n'ont pas d'annexe I publiée au Journal officiel : leur énoncé "
                         "reste à saisir.",
        "secteurs": True,
        "domaines": [{"id": cle, "nom": lpm.DOMAINES[cle], "exigences": ex}
                     for cle, ex in domaines.items()],
    }

def referentiel_rgs():
    domaines = {}
    for identifiant, intitule, domaine, controle, preuves in rgs.CONTROLES:
        domaines.setdefault(domaine, []).append({
            "id": "RGS-" + identifiant,
            "t": intitule,
            "src": "RGS v2.0",
            "ctrl": controle,
            "pr": list(preuves),
            "redige": True,
        })
    return {
        "id": "RGS", "code": "RGS",
        "nom": "Référentiel général de sécurité, version 2.0",
        "ref": "Arrêté du 13 juin 2014 portant approbation du référentiel général de sécurité "
               "(NOR : PRMD1413745A), en vigueur au 1er juillet 2014",
        "portee": "Systèmes d'information des autorités administratives mis en œuvre pour les échanges "
                  "par voie électronique avec les usagers et entre autorités administratives.",
        "avertissement": "Ces points de contrôle sont rédigés pour cet outil : le corps du RGS et ses "
                         "annexes n'ont pas pu être récupérés automatiquement. Aucune numérotation de "
                         "chapitre n'est citée. Renseignez l'énoncé officiel et sa référence exigence "
                         "par exigence depuis votre exemplaire du référentiel.",
        "secteurs": False,
        "domaines": [{"id": cle, "nom": rgs.DOMAINES[cle], "exigences": ex}
                     for cle, ex in domaines.items()],
    }

def catalogue():
    donnees = arretes()
    textes = donnees["secteurs"]
    # La liste proposée est celle des arrêtés eux-mêmes — secteurs et
    # sous-secteurs — et non celle, plus grossière, de l'arrêté de 2006 :
    # c'est l'arrêté qui porte les règles applicables.
    secteurs = [{"id": cle, "nom": v["secteur"], "arrete": v["date"],
                 "jorf": v["jorf"], "reglesPubliees": True}
                for cle, v in textes.items()]
    for sans in donnees["sansAnnexe"]:
        secteurs.append({"id": lpm.identifiant(sans["secteur"]), "nom": sans["secteur"],
                         "arrete": sans["date"], "jorf": sans["jorf"], "reglesPubliees": False})
    secteurs.sort(key=lambda s: s["nom"])
    return {
        "version": "2026.09-passi.3",
        "secteurs": secteurs,
        # Énoncés officiels des vingt règles, par secteur : c'est le secteur
        # retenu pour l'audit qui détermine le texte applicable.
        "reglesLPM": {cle: {num: regle["texte"] for num, regle in v["regles"].items()}
                      for cle, v in textes.items()},
        "referentiels": [referentiel_rgs(), referentiel_lpm(textes)],
    }

if __name__ == "__main__":
    donnees = catalogue()
    json.dump(donnees, open(BUILD + "catalogue.json", "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
    total = 0
    publies = [s for s in donnees["secteurs"] if s["reglesPubliees"]]
    print("  %d secteurs, dont %d avec annexe I publiée et intégrée"
          % (len(donnees["secteurs"]), len(publies)))
    for s in donnees["secteurs"]:
        if not s["reglesPubliees"]:
            print("     annexe I non publiée : %s (%s)" % (s["nom"], s["arrete"]))
    for ref in donnees["referentiels"]:
        n = sum(len(d["exigences"]) for d in ref["domaines"])
        total += n
        print("  %-5s %-62s %2d domaines %3d exigences"
              % (ref["code"], ref["nom"][:62], len(ref["domaines"]), n))
    print("  %-5s %-62s %2d secteurs  %3d exigences au total"
          % ("", "", len(donnees["secteurs"]), total))
