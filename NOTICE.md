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
| Arrêtés sectoriels LPM | 23 arrêtés fixant les règles de sécurité des systèmes d'information d'importance vitale, pris en application des articles R. 1332-41-1 et suivants du code de la défense | Données ouvertes de la DILA, archive `Freemium_jorf_global` de <https://echanges.dila.gouv.fr/OPENDATA/JORF/> |
| RGS v2.0 | Arrêté du 13 juin 2014 portant approbation du référentiel général de sécurité | **Non reproduit** : aucune source accessible à un client non interactif |

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
* **IGI 1300** — les 46 annexes figurent dans le même PDF que le corps de l'instruction et sont
  intégrées, y compris l'annexe 1 (règles applicables à la mention Diffusion Restreinte),
  l'annexe 30 (protection physique) et l'annexe 37 (modèles de timbres). Les annexes qui sont des
  formulaires ou des tableaux s'extraient moins bien que le texte courant. L'outil le signale à l'endroit où elles manquent.

Aucun passage n'a été reformulé, complété ni reconstitué : ce qui n'est pas publié est signalé
comme manquant.

## Ce qui n'est pas reproduit, et pourquoi

* **RGS v2.0** — ni Légifrance ni l'ANSSI n'exposent de fichier accessible à un outil automatisé.
  Les 22 points de contrôle RGS de l'outil PASSI sont donc **rédigés pour ce projet**, sans citer
  de numérotation de chapitre, et signalés comme tels. L'énoncé officiel se saisit dans l'outil.
* **Annexe I de quatre arrêtés sectoriels** — « Activités militaires de l'État », « Activités
  judiciaires », « Activités industrielles de l'armement » et « Espace » ne publient au *Journal
  officiel* que les quatre chapitres de leur arrêté. Leur article 1er renvoie pourtant à
  « l'annexe I du présent arrêté ». Vérifié sur le XML du JO, où tous les autres articles de ces
  textes sont présents.
* **Annexes II, III et IV des arrêtés sectoriels** — délais d'application, types de systèmes et
  types d'incidents. Les arrêtés précisent qu'elles sont notifiées par le directeur général de
  l'ANSSI aux personnes ayant besoin d'en connaître.
* **Référentiel PASSI pour les besoins de la sécurité nationale** — document Diffusion Restreinte,
  obtenu auprès de l'ANSSI.

## Mise à jour

Ces instructions évoluent. Pour régénérer l'outil à partir d'une version plus récente, déposez
les nouveaux PDF dans `outils/refs/` et relancez `outils/pipeline.sh`. Les métadonnées de chaque
référentiel (intitulé de l'acte, date, niveaux couverts) sont regroupées dans la table
`METADONNEES` de `outils/construire_donnees.py`.
