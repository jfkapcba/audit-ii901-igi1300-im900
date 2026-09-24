
/* ===========================================================================
   19. ÉVÉNEMENTS
   =========================================================================== */
function brancherEvenements(){

  /* --- Barre d'application ------------------------------------------- */
  $$("#onglets button").forEach(b => b.addEventListener("click", () => montrerEcran(b.dataset.vue)));
  $("#btn-accueil").addEventListener("click", () => montrerEcran("accueil"));
  $("#btn-theme").addEventListener("click", () => {
    const theme = document.documentElement.dataset.theme === "sombre" ? "clair" : "sombre";
    document.documentElement.dataset.theme = theme;
    Stockage.ecrireJSON(CLE_PREFS, {theme});
  });
  $("#btn-aide").addEventListener("click", ouvrirAide);
  $("#dlg-aide-fermer").addEventListener("click", () => $("#dlg-aide").close());
  $("#dlg-aide-fermer-2").addEventListener("click", () => $("#dlg-aide").close());

  /* --- Accueil -------------------------------------------------------- */
  $("#btn-nouvel-audit").addEventListener("click", () => { EcranInit.rendre(); montrerEcran("init"); });
  $("#btn-importer-accueil").addEventListener("click", () => Fichiers.demander("audit"));
  $("#fichier-import").addEventListener("change", e => Fichiers.traiter(e));
  $("#liste-audits").addEventListener("click", evenement => {
    const bouton = evenement.target.closest("button[data-act]");
    if(!bouton) return;
    const id = bouton.closest("li").dataset.id;
    ({ouvrir: chargerAudit, supprimer: supprimerAudit, dupliquer: dupliquerAudit})[bouton.dataset.act](id);
  });
  $("#btn-purger").addEventListener("click", () => {
    if(!confirm("Effacer TOUTES les données de cet outil dans ce navigateur : audits enregistrés et " +
      "exigences complémentaires ?\n\nCette action est irréversible.")) return;
    for(const a of Stockage.lireJSON(CLE_INDEX, [])) Stockage.supprimer(cleAudit(a.id));
    Stockage.supprimer(CLE_INDEX);
    Stockage.supprimer(CLE_PERSO);
    Audit.etat = null; EcranAudit.selection = null;
    notifier("Données locales effacées.");
    montrerEcran("accueil");
  });

  /* --- Initialisation -------------------------------------------------- */
  $("#form-init").addEventListener("submit", e => EcranInit.creer(e));
  $("#btn-annuler-init").addEventListener("click", () => montrerEcran("accueil"));
  $("#vue-init").addEventListener("change", evenement => {
    EcranInit.majApercu();
  });

  /* --- Plan de contrôle ------------------------------------------------ */
  $("#arbre").addEventListener("click", evenement => {
    const domaine = evenement.target.closest(".arbre-dom");
    if(domaine){
      const cle = domaine.dataset.dom;
      if(EcranAudit.domainesReplies.has(cle)) EcranAudit.domainesReplies.delete(cle);
      else EcranAudit.domainesReplies.add(cle);
      EcranAudit.rendreArbre();
      return;
    }
    const exigence = evenement.target.closest(".arbre-ex");
    if(exigence){ EcranAudit.rendreExigence(exigence.dataset.id); EcranAudit.rendreArbre(); }
  });
  let minuteurRecherche;
  $("#filtre-recherche").addEventListener("input", () => {
    clearTimeout(minuteurRecherche);
    minuteurRecherche = setTimeout(() => EcranAudit.rendreArbre(), 180);
  });
  $("#filtre-statut").addEventListener("change", () => EcranAudit.rendreArbre());
  $("#filtre-referentiel").addEventListener("change", () => EcranAudit.rendreArbre());

  /* --- Dossier --------------------------------------------------------- */
  $("#btn-exp-json").addEventListener("click", Exports.auditJSON);
  $("#btn-imp-json").addEventListener("click", () => Fichiers.demander("audit"));
  $("#btn-exp-rapport").addEventListener("click", Exports.rapportHTML);
  $("#btn-exp-csv").addEventListener("click", Exports.matriceCSV);
  $("#btn-exp-pa").addEventListener("click", Exports.planActionCSV);
  $("#btn-imprimer").addEventListener("click", () => {
    montrerEcran("synthese");
    setTimeout(() => window.print(), 250);
  });
  for(const selecteur of ["#btn-lier-fichier", "#btn-lier-fichier-2"])
    $(selecteur).addEventListener("click", lierFichier);
  $("#btn-delier-fichier").addEventListener("click", () => {
    FichierLie.delier();
    notifier("Fichier délié.");
    EcranDossier.rendre();
    Audit.afficherEtatEnregistrement("ok");
  });
  $("#btn-ajouter-exigence").addEventListener("click", ouvrirAjoutExigence);
  $("#liste-exigences-perso").addEventListener("click", evenement => {
    const bouton = evenement.target.closest('[data-act="supprimer-perso"]');
    if(!bouton) return;
    const id = bouton.closest("[data-perso]").dataset.perso;
    if(!confirm("Supprimer l'exigence " + id + " ?")) return;
    Catalogue.supprimerPerso(id);
    EcranDossier.rendre();
    EcranAudit.rendreArbre();
  });

  /* --- Raccourcis clavier ---------------------------------------------- */
  document.addEventListener("keydown", evenement => {
    const cible = evenement.target;
    const enSaisie = ["INPUT","TEXTAREA","SELECT"].includes(cible.tagName) || cible.isContentEditable;
    if((evenement.ctrlKey || evenement.metaKey) && evenement.key.toLowerCase() === "s" && Audit.etat){
      evenement.preventDefault(); Exports.auditJSON(); return;
    }
    if(ecranCourant !== "audit" || !EcranAudit.selection || enSaisie) return;
    if(evenement.altKey && evenement.key === "ArrowDown"){ evenement.preventDefault(); EcranAudit.naviguer(1); return; }
    if(evenement.altKey && evenement.key === "ArrowUp"){ evenement.preventDefault(); EcranAudit.naviguer(-1); return; }
    if(evenement.altKey || evenement.ctrlKey || evenement.metaKey) return;
    const raccourcis = {"1":"nc", "2":"pc", "3":"c", "0":"na"};
    const statut = raccourcis[evenement.key];
    if(statut){
      evenement.preventDefault();
      EcranAudit.definirStatut(EcranAudit.selection, statut);
      notifier(STATUTS[statut].libelle + " — " + EcranAudit.selection, 1400);
    }
  });

  /* Avertir si rien ne persiste : ni stockage local, ni fichier lié. */
  window.addEventListener("beforeunload", evenement => {
    if(Audit.etat && !Stockage.disponible && !FichierLie.actif){
      evenement.preventDefault(); evenement.returnValue = "";
    }
  });
}

