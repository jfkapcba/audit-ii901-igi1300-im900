# -*- coding: utf-8 -*-
"""Texte des arrêtés sectoriels LPM, depuis les données ouvertes du JORF.

Légifrance bloque les clients non interactifs. La source employée est le jeu de
données ouvert de la DILA : https://echanges.dila.gouv.fr/OPENDATA/JORF/
(archive « Freemium_jorf_global »). Voir outils/README.md pour la procédure.

Les arrêtés sont recensés dans l'archive par leur titre, puis leurs textes,
sections et articles en sont extraits. L'annexe I — les vingt règles de sécurité
— est le plus gros article de chaque texte.

Le texte des règles DIFFÈRE d'un secteur à l'autre : c'est la raison d'être de
cette extraction, et le script le contrôle en fin de traitement.
"""
import os, re, sys, json, html, unicodedata
import xml.etree.ElementTree as ET
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chemins import REFS

CACHE = os.path.expanduser("~/.cache/dila")
EXTRACTION = os.path.join(CACHE, "extrait")
RECENSEMENT = os.path.join(CACHE, "arretes-recenses.json")

BLOCS = {"p", "br", "li", "ul", "ol", "div", "table", "tr"}
TITRE_REGLE = re.compile(r'^(\d{1,2})\.\s*(R[èe]gle[^\n]{0,140})$', re.M)
SECTEUR = re.compile(r"relati(?:ves?|f) au (?:sous-)?secteur d'activités d'importance vitale\s*«\s*(.+?)\s*»")
DATE = re.compile(r"Arrêté du ([^,]+?) (?:fixant|modifiant)")

def identifiant(nom):
    """Clé stable et lisible pour un secteur : « Gestion de l'eau » -> gestion-de-l-eau."""
    sans_accent = "".join(c for c in unicodedata.normalize("NFD", nom)
                          if unicodedata.category(c) != "Mn")
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", sans_accent.lower())).strip("-")

def texte_de(noeud):
    """Rend le contenu XML en respectant les sauts de bloc du HTML encapsulé."""
    morceaux = []
    def parcours(element):
        if element.tag.lower() in BLOCS:
            morceaux.append("\n")
        if element.text:
            morceaux.append(element.text)
        for enfant in element:
            parcours(enfant)
            if enfant.tail:
                morceaux.append(enfant.tail)
        if element.tag.lower() in BLOCS:
            morceaux.append("\n")
    parcours(noeud)
    brut = html.unescape("".join(morceaux)).replace(" ", " ")
    lignes = [re.sub(r"[ \t]+", " ", l).strip() for l in brut.split("\n")]
    return "\n".join(l for l in lignes if l)

def index_fichiers():
    """Indexe les fichiers extraits par identifiant.

    Un même identifiant existe en plusieurs exemplaires — un fichier de
    structure et un fichier de version pour les textes — et seul l'un d'eux
    porte les renvois. On conserve donc tous les chemins."""
    par_identifiant = {}
    for racine, _, fichiers in os.walk(EXTRACTION):
        for fichier in fichiers:
            if fichier.endswith(".xml"):
                par_identifiant.setdefault(fichier[:-4], []).append(os.path.join(racine, fichier))
    return par_identifiant

def articles_du_texte(identifiant_jorf, index):
    """Identifiants des articles d'un texte, en suivant texte -> sections -> articles.

    Le préfixe de répertoire ne suffit pas : des textes voisins le partagent, et
    les articles d'un même texte peuvent déborder sur le préfixe suivant. On suit
    donc les renvois du XML, qui sont exacts."""
    sections = []
    for chemin in index.get(identifiant_jorf, []):
        racine = ET.parse(chemin).getroot()
        sections += [e.get("id") for e in racine.iter("LIEN_SECTION_TA") if e.get("id")]
    articles = []
    for section in dict.fromkeys(sections):
        for chemin_section in index.get(section, []):
            noeud = ET.parse(chemin_section).getroot()
            articles += [e.get("id") for e in noeud.iter("LIEN_ART") if e.get("id")]
    return list(dict.fromkeys(articles))

