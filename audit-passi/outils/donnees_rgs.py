# -*- coding: utf-8 -*-
"""Référentiel général de sécurité, version 2.0.

Source : arrêté du 13 juin 2014 portant approbation du référentiel général de
sécurité et précisant les modalités de mise en œuvre de la procédure de
validation des certificats électroniques (NOR PRMD1413745A), entré en vigueur
le 1er juillet 2014.

AVERTISSEMENT DE PROVENANCE — à la différence des règles LPM, dont les intitulés
sont officiels, les points de contrôle ci-dessous sont entièrement RÉDIGÉS pour
cet outil. Le corps du RGS et ses annexes n'ont pas pu être récupérés
automatiquement : ni l'ANSSI ni Légifrance n'en exposent de fichier accessible à
un client non interactif. Aucune numérotation de chapitre n'est donc citée, pour
ne pas donner à une reconstitution l'apparence d'une référence.

Chaque point de contrôle dispose d'un champ « énoncé officiel » vide, à
renseigner depuis un exemplaire du référentiel ; la référence précise se saisit
avec le texte.
"""

DOMAINES = {
    "APP": "Champ d'application et gouvernance",
    "HOM": "Démarche d'homologation de sécurité",
    "FON": "Fonctions de sécurité et niveaux",
    "QUA": "Produits, prestataires et certificats",
    "SUI": "Suivi et maintien en condition de sécurité",
}