async function lierFichier(){
  if(!Audit.etat){ notifier("Ouvrez ou créez d'abord un audit."); return; }
  if(await FichierLie.lier(nomFichier("audit-passi", "json"), Audit.etat.id)){
    await Audit.enregistrer();
    notifier("Audit lié au fichier : chaque modification y sera écrite.");
  }
  if(ecranCourant === "dossier") EcranDossier.rendre();
  if(ecranCourant === "accueil") EcranAccueil.rendre();
}

function ouvrirAjoutExigence(){
  const dialogue = $("#dlg-exigence");
  ["#dlg-ex-id","#dlg-ex-titre","#dlg-ex-dom","#dlg-ex-ctrl","#dlg-ex-src","#dlg-ex-txt"]
    .forEach(s => $(s).value = "");
  dialogue.returnValue = "";
  dialogue.showModal();
  dialogue.addEventListener("close", function gerer(){
    dialogue.removeEventListener("close", gerer);
    if(dialogue.returnValue !== "ok") return;
    const id = $("#dlg-ex-id").value.trim(), titre = $("#dlg-ex-titre").value.trim();
    if(!id || !titre){ notifier("Identifiant et intitulé sont obligatoires."); return; }
    if(Catalogue.exigence(id)){ notifier("Cet identifiant est déjà utilisé."); return; }
    Catalogue.ajouterPerso({
      id, t:titre, dom: $("#dlg-ex-dom").value.trim() || "Exigences complémentaires",
      ctrl: $("#dlg-ex-ctrl").value.trim(), src: $("#dlg-ex-src").value.trim(),
      texte: $("#dlg-ex-txt").value.trim(), pr: [], sec: [],
    });
    if(Audit.etat && !Audit.etat.meta.referentiels.includes("PERSO")){
      Audit.etat.meta.referentiels.push("PERSO");
      Audit.marquerModifie(); majContexte();
    }
    EcranDossier.rendre();
    EcranAudit.rendreArbre();
    notifier("Exigence " + id + " ajoutée au plan de contrôle.");
  });
}

