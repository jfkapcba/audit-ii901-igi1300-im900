# Chaîne de fabrication

```bash
python3 construire_donnees.py && python3 assembler.py
```

## Recenser et extraire les arrêtés

Les arrêtés sectoriels ne sont pas récupérables depuis Légifrance, qui bloque les clients non
interactifs. La source employée est le jeu de données ouvert de la DILA :
<https://echanges.dila.gouv.fr/OPENDATA/JORF/>, archive `Freemium_jorf_global` (1,6 Go).

L'archive n'étant pas indexée et `tar` ne sachant pas filtrer sur le contenu, le recensement se
fait en la parcourant une fois en flux (`recenser.py`), en retenant les textes dont le titre
contient « règles de sécurité » et « systèmes d'information d'importance vitale ». Cela évite de
chercher les identifiants un par un et garantit qu'aucun arrêté n'est oublié.

L'extraction se fait ensuite en **une seule passe** : les trois niveaux — texte, sections,
articles — partagent le préfixe de répertoire dérivé de l'identifiant du texte
(`000033518925` → `00/00/33/51`), ce qui permet de tout attraper sans connaître à l'avance les
identifiants de sections et d'articles.

L'annexe I est le plus gros article du texte, environ 36 000 caractères.

Trois pièges rencontrés :

* chaque texte possède **deux** fichiers XML portant le même nom, dont un « version » dépourvu de
  structure : il faut indexer les deux chemins, sinon le bon est écrasé ;
* le préfixe de répertoire **ne suffit pas** à identifier un texte — des textes voisins le
  partagent et les articles d'un même texte débordent parfois sur le préfixe suivant. Retenir
  simplement « le plus gros article du préfixe » revient à prendre l'annexe d'un autre arrêté.
  On suit donc les renvois `LIEN_SECTION_TA` puis `LIEN_ART`, qui sont exacts ;
* le contenu des articles est du HTML encapsulé, dont il faut respecter les sauts de bloc sous
  peine de coller les titres au corps.

```bash
python3 extraire_arretes_lpm.py   # écrit refs/arretes_lpm.json
python3 construire_donnees.py && python3 assembler.py
```

`extraire_arretes_lpm.py` distingue deux cas d'absence d'annexe, et c'est important : si tous les
articles référencés par le texte sont présents et qu'aucun ne porte les vingt règles, l'annexe I
**n'est pas publiée** ; sinon, l'extraction est incomplète et doit être reprise.

Le script signale enfin combien de règles diffèrent entre chaque secteur et le premier. **Un écart
nul doit alerter** : il signifie presque toujours que l'annexe d'un autre arrêté a été retenue par
erreur, et non que deux arrêtés sont identiques.

| Script | Rôle |
|---|---|
| `donnees_lpm.py` | Secteurs, regroupement en domaines, énoncés de contrôle et éléments de preuve des vingt règles. |
| `donnees_rgs.py` | Points de contrôle RGS, entièrement rédigés pour ce projet. |
| `extraire_arretes_lpm.py` | Texte des annexes I depuis l'extraction DILA, découpé par règle. |
| `construire_donnees.py` | Assemble le catalogue, indexe les règles par secteur. |
| `assembler.py` | Concatène styles, balisage, données et code en un fichier unique. |
