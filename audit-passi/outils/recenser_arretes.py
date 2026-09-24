# -*- coding: utf-8 -*-
"""Recense dans l'archive JORF tous les arrêtés sectoriels « règles de sécurité
des systèmes d'information d'importance vitale ».

L'archive n'est pas indexée et `tar` ne sait pas filtrer sur le contenu : on la
parcourt donc une fois en flux, en ne retenant que l'identifiant et le titre de
chaque texte, puis on filtre sur le libellé caractéristique de ces arrêtés.
"""
import re, sys, json

ID = re.compile(rb"<ID>(JORFTEXT\d+)</ID>")
TITRE = re.compile(rb"<TITREFULL>(.*?)</TITREFULL>", re.S)
CIBLE = "systèmes d'information d'importance vitale"

courant_id, tampon, trouves = None, b"", {}
for ligne in sys.stdin.buffer:
    tampon += ligne
    if len(tampon) > 400_000:                      # borne de sécurité
        tampon = tampon[-200_000:]
    m = ID.search(tampon)
    if m:
        courant_id = m.group(1).decode()
    t = TITRE.search(tampon)
    if t and courant_id:
        titre = re.sub(r"\s+", " ", t.group(1).decode("utf-8", "replace")).strip()
        if CIBLE in titre and "règles de sécurité" in titre:
            trouves[courant_id] = titre
            print("  %s  %s" % (courant_id, titre[:150]), flush=True)
        tampon = tampon[t.end():]
        courant_id = None
json.dump(trouves, open("arretes-recenses.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("TOTAL : %d arrêtés recensés" % len(trouves))