def annexe_de(identifiant_jorf, index):
    """Annexe I d'un texte : celui de ses articles qui porte les vingt règles."""
    candidats = [(os.path.getsize(chemin), chemin)
                 for a in articles_du_texte(identifiant_jorf, index)
                 for chemin in index.get(a, [])]
    for _, chemin in sorted(candidats, reverse=True):
        racine_xml = ET.parse(chemin).getroot()
        noeud = racine_xml.find(".//BLOC_TEXTUEL/CONTENU")
        if noeud is None:
            noeud = racine_xml.find(".//CONTENU")
        if noeud is None:
            continue
        contenu = texte_de(noeud)
        if len(TITRE_REGLE.findall(contenu)) >= 15:
            return contenu
    return None

def decouper(texte_annexe):
    reperes = [(m.start(), int(m.group(1)), m.group(2).strip())
               for m in TITRE_REGLE.finditer(texte_annexe)]
    regles = {}
    for i, (debut, numero, titre) in enumerate(reperes):
        fin = reperes[i + 1][0] if i + 1 < len(reperes) else len(texte_annexe)
        corps = texte_annexe[debut:fin].split("\n", 1)
        regles[str(numero)] = {"titre": titre.rstrip(" :.;"),
                               "texte": corps[1].strip() if len(corps) > 1 else ""}
    return regles

if __name__ == "__main__":
    recensement = json.load(open(RECENSEMENT, encoding="utf-8"))
    index = index_fichiers()
    resultat, ecartes, sans_annexe = {}, [], []
    for ident, titre in sorted(recensement.items(), key=lambda kv: kv[1]):
        if "modifiant" in titre:
            ecartes.append((ident, "arrêté modificatif")); continue
        secteur = SECTEUR.search(titre)
        if not secteur:
            ecartes.append((ident, "secteur non identifié")); continue
        nom = secteur.group(1).replace("Etat", "État")
        annexe = annexe_de(ident, index)
        if not annexe:
            # Tous les articles du texte sont bien présents : si aucun ne porte
            # les vingt règles, c'est que l'annexe I n'est pas publiée au JO.
            articles = articles_du_texte(ident, index)
            if articles and all(a in index for a in articles):
                sans_annexe.append({"secteur": nom, "jorf": ident,
                                    "date": (DATE.search(titre).group(1).strip()
                                             if DATE.search(titre) else "")})
                ecartes.append((ident, "%s : annexe I non publiée au JO" % nom))
            else:
                ecartes.append((ident, "%s : extraction incomplète" % nom))
            continue
        regles = decouper(annexe)
        if len(regles) < 15:
            ecartes.append((ident, "%s : %d règles seulement" % (nom, len(regles)))); continue
        cle = identifiant(nom)
        date = DATE.search(titre)
        resultat[cle] = {"secteur": nom, "jorf": ident,
                         "date": date.group(1).strip() if date else "",
                         "regles": regles}
        print("  %-34s %-18s %2d règles  %6d car."
              % (nom[:34], resultat[cle]["date"][:18], len(regles),
                 sum(len(r["texte"]) for r in regles.values())))
    json.dump({"secteurs": resultat, "sansAnnexe": sans_annexe},
              open(REFS + "arretes_lpm.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\n  %d secteurs intégrés, %d dont l'annexe I n'est pas publiée"
          % (len(resultat), len(sans_annexe)))
    for ident, motif in ecartes:
        print("  écarté : %-22s %s" % (ident, motif))

    # Contrôle : les règles diffèrent-elles réellement d'un secteur à l'autre ?
    normalise = lambda t: re.sub(r"\s+", " ", t).strip()
    cles = sorted(resultat)
    if len(cles) >= 2:
        reference = resultat[cles[0]]["regles"]
        for autre in cles[1:]:
            b = resultat[autre]["regles"]
            n = sum(1 for k in reference if k in b
                    and normalise(reference[k]["texte"]) != normalise(b[k]["texte"]))
            print("  %-30s %2d règles sur 20 diffèrent de « %s »"
                  % (resultat[autre]["secteur"][:30], n, resultat[cles[0]]["secteur"]))
