# Suite de vérification

```bash
./executer.sh                       # navigateur détecté automatiquement
CHROME=/chemin/vers/chrome ./executer.sh
```

`harnais.html` est injecté dans une copie de `audit-passi.html` puis exécuté dans Chromium sans
interface, **avec la résolution DNS coupée** (`--host-resolver-rules="MAP * ~NOTFOUND"`). Le
fichier livré n'est jamais modifié.

Les 99 assertions couvrent :

* **Corpus officiel** — les trois textes sont chargés, leurs sections repères sont présentes et
  non vides.
* **Provenance** — chaque exigence porte soit son énoncé officiel, soit une section de texte non
  vide ; les identifiants officiels (`HOMOL_01`, `ORG-RSSI`, `EXP-IMP-2`…) sont effectivement
  repris ; toute exigence rédigée pour ce projet est signalée comme telle.
* **Marquage** — conformité aux modèles de l'annexe 37 de l'IGI 1300 : encre mesurée sur le style
  calculé, police Arial, taille 18, cadre déclaré à 2,5 points, texte centré, capitales, présence
  ou absence du bandeau bas selon le niveau, cartouche Spécial France en bleu aux mêmes règles, et
  dans le rapport : cadre de 3 points en couverture avec l'avertissement pénal, Spécial France
  apposé uniquement en haut de page.
* **Parcours d'audit** — création, plan de contrôle, arbre, panneau d'exigence, statuts au
  clavier, navigation, filtres, recherche portant sur le texte officiel.
* **Écran des textes**, **synthèse** (taux, anneau SVG, reprise du marquage).
* **Exports** — CSV, rapport HTML autonome (encres, timbres haut/bas/couverture, mentions
  d'identification), JSON ; puis cycle export → import.
* **Hors ligne** — aucune ressource chargée en dehors du fichier.

Le script sort en code 1 si une assertion échoue.
