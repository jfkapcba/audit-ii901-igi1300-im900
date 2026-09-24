# Audit PASSI — RGS et LPM

Outil de conduite d'audit pour les prestations d'audit de la sécurité des systèmes d'information,
selon deux référentiels cibles : le **RGS** et les **règles de sécurité des SIIV** prises au titre
de la loi de programmation militaire. **Un seul fichier HTML, entièrement hors ligne.**

```
audit-passi.html   →  ouvrir par double-clic. C'est tout.
```

## Ce que couvre le plan de contrôle

| Référentiel | Exigences | Origine |
|---|---|---|
| **RGS v2.0** | 22, en 5 domaines | Points de contrôle **rédigés pour cet outil** à partir de l'arrêté du 13 juin 2014. Aucune numérotation de chapitre n'est citée : le corps du RGS n'a pas pu être récupéré. |
| **LPM — SIIV** | 20, en 5 domaines | **Numérotation, intitulés et texte officiels** des vingt règles de l'annexe I, extraits du *Journal officiel* pour **18 secteurs**. Les énoncés de contrôle et les éléments de preuve sont rédigés. |

Chaque exigence indique sa provenance : `intitulé officiel` pour les règles LPM, `point de contrôle
rédigé` pour ce qui vient de cet outil.

## Secteurs d'activités d'importance vitale

**22 secteurs et sous-secteurs** sont proposés — un par arrêté sectoriel, et non selon la liste
plus grossière de l'arrêté du 2 juin 2006 : c'est l'arrêté qui porte les règles applicables, et
plusieurs secteurs sont découpés en sous-secteurs ayant chacun le leur (trois pour la santé,
trois pour les transports, quatre pour l'énergie, deux pour les communications, deux pour
l'industrie, deux pour l'espace et la recherche).

**Le secteur choisi détermine le texte des règles applicables.** Les arrêtés ne sont pas rédigés
à l'identique : comparés au texte authentique du *Journal officiel*, **16 règles sur 20** diffèrent
entre la plupart des secteurs, et les écarts portent sur le fond.

| Règle | « Finances » | « Activités civiles de l'État » et « Transport aérien » |
|---|---|---|
| **2 — homologation** | audit d'architecture, de configuration, organisationnel et physique **et tests de vulnérabilité et d'intrusion** | les trois premiers seulement |
| **2 — validité** | « valable pour une durée maximale de trois ans » | « réexaminée au moins tous les trois ans » |
| **7 — détection** | sondes choisies sur la liste de l'article R. 1332-41-9 ; **exemption** pour les SI de sécurité physique et de gestion technique de bâtiment | ces dispositions sont absentes |
| **3 — cartographie** | « doit être **en mesure de fournir** à l'ANSSI » | « **élabore et tient à jour** » |

Les arrêtés les plus récents convergent : « Veille et alerte sanitaires » (2023) ne diffère plus
que sur 3 règles de « Activités civiles de l'État » (2019), « Recherche publique » (2020) sur 5.

### Quatre sous-secteurs sans annexe publiée

**Activités militaires de l'État**, **Activités judiciaires**, **Activités industrielles de
l'armement** et **Espace** : leur arrêté ne comporte au *Journal officiel* que ses quatre
chapitres. L'article 1er renvoie bien à « l'annexe I du présent arrêté », mais celle-ci n'est pas
publiée — vérifié sur le XML du JO, où tous les autres articles de ces textes sont présents.

L'outil le dit explicitement pour ces secteurs et laisse l'énoncé à saisir. **Il n'affiche jamais
le texte d'un autre secteur à la place.**

Restent également non publiées, pour tous les secteurs, les **annexes II (délais d'application),
III (types de systèmes) et IV (types d'incidents)**, notifiées par le directeur général de l'ANSSI
aux personnes ayant besoin d'en connaître.

## Énoncés officiels

Pour les règles LPM des 18 secteurs intégrés, l'énoncé officiel est **embarqué et affiché tel quel**,
avec sa référence — il n'est pas modifiable dans l'outil.

Partout ailleurs — RGS, et LPM pour les secteurs non encore intégrés — chaque exigence dispose
d'un champ **énoncé officiel** que vous renseignez depuis votre exemplaire du référentiel. Le RGS
n'a pas pu être récupéré : ni Légifrance ni l'ANSSI n'en exposent de fichier accessible à un
client non interactif.

## Marquage

Outre les mentions réglementaires **Diffusion Restreinte**, **Secret** et **Très Secret** — rendues
selon les modèles de l'annexe 37 de l'IGI 1300 : Arial gras 18, cadre de 2,5 points, encre rouge,
mention Spécial France en bleu — l'outil accepte un **marquage libre**.

Le libellé saisi est alors rendu **en capitales grasses rouges dans un cadre rouge**, au milieu du
haut de chaque page et sur toutes les éditions. N'étant pas une mention réglementaire, il n'est
apposé qu'en haut de page et ne porte pas l'avertissement pénal réservé aux niveaux classifiés.

## Organisation du dépôt

| Chemin | Contenu |
|---|---|
| `audit-passi.html` | L'outil, fichier unique et autonome, 809 Ko dont 626 Ko de texte officiel. |
| `source/` | Feuille de styles, balisage et six modules de code commentés. |
| `outils/` | Données des deux référentiels, extraction des arrêtés depuis les données ouvertes du JORF, assemblage de la page. |
| `tests/` | 61 assertions exécutées dans un navigateur réel, réseau coupé. |

```bash
python3 outils/construire_donnees.py && python3 outils/assembler.py
./tests/executer.sh
```

Le moteur est celui de l'outil d'audit II 901 / IGI 1300 / IM 900 : les deux projets pourront
partager une base commune si vous souhaitez les faire converger.

## Limites

Aide à la conduite d'audit. Ne se substitue ni aux textes officiels, ni à l'appréciation de
l'auditeur, ni à la décision d'homologation. Les points de contrôle RGS et les énoncés de contrôle
LPM sont des rédactions de travail ; en cas de divergence, le texte officiel prévaut.
