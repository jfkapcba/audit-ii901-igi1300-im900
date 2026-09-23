# Suite de vérification

```bash
./executer.sh                       # navigateur détecté automatiquement
CHROME=/chemin/vers/chrome ./executer.sh
```

`harnais.html` est injecté dans une copie de `audit-ssi.html` puis exécuté dans Chromium sans
interface, **avec la résolution DNS coupée** (`--host-resolver-rules="MAP * ~NOTFOUND"`). Le
fichier livré n'est jamais modifié.

Les 76 assertions couvrent :

* **Corpus officiel** — les trois textes sont chargés, leurs sections repères sont présentes et
  non vides.
* **Rattachement** — chacun des 254 points de contrôle vise des sections qui existent réellement
  et contiennent du texte.
* **Marquage** — couleur d'encre mesurée sur le style calculé, position, taille comparée au texte
  courant, graisse, capitales, présence ou absence du bandeau bas selon le niveau, cartouche
  Spécial France en bleu à droite du timbre principal.
* **Parcours d'audit** — création, plan de contrôle, arbre, panneau d'exigence, statuts au
  clavier, navigation, filtres, recherche portant sur le texte officiel.
* **Écran des textes**, **synthèse** (taux, anneau SVG, reprise du marquage).
* **Exports** — CSV, rapport HTML autonome (encres, timbres haut/bas/couverture, mentions
  d'identification), JSON ; puis cycle export → import.
* **Hors ligne** — aucune ressource chargée en dehors du fichier.

Le script sort en code 1 si une assertion échoue.
