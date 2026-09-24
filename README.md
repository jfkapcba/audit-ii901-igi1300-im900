# Outils d'audit de conformité

Deux outils d'audit, chacun en **un seul fichier HTML entièrement hors ligne**, avec le texte
officiel des référentiels intégré. Pas de serveur, pas d'installation, pas de réseau : ils
s'ouvrent depuis un disque local ou une clé amovible, sur un poste isolé si nécessaire.

**Essayer en ligne :** <https://jfkapcba.github.io/audit-ii901-igi1300-im900/>

| Outil | Référentiels | Exigences | Fichier |
|---|---|---|---|
| [**SSI**](audit-ssi/) | II 901, IGI 1300, IM 900 | 537, dont **401 officielles** | [`audit-ssi/audit-ssi.html`](audit-ssi/audit-ssi.html) — 1,8 Mo |
| [**PASSI**](audit-passi/) | RGS, LPM (règles SIIV) | 42, sur **22 secteurs** | [`audit-passi/audit-passi.html`](audit-passi/audit-passi.html) — 809 Ko |

## Ce qu'ils ont en commun

* **Hors ligne intégral** — aucune requête réseau, vérifié avec la résolution DNS coupée.
* **Textes officiels intégrés**, repris de leur source authentique, jamais reconstitués. Ce qui
  n'est pas publié est signalé comme manquant.
* **Provenance affichée** exigence par exigence : identifiant officiel, ou mention explicite
  lorsqu'un point de contrôle a été rédigé pour l'outil.
* **Marquage réglementaire** conforme aux modèles de l'annexe 37 de l'IGI 1300 — Arial gras 18,
  cadre de 2,5 points, encre rouge, mention Spécial France en bleu. L'outil PASSI accepte en outre
  un marquage libre.
* **Persistance** dans le navigateur, dans un fichier lié, ou par export `.json`.
* **Suites de vérification** exécutées dans un navigateur réel, réseau coupé : 99 assertions pour
  l'outil SSI, 61 pour l'outil PASSI.

## Deux constats que ces outils matérialisent

**Le listing ANSSI ne couvre que le volet SSI de l'IGI 1300.** Ses 204 exigences portent sur le
§ 1.4.2.4, le § 6, quelques points du § 7 et l'annexe 30. L'habilitation, les lieux, les contrats
et les supports papier restent couverts par des points de contrôle rédigés, signalés comme tels.

**Les arrêtés sectoriels LPM ne sont pas rédigés à l'identique.** Contrairement à ce que laissent
croire les présentations synthétiques de leur annexe I, **16 règles sur 20** diffèrent entre la
plupart des secteurs, et les écarts portent sur le fond — tests d'intrusion exigés ou non,
exemptions de détection, nature de l'obligation de cartographie. L'outil PASSI fait donc dépendre
le texte affiché du secteur retenu.

## Organisation

```
audit-ssi/      l'outil SSI : fichier livré, sources, chaîne de fabrication, tests
audit-passi/    l'outil PASSI, même organisation
index.html      page d'accueil du site
NOTICE.md       origine et statut des textes officiels reproduits
LICENCE         Licence Ouverte 2.0 (Etalab)
```

Chaque outil se reconstruit depuis ses sources et se vérifie indépendamment :

```bash
cd audit-ssi   && ./outils/pipeline.sh && ./tests/executer.sh
cd audit-passi && python3 outils/construire_donnees.py && python3 outils/assembler.py && ./tests/executer.sh
```

Les deux partagent le même moteur, recopié dans chaque projet. Une base commune reste à extraire
si les deux outils continuent d'évoluer ensemble.

## Licence

Code, énoncés de contrôle et documentation : **Licence Ouverte 2.0 (Etalab)** — voir `LICENCE`.
Le texte des instructions et arrêtés reproduit dans les outils n'est pas couvert par cette
licence : ce sont des actes officiels de l'État, dont l'origine et le statut sont décrits dans
`NOTICE.md`.
