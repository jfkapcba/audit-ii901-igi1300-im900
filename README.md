# Audit SSI — II 901 / IGI 1300 / IM 900

Outil d'audit de conformité pour les référentiels français de protection des systèmes
d'information sensibles et classifiés. **Un seul fichier HTML, entièrement hors ligne**, avec le
texte officiel des trois instructions intégré.

```
audit-ssi.html   →  ouvrir par double-clic. C'est tout.
```

**Essayer en ligne :** <https://jfkapcba.github.io/audit-ii901-igi1300-im900/> — pratique pour
découvrir l'outil, mais pour un audit réel téléchargez le fichier et ouvrez-le localement : la
version en ligne enregistre la progression dans le stockage du domaine `github.io`.

Pas de serveur, pas d'installation, pas de réseau : l'outil s'ouvre depuis un disque local ou une
clé amovible et conserve la progression de l'audit dans le navigateur ou dans un fichier de votre
choix. Conçu pour être utilisé en salle, sur un poste isolé.

## Organisation du dépôt

| Chemin | Contenu |
|---|---|
| `audit-ssi.html` | **L'outil.** Fichier unique et autonome, 1,5 Mo, assemblé à partir des sources ci-dessous. |
| `source/` | Les morceaux de la page : feuille de styles, balisage, et six modules de code commentés. |
| `outils/` | Chaîne de fabrication : extraction du texte des PDF officiels, découpage en sections, rattachement des points de contrôle, assemblage. |
| `tests/` | Suite de 87 assertions exécutée dans un navigateur réel, réseau coupé. |
| `NOTICE.md` | Origine et statut des textes officiels reproduits. |

### Reconstruire et vérifier

```bash
# déposer ii901.pdf, igi1300.pdf et im900.pdf dans outils/refs/ (liens dans NOTICE.md)
./outils/pipeline.sh     # PDF -> audit-ssi.html, à l'octet près
./tests/executer.sh      # 87 assertions, résolution DNS coupée
```

---

## D'où viennent les exigences

**401 des 537 exigences sont reprises telles quelles d'une source officielle, avec leur
identifiant d'origine.** Les 136 restantes sont des points de contrôle rédigés pour ce projet,
signalés comme tels dans l'outil par la mention *reformulation*.