# (identifiant, intitulé, domaine, énoncé de contrôle, éléments de preuve)
CONTROLES = [
 ("APP-01", "Qualité d'autorité administrative et périmètre assujetti", "APP",
  "Vérifier que l'entité auditée relève des autorités administratives soumises au référentiel et que le "
  "périmètre des systèmes concernés — téléservices et échanges par voie électronique avec les usagers ou "
  "entre autorités — est formellement délimité.",
  ["Note de périmètre", "Inventaire des téléservices", "Décision de l'autorité"]),
 ("APP-02", "Responsabilité de l'autorité administrative", "APP",
  "Vérifier que l'autorité administrative responsable du système est identifiée, qu'elle assume la décision "
  "d'homologation et qu'elle dispose des moyens de piloter la sécurité du système.",
  ["Acte de désignation", "Organigramme décisionnel", "Lettre de mission"]),
 ("APP-03", "Politique de sécurité et déclinaison interne", "APP",
  "Vérifier l'existence d'une politique de sécurité applicable au périmètre, approuvée, diffusée et déclinée "
  "en règles opérationnelles.",
  ["Politique de sécurité signée", "Preuve de diffusion", "Procédures d'application"]),
 ("APP-04", "Information des usagers sur le niveau de sécurité", "APP",
  "Vérifier que les usagers du téléservice sont informés des conditions de sécurité applicables et, le cas "
  "échéant, de l'existence de la décision d'homologation.",
  ["Mentions publiées sur le téléservice", "Conditions générales d'utilisation"]),

 ("HOM-01", "Homologation préalable à la mise en service", "HOM",
  "Vérifier qu'une décision d'homologation écrite a été prise par l'autorité administrative avant la mise en "
  "service du système, et qu'elle est toujours en vigueur.",
  ["Décision d'homologation datée et signée", "Date de mise en service effective"]),
 ("HOM-02", "Analyse de risques conduite et tracée", "HOM",
  "Vérifier qu'une analyse de risques a été conduite sur le périmètre, qu'elle identifie les besoins de "
  "sécurité, les scénarios de menace et les mesures retenues, et qu'elle est datée.",
  ["Étude de risques", "Échelles employées", "Parties prenantes associées"]),
 ("HOM-03", "Objectifs de sécurité formalisés", "HOM",
  "Vérifier que des objectifs de sécurité découlent de l'analyse de risques et qu'ils couvrent les besoins "
  "en disponibilité, intégrité, confidentialité et traçabilité identifiés.",
  ["Expression des objectifs de sécurité", "Traçabilité entre risques et objectifs"]),
 ("HOM-04", "Mesures de sécurité choisies et mises en œuvre", "HOM",
  "Vérifier que les mesures retenues répondent aux objectifs, qu'elles sont effectivement déployées et que "
  "les écarts sont documentés.",
  ["Plan de mesures", "Preuves de mise en œuvre", "Registre des écarts"]),
 ("HOM-05", "Dossier d'homologation complet", "HOM",
  "Vérifier que le dossier d'homologation réunit la description du système, l'analyse de risques, les "
  "objectifs, les mesures, les résultats des contrôles et les risques résiduels.",
  ["Dossier d'homologation", "Bordereau des pièces"]),
 ("HOM-06", "Risques résiduels acceptés par l'autorité", "HOM",
  "Vérifier que les risques résiduels sont explicitement présentés à l'autorité et acceptés par écrit, et "
  "que les réserves éventuelles font l'objet d'un suivi.",
  ["Tableau des risques résiduels", "Décision d'acceptation", "Suivi de levée des réserves"]),

 ("FON-01", "Identification et authentification électroniques", "FON",
  "Vérifier que les besoins d'identification et d'authentification des usagers et des agents sont définis, "
  "que le niveau retenu est justifié par l'analyse de risques et que les mécanismes déployés y répondent.",
  ["Justification du niveau retenu", "Mécanismes mis en œuvre", "Tests de conformité"]),
 ("FON-02", "Signature électronique", "FON",
  "Lorsque le téléservice met en œuvre une signature électronique, vérifier que le niveau retenu est justifié "
  "et que les moyens employés en respectent les exigences.",
  ["Analyse du besoin de signature", "Référence des moyens employés", "Procédure de vérification"]),
 ("FON-03", "Confidentialité des échanges", "FON",
  "Vérifier que les échanges nécessitant une protection en confidentialité sont chiffrés par des mécanismes "
  "conformes aux règles applicables, et que la gestion des clés est maîtrisée.",
  ["Configuration des protocoles", "Mécanismes cryptographiques employés", "Gestion des clés"]),
 ("FON-04", "Horodatage électronique", "FON",
  "Lorsque l'horodatage est requis, vérifier que le service employé répond au niveau attendu et que les "
  "jetons produits sont vérifiables.",
  ["Description du service d'horodatage", "Procédure de vérification des jetons"]),
 ("FON-05", "Cohérence entre niveaux visés et mesures déployées", "FON",
  "Vérifier, fonction par fonction, que le niveau de sécurité visé est cohérent avec les mesures réellement "
  "déployées, et relever les écarts non justifiés.",
  ["Tableau de correspondance niveaux / mesures", "Constats techniques"]),

 ("QUA-01", "Recours à des produits de sécurité qualifiés", "QUA",
  "Vérifier que les produits de sécurité employés pour les fonctions de sécurité du système font l'objet "
  "d'une qualification adaptée, et que la version déployée correspond à celle visée.",
  ["Inventaire des produits et de leur statut", "Versions déployées", "Conditions d'emploi"]),
 ("QUA-02", "Recours à des prestataires de services de confiance qualifiés", "QUA",
  "Vérifier que les services de confiance utilisés sont fournis par des prestataires qualifiés au niveau "
  "requis et que les contrats le stipulent.",
  ["Attestations de qualification", "Contrats et clauses de sécurité"]),
 ("QUA-03", "Validation des certificats électroniques", "QUA",
  "Vérifier que le système valide les certificats électroniques qu'il accepte, selon la procédure applicable, "
  "et que les états de révocation sont contrôlés.",
  ["Configuration de la validation", "Traces de contrôle de révocation", "Journaux"]),
 ("QUA-04", "Prestataire d'audit qualifié", "QUA",
  "Vérifier que les audits conduits à l'appui de l'homologation sont réalisés par un prestataire qualifié "
  "pour les activités concernées, et que sa portée de qualification les couvre.",
  ["Attestation de qualification du prestataire", "Portée de qualification", "Rapports d'audit"]),

 ("SUI-01", "Durée de validité et renouvellement de l'homologation", "SUI",
  "Vérifier que la décision d'homologation fixe une durée de validité, et que son renouvellement est engagé "
  "avant échéance.",
  ["Décision mentionnant la durée", "Calendrier de renouvellement"]),
 ("SUI-02", "Réexamen en cas d'évolution", "SUI",
  "Vérifier que toute évolution significative du système, de son environnement ou de la menace donne lieu à "
  "un réexamen de l'homologation.",
  ["Procédure de gestion des changements", "Exemples d'évolutions et suites données"]),
 ("SUI-03", "Maintien en condition de sécurité et contrôles périodiques", "SUI",
  "Vérifier que le système fait l'objet d'un maintien en condition de sécurité et de contrôles périodiques "
  "dont les constats alimentent un plan d'action suivi.",
  ["Procédure de MCS", "Rapports de contrôle", "Plan d'action et preuves de clôture"]),
]
