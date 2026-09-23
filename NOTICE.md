# Origine et statut des textes reproduits

> Le code et les énoncés de contrôle de ce dépôt sont sous Licence Ouverte 2.0 (voir
> `LICENCE`). Le présent document décrit le statut, distinct, des textes officiels
> incorporés à l'outil.

L'outil incorpore le texte de trois instructions publiques de l'État français.

| Texte | Acte | Source utilisée |
|---|---|---|
| II 901 | Instruction interministérielle n° 901/SGDSN/ANSSI du 28 janvier 2015 (NOR PRMD1503279J) | Légifrance, `circulaire/id/39217` |
| IGI 1300 | Instruction générale interministérielle n° 1300/SGDSN/PSE/PSD, annexée à l'arrêté du 9 août 2021 | PDF publié par le ministère des Armées |
| IM 900 | Instruction ministérielle n° 900/ARM/CAB du 27 août 2025, annexée à l'arrêté du 27 août 2025 | *Journal officiel* du 1er octobre 2025, texte 17 |
| Listing des exigences SSI de l'IGI 1300 | Document de travail publié par l'ANSSI, portant la mention NP (non protégé) | `ANSSI-NP-IGI1300-listing_des_exigences-v0.4.xlsx`, cyber.gouv.fr |

Ces documents sont des actes officiels, publiés et librement consultables. Leur reproduction
n'emporte aucune appropriation : ils demeurent l'œuvre et la responsabilité des autorités qui les
ont émis.

## Ce texte n'est pas la version faisant foi

Le texte intégré est le produit d'une extraction automatique des PDF officiels (voir
`outils/`). Il a été nettoyé des en-têtes, pieds de page et appels de notes, et les paragraphes
ont été recollés. **En cas de doute ou de divergence, seul le document publié par l'autorité
émettrice fait foi.**

Deux réserves particulières :

* **II 901** — le seul exemplaire publié est un document numérisé. Le texte intégré est une
  transcription issue d'une reconnaissance optique de caractères, corrigée des confusions de
  caractères systématiques. Les codes de règles et les valeurs chiffrées sont à vérifier sur
  l'original. L'outil affiche cet avertissement sur chaque exigence rattachée à ce texte.
* **Listing ANSSI** — les 204 exigences IGI 1300 et leurs identifiants sont repris du classeur
  publié par l'ANSSI, sans modification des énoncés. Ce classeur ne couvre que le volet
  « systèmes d'information » de l'instruction.
* **IGI 1300** — les annexes sont publiées séparément et ne sont pas reprises, notamment
  l'annexe 1 (mesures applicables à la mention Diffusion Restreinte) et l'annexe 37 (modèles de
  timbres). L'outil le signale à l'endroit où elles manquent.

Aucun passage n'a été reformulé, complété ni reconstitué : ce qui n'est pas publié est signalé
comme manquant.

## Mise à jour

Ces instructions évoluent. Pour régénérer l'outil à partir d'une version plus récente, déposez
les nouveaux PDF dans `outils/refs/` et relancez `outils/pipeline.sh`. Les métadonnées de chaque
référentiel (intitulé de l'acte, date, niveaux couverts) sont regroupées dans la table
`METADONNEES` de `outils/construire_donnees.py`.
