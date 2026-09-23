
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
    /* Cocher un référentiel présélectionne les niveaux qu'il couvre. */
    if(evenement.target.name === "ref" && evenement.target.checked){
      const ref = Catalogue.referentiel(evenement.target.value);
      for(const n of (ref && ref.niveaux) || []){
        const case_ = $(`input[name=niv][value="${n}"]`);
        if(case_) case_.checked = true;
      }
    }
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

  /* --- Textes officiels ------------------------------------------------ */
  $("#choix-corpus").addEventListener("change", e => {
    EcranTextes.corpusCourant = e.target.value;
    EcranTextes.sectionCourante = null;
    EcranTextes.rendre();
  });
  let minuteurCorpus;
  $("#recherche-corpus").addEventListener("input", () => {
    clearTimeout(minuteurCorpus);
    minuteurCorpus = setTimeout(() => EcranTextes.rendreSommaire(), 200);
  });
  $("#corpus-sommaire").addEventListener("click", evenement => {
    const bouton = evenement.target.closest("button[data-cle]");
    if(bouton) EcranTextes.afficherSection(bouton.dataset.cle);
  });

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
  if(await FichierLie.lier(nomFichier("audit-ssi", "json"), Audit.etat.id)){
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
  const stats = Corpus.statistiques()
    .map(s => `<li><b>${ech(s.code)}</b> — ${s.sections} sections, environ ${Math.round(s.caracteres / 1000)} 000 caractères</li>`)
    .join("");
  $("#dlg-aide-corps").innerHTML = `
    <h3>Principe</h3>
    <p>Fichier HTML unique, sans réseau ni dépendance externe. Toutes les données restent dans le
    navigateur qui l'ouvre.</p>

    <h3>Provenance des exigences</h3>
    <p>La plupart des exigences sont reprises telles quelles d'une source officielle et portent
    son identifiant : les articles et les règles codées de l'annexe 1 pour l'II 901
    (<code>ORG-RSSI</code>…), le listing des exigences SSI publié par l'ANSSI pour l'IGI 1300
    (<code>HOMOL_01</code>…). Leur énoncé officiel est affiché en tête du panneau.</p>
    <p>Les autres sont des points de contrôle rédigés pour cet outil, signalés par la mention
    <i>reformulation</i> : les exigences IM 900, pour lesquelles aucune source d'exigences
    officielle n'existe, et les domaines de l'IGI 1300 que le listing ANSSI ne couvre pas
    (habilitation, locaux, contrats, supports papier).</p>

    <h3>Textes officiels</h3>
    <p>Le texte des trois instructions est intégré :</p><ul>${stats}</ul>
    <p>Chaque point de contrôle affiche les sections dont il découle ; l'onglet <i>Textes</i> permet
    de parcourir et de rechercher dans l'intégralité des trois documents. Les parties non publiées
    (annexes diffusées séparément, documents protégés) sont signalées à l'endroit où elles manquent
    plutôt que reconstituées.</p>

    <h3>Conservation de la progression</h3>
    <ul>
      <li><b>Stockage du navigateur</b> : automatique, propre à ce navigateur, cette machine et cet
        emplacement de fichier.</li>
      <li><b>Fichier lié</b> : sur les navigateurs qui le permettent, chaque modification est écrite
        dans un fichier <code>.json</code> de votre choix, y compris sur clé amovible.</li>
      <li><b>Export .json</b> : sauvegarde complète et transférable, à faire régulièrement.</li>
    </ul>

    <h3>Raccourcis</h3>
    <ul><li><kbd>1</kbd> non conforme · <kbd>2</kbd> partiellement conforme ·
      <kbd>3</kbd> conforme · <kbd>0</kbd> non applicable</li>
      <li><kbd>Alt</kbd>+<kbd>↓</kbd> / <kbd>↑</kbd> : exigence suivante / précédente</li>
      <li><kbd>Ctrl</kbd>+<kbd>S</kbd> : exporter l'audit en .json</li></ul>

    <h3>Marquage</h3>
    <p>Le timbre est apposé en capitales et en toutes lettres, à l'encre rouge, au milieu du haut de
    chaque page, et au bas de chaque page pour les niveaux Secret et Très Secret ; la mention
    Spécial France est apposée en bleu immédiatement à droite. Il est reporté sur le rapport HTML,
    les exports CSV et les impressions. La numérotation « page X sur Y » doit être obtenue par
    l'option d'en-tête et pied de page de la boîte d'impression du navigateur.</p>
    <p>Il vous appartient de protéger, transporter et détruire les fichiers produits conformément à
    ce marquage.</p>

    <h3>Limites</h3>
    <p>Cet outil est une aide à la conduite d'audit. Il ne se substitue ni aux textes officiels, ni à
    l'appréciation de l'auditeur, ni à la décision de l'autorité d'homologation.</p>`;
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
