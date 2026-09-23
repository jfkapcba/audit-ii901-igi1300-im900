# -*- coding: utf-8 -*-
"""Découpe un texte pdftotext -layout en sections numérotées, en retirant
les en-têtes/pieds de page et en isolant les notes de bas de page."""
import re, json, sys

BARE_NUM = re.compile(r'^\s*(\d{1,4})\s*$')
# Titre de section : « 1 », « 1.2 », « 1.2.3 », « 7.1.2.1 » suivi d'un libellé
TITRE = re.compile(r'^(\s*)(\d+(?:\.\d+){0,3})\s+([^\d\s].*)$')

# Mots français d'une lettre : ne jamais les coller au mot suivant.
LETTRES_MOTS = ("À", "A", "Y", "O", "N")

def petites_capitales(t):
    """Répare l'artefact de rendu des petites capitales : « T RAÇABILITE » -> « TRAÇABILITE ».

    Le PDF rend l'initiale en capitale pleine et le reste en petites capitales, ce que
    l'extraction traduit par une espace parasite. On ne recolle donc que si l'initiale
    n'est pas un mot français à elle seule (à, a, y…)."""
    t = re.sub(r'\b([A-ZÀ-ÝŒ]) ([A-ZÀ-ÝŒ]{2,})',
               lambda m: m.group(0) if m.group(1) in LETTRES_MOTS else m.group(1) + m.group(2), t)
    t = re.sub(r"([A-ZÀ-ÝŒ]) '", r"\1'", t)
    return re.sub(r'\s{2,}', ' ', t).strip()

def nettoyer_page(page, entetes):
    """Retire en-têtes, pied de page et bloc de notes ; renvoie (corps, notes)."""
    lignes = page.split("\n")
    lignes = [l for l in lignes if not any(h in l for h in entetes) and not re.search(r"\.{4,}", l)]
    while lignes and not lignes[-1].strip():
        lignes.pop()
    # pied de page : numéro isolé en fin de page
    while lignes and BARE_NUM.match(lignes[-1]):
        lignes.pop()
        while lignes and not lignes[-1].strip():
            lignes.pop()
    # bloc de notes : premier « numéro isolé + ligne indentée » du dernier tiers
    # Un bloc de notes de bas de page se reconnaît à une suite d'appels isolés
    # (« 110 », « 111 », …) de numéros croissants, chacun suivi d'une ligne
    # indentée, et situé en fin de page. On repère tous les candidats puis on
    # remonte la chaîne croissante la plus longue pour trouver son début : cela
    # évite de confondre une note avec une ligne du corps réduite à un nombre.
    candidats = [(i, int(lignes[i].strip()))
                 for i in range(1, len(lignes) - 1)
                 if BARE_NUM.match(lignes[i])
                 and lignes[i + 1].strip() and lignes[i + 1].startswith(" ")]
    debut_notes = None
    if candidats:
        j = len(candidats) - 1
        while j > 0 and candidats[j - 1][1] < candidats[j][1] \
              and candidats[j][1] - candidats[j - 1][1] <= 3:
            j -= 1
        # le bloc doit occuper la fin de la page pour être une note
        if candidats[-1][0] >= len(lignes) * 0.4:
            debut_notes = candidats[j][0]
    if debut_notes is None:
        return lignes, []
    return lignes[:debut_notes], lignes[debut_notes:]

def assembler(lignes):
    """Recolle les lignes en paragraphes : une ligne courte ou une puce termine un paragraphe."""
    paras, courant = [], []
    for l in lignes:
        s = l.rstrip()
        if not s.strip():
            if courant: paras.append(" ".join(courant)); courant = []
            continue
        nu = s.strip()
        puce = nu.startswith("-") or nu.startswith("•") or re.match(r'^[a-z]\)', nu) or re.match(r'^\d+[°)]', nu)
        if puce and courant:
            paras.append(" ".join(courant)); courant = []
        courant.append(nu)
        # une ligne nettement plus courte que la pleine largeur clôt le paragraphe
        if len(nu) < 55 and not puce:
            paras.append(" ".join(courant)); courant = []
    if courant: paras.append(" ".join(courant))
    out = []
    for p in paras:
        p = re.sub(r'\s{2,}', ' ', p).strip()
        p = re.sub(r'\s+([,.])', r'\1', p)        # pas d'espace avant virgule et point
        p = re.sub(r'\s*([;:!?»])', r' \1', p)      # espace avant les ponctuations doubles
        p = re.sub(r'«\s*', '« ', p)
        p = p.replace("’", "’")
        p = re.sub(r'(\w)- (\w)', r'\1\2', p)
        # « a) Timbre Il indique… » -> l'intitulé du point passe à la ligne
        p = re.sub(r'^([a-z]\)\s+[A-ZÀ-Ý][^.]{2,40}?)\s+([A-ZÀ-Ý][a-zà-ÿ])', r'\1\n\2', p)
        if p: out.append(p)
    return "\n".join(out)

def decouper(chemin, entetes, debut_marqueur, fin_marqueur=None, prefixe=""):
    brut = open(chemin, encoding="utf-8").read()
    pages = brut.split("\f")
    corps_total, notes_par_section = [], {}
    for pg in pages:
        c, n = nettoyer_page(pg, entetes)
        corps_total.extend(c)
        corps_total.append("")           # séparateur de page
    # se placer après le sommaire
    texte = "\n".join(corps_total)
    i = texte.find(debut_marqueur)
    if i < 0: raise SystemExit("marqueur de début introuvable : " + debut_marqueur)
    texte = texte[i:]
    if fin_marqueur:
        j = texte.find(fin_marqueur)
        if j > 0: texte = texte[:j]

    sections, courant = {}, None
    tampon = []
    for l in texte.split("\n"):
        m = TITRE.match(l)
        # un titre est court, ne finit pas par un point de phrase, et commence par une majuscule
        est_titre = False
        if m:
            num, lib = m.group(2), m.group(3).strip()
            est_titre = (len(lib) < 130 and not lib.endswith(".") and lib[0].isupper()
                         and not re.match(r'^(er|ème|e)\b', lib))
        if est_titre:
            if courant: sections[courant]["texte"] = assembler(tampon)
            courant = prefixe + num
            sections[courant] = {"num": num, "titre": petites_capitales(lib), "niveau": num.count(".") + 1}
            tampon = []
        elif courant:
            tampon.append(l)
    if courant: sections[courant]["texte"] = assembler(tampon)
    return sections

if __name__ == "__main__":
    pass