function ouvrirAide(){
  const volumes = Catalogue.tous().map(r =>
    `<li><b>${ech(r.code)}</b> — ${ech(r.nom)} : ${
      r.domaines.reduce((n, d) => n + d.exigences.length, 0)} exigences</li>`).join("");
  $("#dlg-aide-corps").innerHTML = `
    <h3>Principe</h3>
    <p>Fichier HTML unique, sans réseau ni dépendance externe. Toutes les données restent dans le
    navigateur qui l'ouvre.</p>

    <h3>Référentiels</h3>
    <ul>${volumes}</ul>
    <p>Pour la LPM, les vingt règles de l'annexe I des arrêtés sectoriels sont <b>communes à tous
    les secteurs</b> : le secteur choisi identifie la mission et figure sur les éditions, il ne
    modifie pas le plan de contrôle. Les différences sectorielles figurent aux annexes II, III et
    IV des arrêtés, qui ne sont pas publiées.</p>

    <h3>Énoncés officiels</h3>
    <p>Aucun texte officiel n'est embarqué : ni le RGS ni les arrêtés sectoriels ne sont
    téléchargeables par un outil automatisé. Chaque exigence dispose d'un champ
    <i>énoncé officiel</i> que vous renseignez depuis votre exemplaire du référentiel ; il est
    conservé avec l'audit et repris dans les exports.</p>

    <h3>Marquage</h3>
    <p>Outre les mentions réglementaires (Diffusion Restreinte, Secret, Très Secret), un
    <b>marquage libre</b> est disponible : le libellé que vous saisissez est rendu en capitales
    grasses rouges dans un cadre rouge, en haut de chaque page et sur les éditions.</p>

    <h3>Raccourcis</h3>
    <ul><li><kbd>1</kbd> non conforme · <kbd>2</kbd> partiellement conforme ·
      <kbd>3</kbd> conforme · <kbd>0</kbd> non applicable</li>
      <li><kbd>Alt</kbd>+<kbd>↓</kbd> / <kbd>↑</kbd> : exigence suivante / précédente</li>
      <li><kbd>Ctrl</kbd>+<kbd>S</kbd> : exporter l'audit en .json</li></ul>

    <h3>Limites</h3>
    <p>Aide à la conduite d'audit. Ne se substitue ni aux textes officiels, ni à l'appréciation de
    l'auditeur, ni à la décision de l'autorité d'homologation.</p>`;
  $("#dlg-aide").showModal();
}

/* ===========================================================================
   20. DÉMARRAGE
   =========================================================================== */
(function demarrer(){
  const prefs = Stockage.lireJSON(CLE_PREFS, {});
  if(prefs.theme) document.documentElement.dataset.theme = prefs.theme;
  else if(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.dataset.theme = "sombre";

  brancherEvenements();
  appliquerMarquage();
  montrerEcran("accueil");

  if(!Stockage.disponible)
    notifier("Stockage local indisponible : liez un fichier ou exportez régulièrement en .json.", 7000);
})();
</script>
</body>
</html>
