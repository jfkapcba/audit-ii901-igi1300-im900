# -*- coding: utf-8 -*-
"""Règles de sécurité des systèmes d'information d'importance vitale (LPM).

Source : annexe I des arrêtés sectoriels pris en application des articles
R. 1332-41-1, R. 1332-41-2 et R. 1332-41-10 du code de la défense.

Ce qui est officiel ici : la numérotation et l'INTITULÉ des vingt règles, ainsi
que la liste des secteurs. Le texte de chaque règle n'a pas pu être récupéré
automatiquement (Légifrance bloque l'accès automatisé) : le champ « énoncé
officiel » est donc vide et se renseigne depuis un exemplaire de l'arrêté, comme
pour tout autre référentiel de l'outil.

Le regroupement en domaines est éditorial : l'annexe I énumère les vingt règles
à la suite, sans les regrouper. Les cinq thèmes retenus reprennent ceux que
l'ANSSI emploie pour les présenter.

Les différences sectorielles ne figurent pas ici : les annexes II (délais
d'application), III (types de systèmes) et IV (types d'incidents) des arrêtés ne
sont pas publiées et sont notifiées par l'ANSSI aux personnes ayant besoin d'en
connaître. Les vingt règles de l'annexe I sont, elles, communes à tous les
secteurs.
"""

import re, unicodedata

def identifiant(nom):
    """Clé stable et lisible pour un secteur : « Gestion de l'eau » -> gestion-de-l-eau."""
    sans_accent = "".join(c for c in unicodedata.normalize("NFD", nom)
                          if unicodedata.category(c) != "Mn")
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", sans_accent.lower())).strip("-")

# Les douze secteurs d'activités d'importance vitale et leur ministre
# coordonnateur, repris de l'annexe à l'arrêté du 2 juin 2006 (NOR PRMX0609332A),
# modifié par l'arrêté du 3 juillet 2008 pour le secteur Énergie.
SECTEURS = [
    ("civiles",      "Activités civiles de l'État",                        "Ministre de l'intérieur"),
    ("judiciaires",  "Activités judiciaires",                              "Ministre de la justice"),
    ("militaires",   "Activités militaires de l'État",                     "Ministre de la défense"),
    ("alimentation", "Alimentation",                                       "Ministre chargé de l'agriculture"),
    ("communication","Communications électroniques, audiovisuel et information",
                                                                           "Ministre chargé des communications électroniques"),
    ("energie",      "Énergie",                                            "Ministre chargé de l'énergie"),
    ("espace",       "Espace et recherche",                                "Ministre chargé de la recherche"),
    ("finances",     "Finances",                                           "Ministre chargé de l'économie et des finances"),
    ("eau",          "Gestion de l'eau",                                   "Ministre chargé de l'écologie"),
    ("industrie",    "Industrie",                                          "Ministre chargé de l'industrie"),
    ("sante",        "Santé",                                              "Ministre chargé de la santé"),
    ("transports",   "Transports",                                         "Ministre chargé des transports"),
]