| Référentiel | Exigences | Origine |
|---|---|---|
| **II 901** | 197, toutes officielles | 15 articles de l'instruction (art. 5 à 19) et les **182 règles codées de l'annexe 1** (`ORG-RSSI`, `EXP-COR-SEC`, `PDT-VEROUIL-FIXE`…) |
| **IGI 1300** | 268, dont **204 officielles** | Le [listing des exigences SSI publié par l'ANSSI](https://cyber.gouv.fr/documents/3/ANSSI-NP-IGI1300-listing_des_exigences-v0.4.xlsx) (v0.4), avec ses identifiants (`HOMOL_01`, `MARQ_04`, `ACC_12`…). 64 points de contrôle rédigés couvrent les domaines que ce listing laisse de côté. |
| **IM 900** | 72, rédigées | Points de contrôle rédigés pour ce projet, rattachés aux sections de l'instruction. |

### Le listing ANSSI ne couvre que le volet SSI de l'IGI 1300

Il porte sur le § 1.4.2.4, l'ensemble du § 6, quelques points du § 7 et l'annexe 30. L'habilitation
des personnels, la sécurité des lieux, les contrats et la gestion des supports papier n'y figurent
pas. Ces domaines restent couverts par des points de contrôle rédigés, regroupés sous des intitulés
suffixés « — hors listing ANSSI ».

## Textes officiels intégrés

Le texte des trois instructions est **inclus dans le fichier**, découpé par article ou par section.
Chaque exigence affiche son énoncé officiel puis la section de l'instruction dont elle découle ;
l'onglet *Textes* permet de parcourir et de rechercher les trois documents en intégralité.

| Référentiel | Version intégrée | Sections | Volume | Provenance |
|---|---|---|---|---|
| **II 901** | Instruction interministérielle n° 901/SGDSN/ANSSI du 28 janvier 2015 | 205 | 78 ko | Document **numérisé** (seule forme publiée) |
| **IGI 1300** | Instruction générale interministérielle n° 1300/SGDSN/PSE/PSD, arrêté du 9 août 2021 | 253 | 343 ko | PDF natif |
| **IM 900** | Instruction ministérielle n° 900/ARM/CAB du 27 août 2025, JORF du 1er octobre 2025 | 121 | 773 ko | PDF natif (Journal officiel) |

Sources : [II 901 sur Légifrance](https://www.legifrance.gouv.fr/circulaire/id/39217) ·
[IGI 1300](https://www.defense.gouv.fr/sites/default/files/ministere-armees/Instruction%20g%C3%A9n%C3%A9rale%20interminist%C3%A9rielle_1300_9_aout_2021.pdf) ·
[IM 900](https://armement.defense.gouv.fr/sites/default/files/2025-10/IM%20900%20du%2027%20ao%C3%BBt%202025.pdf) ·
[listing ANSSI IGI 1300](https://cyber.gouv.fr/documents/3/ANSSI-NP-IGI1300-listing_des_exigences-v0.4.xlsx)

**IM 900 est bien l'instruction *ministérielle* n° 900** du ministère des Armées, relative à la
protection de l'information et des données — et non l'instruction interministérielle 900. La
version du 27 août 2025 abroge celle du 15 mars 2021 et est en vigueur depuis le 1er novembre 2025.

### Ce qui reste en attente

Trois réserves, signalées dans l'outil à l'endroit exact où elles s'appliquent :

* **Annexes de l'IGI 1300** — publiées séparément et non reprises ici, notamment l'annexe 1
  (mesures applicables à la mention Diffusion Restreinte) et l'annexe 37 (modèles de timbres).
  Les 35 exigences ANSSI tirées de l'annexe 30 portent donc leur énoncé sans section de contexte.
* **II 901** — le seul exemplaire publié est un document numérisé ; le texte intégré est une
  transcription automatique. Les corrections de caractères appliquées aux codes de règles sont
  documentées une par une dans `outils/regles901.py`. Recoupés avec une transcription
  indépendante, 179 des 182 codes concordent ; les trois écarts sont expliqués dans ce script.
  L'outil affiche l'avertissement de provenance sur chaque exigence II 901.
* **IM 900** — aucune source d'exigences officielle n'existe pour ce texte : les 72 points de
  contrôle sont rédigés.

Aucun texte n'est inventé ni reformulé : ce qui n'est pas publié est signalé comme manquant, et ce
qui est rédigé est signalé comme rédigé.

## Marquage — conformité vérifiée

Le marquage appliqué à l'écran, dans le rapport HTML, les exports CSV et les impressions suit les
règles des textes :

| Règle | Source | Mise en œuvre |
|---|---|---|
| Niveau inscrit **en toutes lettres**, toujours visible | IGI 1300 § 7.1.2.1 | « DIFFUSION RESTREINTE », « SECRET », « TRÈS SECRET » en capitales ; les abréviations S / TS ne servent qu'au marquage des paragraphes et ne sont pas employées |
| **Encre rouge**, au milieu du haut **et du bas** de chaque page | IGI 1300 § 7.1.2.3 a) | Timbre `#c9191e` centré, bandeau haut et bandeau bas pour Secret et Très Secret |
| Mention **Diffusion Restreinte** à l'encre rouge, **au milieu du haut** de la page | IM 900 § 7.2.3 | Bandeau haut seulement : pas de timbre en pied, conformément au texte |
| Attirer l'attention par sa **position, sa taille et sa couleur** | IGI 1300 § 7.1.2.3 a) | Timbre plus grand que le texte courant à toutes les largeurs d'écran, graisse 800, interlettrage élargi |
| **Timbre de dimension supérieure** au bas de la couverture | IGI 1300 § 7.1.2.3 a) | Timbre 22 pt au bas de la page de garde du rapport |
| Mention **Spécial France** de couleur **bleue**, en haut de page, **immédiatement à droite** du timbre | IM 900 § 7.3.2 | Cartouche `#0050c8` encadré, à droite du timbre principal |
| Identification en première page : autorité émettrice, auteur, date d'émission, numéro d'enregistrement, échéance de la classification | IGI 1300 § 7.1.2.3 b) | Champs saisis à l'initialisation et reportés sur la couverture du rapport |
| Au niveau Très Secret : numéro d'exemplaire et nombre total d'exemplaires | IGI 1300 § 7.1.2.3 b) | Champs dédiés, rendus « 1 sur 3 » |

Aucune police de caractères n'est prescrite par les textes ; l'outil emploie une linéale grasse en
capitales, qui satisfait l'exigence de lisibilité.

**Limite assumée :** la pagination « page X sur Y » exigée par l'IGI 1300 § 7.1.2.3 c) n'est pas
réalisable en HTML — aucun navigateur n'implémente les boîtes de marge `@page`. Activez l'option
d'en-tête et pied de page de la boîte d'impression, qui l'ajoute. L'outil le rappelle dans l'écran
*Dossier*.

## Fonctionnement hors ligne — vérifié

* Aucune occurrence de `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`,
  `import()`, `<link>`, `<iframe>`, `@import`, ni d'URL `http(s)://` dans le fichier livré.
* La suite de tests s'exécute avec la résolution DNS coupée (`--host-resolver-rules="MAP * ~NOTFOUND"`)
  et vérifie qu'aucune ressource n'est chargée en dehors du fichier lui-même.
* Styles, code, catalogue et 1,2 Mo de texte officiel sont dans le même fichier.

## Organisation du code

Le fichier est découpé en quatre parties annoncées par un commentaire d'en-tête :

1. **Feuille de styles** — 13 sections commentées (jetons, timbres, écrans, impression…). Les règles
   de marquage citent l'article qui les fonde.
2. **Balisage** — une `<section>` par écran, identifiants français préfixés par leur rôle
   (`vue-`, `btn-`, `champ-`, `dlg-`).
3. **Données** — catalogue et corpus dans des blocs `<script type="application/json">` distincts,
   pour que le code ne soit pas noyé dans des littéraux de texte.
4. **Code applicatif** — 1 800 lignes, 20 sections numérotées, sommaire en tête, 5 modules
   encapsulés (`Stockage`, `FichierLie`, `Catalogue`, `Corpus`, `Audit`), 6 objets d'écran,
   83 fonctions nommées. Tout est en français ; aucun identifiant anglais.

## Utilisation

* **Initialisation** : client, périmètre, référence, auditeurs, référentiels combinables, niveaux
  traités, marquage du rapport et mentions d'identification.
* **Audit** : 537 exigences réparties en 47 domaines, dont 401 issues directement des sources
  officielles. Statut conforme /
  partiellement conforme / non conforme / non applicable, constat, commentaire, recommandation,
  criticité, responsable, échéance, références des preuves.
* **Textes** : consultation et recherche plein texte dans les trois instructions.
* **Synthèse** : avancement, taux de conformité, répartition, conformité par référentiel et par
  domaine, écarts triés par criticité, plan d'action.
* **Dossier** : export JSON, rapport HTML autonome, CSV, impression, exigences complémentaires.

### Raccourcis

<kbd>1</kbd> non conforme · <kbd>2</kbd> partiellement conforme · <kbd>3</kbd> conforme ·
<kbd>0</kbd> non applicable · <kbd>Alt</kbd>+<kbd>↓</kbd>/<kbd>↑</kbd> exigence suivante /
précédente · <kbd>Ctrl</kbd>+<kbd>S</kbd> export `.json`.

### Conservation de la progression

1. **Stockage du navigateur** — automatique ; propre au navigateur, à la machine *et à
   l'emplacement du fichier*.
2. **Fichier lié** — sur Chrome, Edge et dérivés, chaque modification est écrite dans un `.json`
   de votre choix, y compris sur clé amovible. La liaison survit à la fermeture du navigateur.
3. **Export `.json`** — sauvegarde complète et transférable, à faire en fin de vacation.

L'outil affiche en permanence lequel des trois est actif et avertit si le stockage local est
indisponible.

## Protection des données produites

L'outil ne transmet rien, mais les fichiers qu'il produit contiennent le nom du client et le détail
des non-conformités d'un système pouvant traiter des informations classifiées. **Protégez,
transportez et détruisez ces fichiers conformément au marquage retenu**, qui est reporté sur chacun
d'eux.

## Limites

Aide à la conduite d'audit. Ne se substitue ni aux textes officiels, ni à l'appréciation de
l'auditeur, ni à la décision de l'autorité d'homologation. Les énoncés de contrôle sont une
reformulation de travail ; en cas de divergence, le texte officiel affiché à côté prévaut.

## Vérifications effectuées

87 assertions automatisées exécutées dans un navigateur réel (Chromium sans interface, **réseau
coupé**) : intégrité des trois corpus, reprise effective des identifiants officiels, présence d'un
énoncé ou d'une section de texte pour chaque exigence, conformité du marquage aux quatre niveaux (couleur mesurée sur
le style calculé, position, taille, présence ou absence du bandeau bas, mention Spécial France),
parcours complet de création d'audit, saisie, raccourcis, filtres, recherche portant sur le texte
officiel, écran des textes, synthèse, exports CSV / JSON / rapport, cycle export → import,
persistance. Zéro erreur JavaScript, zéro ressource externe, aucun débordement horizontal à 400 px.

## Licence

Code, énoncés de contrôle et documentation : **Licence Ouverte 2.0 (Etalab)** — voir `LICENCE`.
Réutilisation libre, y compris commerciale, sous réserve de mentionner la source.

Le texte des instructions officielles reproduit dans l'outil n'est pas couvert par cette licence :
ce sont des actes officiels de l'État, dont l'origine et le statut sont décrits dans `NOTICE.md`.