# (numéro, intitulé officiel de la règle, domaine, énoncé de contrôle, éléments de preuve)
REGLES = [
 (1, "Politique de sécurité des systèmes d'information", "GOU",
  "Vérifier que l'opérateur dispose d'une politique de sécurité des systèmes d'information couvrant ses "
  "systèmes d'information d'importance vitale, approuvée par une autorité compétente, diffusée, et revue "
  "périodiquement.",
  ["PSSI signée et datée", "Preuve de diffusion aux personnels concernés", "Comptes rendus de revue"]),
 (2, "Homologation de sécurité", "GOU",
  "Vérifier que chaque système d'information d'importance vitale fait l'objet d'une décision d'homologation "
  "en vigueur, prise par l'opérateur, reposant sur un dossier d'homologation comportant notamment une analyse "
  "de risques et les résultats d'audits, et que les risques résiduels sont formellement acceptés.",
  ["Décisions d'homologation datées et signées", "Dossiers d'homologation", "Rapports d'audit",
   "Acceptation écrite des risques résiduels"]),
 (3, "Cartographie", "RSQ",
  "Vérifier que l'opérateur établit et tient à jour la cartographie de chaque système d'information "
  "d'importance vitale : composants, interconnexions, flux, localisation et comptes d'administration.",
  ["Cartographie datée", "Inventaire des composants", "Schéma des interconnexions et des flux"]),
 (4, "Maintien en conditions de sécurité", "RSQ",
  "Vérifier l'existence d'une procédure de maintien en conditions de sécurité : veille sur les vulnérabilités, "
  "qualification et déploiement des correctifs selon des délais définis, traitement des composants non "
  "maintenus par leur éditeur.",
  ["Procédure de gestion des correctifs", "État des versions déployées", "Inventaire des obsolescences"]),
 (5, "Journalisation", "INC",
  "Vérifier que les événements de sécurité sont journalisés sur l'ensemble des composants du système, que les "
  "journaux sont horodatés à partir d'une source de temps commune et conservés pendant la durée requise.",
  ["Politique de journalisation", "Périmètre des composants journalisés", "Durée de conservation constatée"]),
 (6, "Corrélation et analyse de journaux", "INC",
  "Vérifier que les journaux sont centralisés sur un système dédié qui les corrèle et les analyse afin de "
  "détecter les événements susceptibles d'affecter la sécurité, et que ce système est lui-même protégé.",
  ["Architecture de collecte", "Règles de corrélation", "Droits d'accès au collecteur"]),
 (7, "Détection", "INC",
  "Vérifier que le système est doté de moyens de détection des événements susceptibles d'affecter la sécurité "
  "des systèmes d'information d'importance vitale, mis en œuvre conformément aux exigences applicables.",
  ["Description des dispositifs de détection", "Qualification des produits employés", "Couverture du périmètre"]),
 (8, "Traitement des incidents de sécurité", "INC",
  "Vérifier l'existence d'une procédure de traitement des incidents de sécurité et son application effective : "
  "qualification, analyse, mesures correctives, et déclaration à l'ANSSI dans les conditions prévues.",
  ["Procédure de traitement", "Registre des incidents", "Preuves de déclaration à l'ANSSI"]),
 (9, "Traitement des alertes", "INC",
  "Vérifier que l'opérateur est en mesure de recevoir les alertes émises par l'ANSSI à tout moment, de les "
  "traiter et de mettre en œuvre les mesures qu'elles prescrivent dans les délais requis.",
  ["Points de contact déclarés et joignables", "Registre des alertes reçues", "Suites données"]),
 (10, "Gestion de crises", "INC",
  "Vérifier que l'opérateur dispose d'une organisation et de moyens de gestion de crise d'origine "
  "informatique, que ces moyens fonctionnent en mode dégradé, et qu'ils font l'objet d'exercices.",
  ["Dispositif de gestion de crise", "Moyens de communication de secours", "Comptes rendus d'exercice"]),
 (11, "Identification", "IAM",
  "Vérifier que chaque utilisateur et chaque composant accédant au système est identifié de manière unique, "
  "et que les comptes sont gérés tout au long de leur cycle de vie.",
  ["Extraction des comptes", "Procédure de création et de suppression", "Rapprochement avec les effectifs"]),
 (12, "Authentification", "IAM",
  "Vérifier que l'accès au système repose sur une authentification dont la robustesse est adaptée aux enjeux, "
  "que les éléments secrets sont protégés, et que les éléments d'authentification par défaut sont modifiés.",
  ["Politique d'authentification appliquée", "Configuration technique", "Contrôle des secrets par défaut"]),
 (13, "Droits d'accès", "IAM",
  "Vérifier que les droits d'accès sont attribués selon le besoin d'en connaître et le moindre privilège, "
  "qu'ils sont revus périodiquement et retirés sans délai lorsqu'ils ne sont plus justifiés.",
  ["Matrice des droits", "Comptes rendus de revue", "Preuves de retrait après départ ou mutation"]),
 (14, "Comptes d'administration", "IAM",
  "Vérifier que les comptes d'administration sont nominatifs, distincts des comptes d'usage courant, limités "
  "au strict nécessaire, et que leurs actions sont tracées.",
  ["Liste nominative des administrateurs", "Justification de chaque compte", "Journaux d'administration"]),
 (15, "Systèmes d'information d'administration", "IAM",
  "Vérifier que l'administration s'effectue depuis des systèmes dédiés à cet usage, durcis, cloisonnés des "
  "autres systèmes et ne donnant accès ni à la messagerie ni à la navigation sur Internet.",
  ["Architecture d'administration", "Inventaire des postes d'administration", "Configuration réseau"]),
 (16, "Cloisonnement", "PRO",
  "Vérifier que les systèmes d'information d'importance vitale sont cloisonnés des autres systèmes de "
  "l'opérateur et, en interne, segmentés de façon à limiter la propagation d'une compromission.",
  ["Schéma d'architecture", "Configuration des équipements de cloisonnement", "Tests de cloisonnement"]),
 (17, "Filtrage", "PRO",
  "Vérifier que les flux entrants et sortants sont filtrés par des dispositifs dédiés selon une matrice de "
  "flux formalisée, avec une politique de refus par défaut et des règles justifiées et revues.",
  ["Matrice de flux validée", "Règles de filtrage exportées", "Compte rendu de revue des règles"]),
 (18, "Accès à distance", "PRO",
  "Vérifier que les accès à distance aux systèmes d'information d'importance vitale sont autorisés, tracés, "
  "protégés par un moyen de chiffrement et soumis à une authentification renforcée.",
  ["Inventaire des accès distants", "Configuration de la passerelle", "Journaux de connexion"]),
 (19, "Installation de services et d'équipements", "RSQ",
  "Vérifier que l'installation de services et d'équipements sur le système est encadrée : origine maîtrisée, "
  "contrôle d'intégrité avant mise en service, et limitation aux besoins opérationnels.",
  ["Procédure d'introduction de matériels et de logiciels", "Traces de contrôle d'intégrité",
   "Inventaire des services actifs"]),
 (20, "Indicateurs", "GOU",
  "Vérifier que l'opérateur évalue pour chaque système les indicateurs prévus, documente sa méthode "
  "d'évaluation, explique les variations significatives et les communique annuellement à l'ANSSI.",
  ["Indicateurs calculés et datés", "Méthode d'évaluation documentée", "Preuve de communication annuelle"]),
]

DOMAINES = {
    "GOU": "Gouvernance de la sécurité",
    "RSQ": "Maîtrise des risques et des systèmes",
    "INC": "Détection et gestion des incidents",
    "IAM": "Contrôle d'accès et administration",
    "PRO": "Protection et cloisonnement",
}
