
/* ===========================================================================
   17. EXPORTS
   =========================================================================== */
const Exports = {
  /** Échappe une valeur pour un CSV à séparateur point-virgule. */
  csv(valeur){
    return '"' + String(valeur == null ? "" : valeur).replace(/"/g, '""').replace(/\r?\n/g, " ") + '"';
  },

  /** Assemble un CSV avec le timbre en première ligne et un BOM pour Excel. */
  assemblerCSV(lignes){
    const entete = [[libelleMarquage()]];
    return "﻿" + entete.concat(lignes)
      .map(l => l.map(Exports.csv).join(";")).join("\r\n");
  },

  matriceCSV(){
    const lignes = [["Référentiel","Domaine","Identifiant","Exigence","Niveaux","Source",
                     "Sections officielles","Énoncé officiel","Point de contrôle","Provenance",
                     "Statut","Criticité","Constat",
                     "Commentaire","Recommandation","Responsable","Échéance","Preuves","Dernière modification"]];
    for(const x of Audit.planDeControle()){
      const r = Audit.etat.reponses[x.ex.id] || {};
      lignes.push([
        x.ref.code, x.dom.nom, x.ex.id, x.ex.t, (x.ex.n || x.ref.niveaux || []).join("/"),
        x.ex.src || "", (x.ex.sec || []).join(" ; "), x.ex.enonce || "", x.ex.ctrl || "",
        x.ex.redige ? "point de contrôle rédigé" : "source officielle",
        STATUTS[r.s || "ne"].libelle, CRITICITES[r.crit || ""].libelle,
        r.constat || "", r.com || "", r.reco || "", r.resp || "", r.ech || "", r.preuves || "",
        r.maj ? horodatageFr(r.maj) : "",
      ]);
    }
    telecharger(nomFichier("matrice-conformite", "csv"), Exports.assemblerCSV(lignes), "text/csv");
    notifier("Matrice de conformité exportée.");
  },

  planActionCSV(){
    const lignes = [["Identifiant","Référentiel","Exigence","Statut","Criticité","Constat",
                     "Action recommandée","Responsable","Échéance"]];
    for(const x of EcranSynthese.ecarts(Audit.planDeControle())){
      const r = Audit.etat.reponses[x.ex.id];
      lignes.push([x.ex.id, x.ref.code, x.ex.t, STATUTS[r.s].libelle,
                   CRITICITES[r.crit || ""].libelle, r.constat || "", r.reco || "",
                   r.resp || "", r.ech || ""]);
    }
    telecharger(nomFichier("plan-action", "csv"), Exports.assemblerCSV(lignes), "text/csv");
    notifier("Plan d'action exporté.");
  },

  auditJSON(){
    telecharger(nomFichier("audit-ssi", "json"), JSON.stringify(Audit.paquet(), null, 2));
    notifier("Audit exporté. Conservez ce fichier selon son marquage.");
  },

  /* ---------------------------------------------------------------------
     Rapport HTML autonome.
     Le marquage y est reproduit selon les mêmes règles qu'à l'écran :
     timbre rouge en haut (et en bas si classifié) de chaque page, timbre de
     dimension supérieure au bas de la couverture (IGI 1300 § 7.1.2.3 a),
     mention Spécial France en bleu, et mentions d'identification exigées par
     l'IGI 1300 § 7.1.2.3 b) sur la première page.
     --------------------------------------------------------------------- */
  rapportHTML(){
    const meta = Audit.etat.meta;
    const regle = MARQUAGES[meta.marquage] || MARQUAGES.NP;
    const plan = Audit.planDeControle();
    const st = Audit.statistiques(plan);
    const ecarts = EcranSynthese.ecarts(plan);
    const timbre = regle.libelle.toUpperCase();

    /* Timbres conformes à l'annexe 37 de l'IGI 1300 : Arial gras 18, cadre de
       2,5 points sur les pages et de 3 points sur la couverture, encre rouge
       sauf Spécial France en bleu. */
    const styles = `
      body{font:12pt/1.55 Georgia,"Times New Roman",serif;margin:0;color:#111;background:#fff}
      .timbre{position:fixed;left:0;right:0;display:flex;justify-content:center;align-items:flex-start;
        gap:10px;background:#fff;padding:4px 0}
      .timbre.haut{top:0} .timbre.bas{bottom:0}
      .timbre b{font:700 18pt/1.1 Arial,Helvetica,sans-serif;color:${ENCRE_ROUGE};
        border:2.5pt solid ${ENCRE_ROUGE};padding:1px 12px;text-transform:uppercase}
      .sf{font:700 18pt/1.1 Arial,Helvetica,sans-serif;color:${ENCRE_BLEUE};
        border:2.5pt solid ${ENCRE_BLEUE};padding:1px 12px;text-transform:uppercase;white-space:nowrap}
      .page{max-width:19cm;margin:0 auto;padding:44px 26px}
      h1{font-size:20pt;margin:0 0 6px} h2{font-size:14pt;margin:26px 0 8px;
        border-bottom:1px solid #bbb;padding-bottom:4px} h3{font-size:11pt;margin:16px 0 4px}
      table{width:100%;border-collapse:collapse;font:9.5pt/1.35 Arial,Helvetica,sans-serif;margin:8px 0}
      th,td{border:1px solid #bbb;padding:4px 6px;text-align:left;vertical-align:top}th{background:#eee}
      .gris{font:9.5pt Arial,Helvetica,sans-serif;color:#555}
      .b{display:inline-block;padding:1px 6px;border-radius:3px;font:700 8.5pt Arial,sans-serif}
      .nc{background:#ffe0e0;color:#a00}.pc{background:#ffefd8;color:#9a4400}
      .c{background:#e0f5e6;color:#0f5c2e}.na,.ne{background:#eee;color:#555}
      .jauge{height:16px;display:flex;border:1px solid #999}.jauge span{display:block}
      /* La couverture est une colonne : le timbre de dimension supérieure est
         poussé au milieu de son bas par « margin-top:auto », sans recouvrir le
         texte (IGI 1300 § 7.1.2.3 a, pour les documents reliés). */
      .couverture{page-break-after:always;min-height:23cm;padding-top:2cm;
        display:flex;flex-direction:column}
      .couverture dl{margin-top:26px}
      .couverture dt{font:700 10pt Arial,sans-serif;color:#555;margin-top:10px}
      .timbre-couverture{margin-top:auto;padding-top:24px;display:flex;flex-direction:column;
        align-items:center;gap:6px}
      .timbre-couverture .cadre{border:3pt solid ${ENCRE_ROUGE};color:${ENCRE_ROUGE};
        padding:4px 16px;max-width:12cm;text-align:center}
      .timbre-couverture .niveau{font:700 18pt/1.15 Arial,Helvetica,sans-serif;text-transform:uppercase}
      .timbre-couverture .avertissement{font:6pt/1.25 Arial,Helvetica,sans-serif;margin-top:3px}
      .timbre-couverture .sf{font-size:18pt}
      @page{margin:20mm 14mm}`;

    const identification = [
      ["Client / entité auditée", meta.client],
      ["Périmètre audité", meta.perimetre],
      ["Site", meta.site],
      ["Référence de la mission", meta.reference],
      ["Autorité émettrice", meta.emetteur],
      ["Auteur du rapport", meta.auditeurs],
      ["Commanditaire", meta.commanditaire],
      ["Période d'audit", dateFr(meta.dateDebut) + (meta.dateFin ? " au " + dateFr(meta.dateFin) : "")],
      ["Date d'émission", dateFr(aujourdhui())],
      ["Numéro d'enregistrement", meta.enregistrement],
      ["Échéance de la classification", meta.echeance],
      ["Exemplaire", meta.exemplaire
        ? meta.exemplaire + (meta.exemplairesTotal ? " sur " + meta.exemplairesTotal : "") : ""],
      ["Marquage du présent rapport", libelleMarquage()],
      ["Référentiels appliqués", meta.referentiels
        .map(id => { const r = Catalogue.referentiel(id); return r ? r.code + " — " + r.nom : id; }).join(" ; ")],
      ["Niveaux de protection traités",
        meta.niveaux.map(n => NIVEAUX[n] ? NIVEAUX[n].libelle : n).join(", ")],
    ];

    let corps = `<div class="couverture"><h1>Rapport d'audit de conformité</h1>
      <p class="gris">${ech(meta.referentiels
        .map(id => (Catalogue.referentiel(id) || {code:id}).code).join(" · "))}</p>
      <dl>${identification.map(([k, v]) =>
        `<dt>${ech(k)}</dt><dd>${ech(v || "—")}</dd>`).join("")}</dl>
      <p class="gris" style="margin-top:26px">Rapport établi à partir d'un plan de contrôle de ${st.total}
      exigences. Il est protégé, transporté et détruit conformément au marquage porté ci-dessus.
      La numérotation des pages est produite par la fonction d'impression du navigateur.</p>
      ${regle.timbre ? `<div class="timbre-couverture">
        <div class="cadre"><div class="niveau">${ech(regle.libelle)}</div>${
          regle.avertissementPenal
            ? `<div class="avertissement">${ech(AVERTISSEMENT_PENAL)}</div>` : ""}</div>
        ${meta.specialFrance ? '<span class="sf">SPÉCIAL FRANCE</span>' : ""}</div>` : ""}</div>`;

    corps += `<h2>1. Synthèse</h2>
      <table><tr><th>Exigences au plan de contrôle</th><td>${st.total}</td>
        <th>Évaluées</th><td>${st.evaluees} (${pct(st.avancement)})</td></tr>
      <tr><th>Taux de conformité</th><td>${pct(st.taux)}</td><th>Écarts</th><td>${st.n.nc + st.n.pc}</td></tr>
      <tr><th>Non conformes</th><td>${st.n.nc}</td><th>Partiellement conformes</th><td>${st.n.pc}</td></tr>
      <tr><th>Conformes</th><td>${st.n.c}</td><th>Non applicables</th><td>${st.n.na}</td></tr></table>
      <div class="jauge">${ORDRE_STATUTS.map(s => st.n[s]
        ? `<span style="width:${(st.n[s] / (st.total || 1) * 100).toFixed(2)}%;
             background:${COULEURS_STATUT[s]}"></span>` : "").join("")}</div>
      <p class="gris">${ORDRE_STATUTS.map(s => STATUTS[s].libelle + " : " + st.n[s]).join(" · ")}</p>`;

    if(meta.appreciation) corps += `<h3>Appréciation générale</h3><p>${ech(meta.appreciation).replace(/\n/g, "<br>")}</p>`;
    if(meta.conclusion)   corps += `<h3>Conclusion</h3><p>${ech(meta.conclusion).replace(/\n/g, "<br>")}</p>`;

    corps += `<h2>2. Conformité par domaine</h2><table><tr><th>Référentiel</th><th>Domaine</th>
      <th>Exigences</th><th>C</th><th>PC</th><th>NC</th><th>NA</th><th>NE</th><th>Taux</th></tr>`;
    const vus = new Set();
    for(const x of plan){
      const cle = x.ref.id + "/" + x.dom.id;
      if(vus.has(cle)) continue;
      vus.add(cle);
      const s2 = Audit.statistiques(plan.filter(y => y.ref.id === x.ref.id && y.dom.id === x.dom.id));
      corps += `<tr><td>${ech(x.ref.code)}</td><td>${ech(x.dom.nom)}</td><td>${s2.total}</td>
        <td>${s2.n.c}</td><td>${s2.n.pc}</td><td>${s2.n.nc}</td><td>${s2.n.na}</td>
        <td>${s2.n.ne}</td><td>${pct(s2.taux)}</td></tr>`;
    }
    corps += "</table>";

    corps += "<h2>3. Écarts relevés</h2>";
    corps += ecarts.length
      ? `<table><tr><th>Réf.</th><th>Exigence</th><th>Statut</th><th>Criticité</th><th>Constat</th>
          <th>Recommandation</th><th>Resp.</th><th>Échéance</th></tr>${ecarts.map(x => {
          const r = Audit.etat.reponses[x.ex.id];
          return `<tr><td>${ech(x.ex.id)}</td><td>${ech(x.ex.t)}</td>
            <td><span class="b ${r.s}">${STATUTS[r.s].abrege}</span></td>
            <td>${ech(CRITICITES[r.crit || ""].libelle)}</td><td>${ech(r.constat || "—")}</td>
            <td>${ech(r.reco || "—")}</td><td>${ech(r.resp || "—")}</td>
            <td>${ech(r.ech ? dateFr(r.ech) : "—")}</td></tr>`; }).join("")}</table>`
      : "<p>Aucun écart relevé.</p>";

    corps += `<h2>4. Résultat détaillé du plan de contrôle</h2>
      <table><tr><th>Réf.</th><th>Exigence, point de contrôle et source officielle</th>
      <th>Statut</th><th>Constat et commentaire</th></tr>`;
    let refCourant = null, domCourant = null;
    for(const x of plan){
      if(x.ref.id !== refCourant){
        refCourant = x.ref.id; domCourant = null;
        corps += `<tr><td colspan="4" style="background:#ddd;font:700 10pt Arial,sans-serif">
          ${ech(x.ref.code + " — " + x.ref.nom)}</td></tr>`;
      }
      if(x.dom.id !== domCourant){
        domCourant = x.dom.id;
        corps += `<tr><td colspan="4" style="background:#f0f0f0;font:700 9.5pt Arial,sans-serif">
          ${ech(x.dom.nom)}</td></tr>`;
      }
      const r = Audit.etat.reponses[x.ex.id] || {s:"ne"};
      const sources = Corpus.sectionsDe(x.ref.id, x.ex.sec).map(s => s.titre).join(" ; ");
      corps += `<tr><td>${ech(x.ex.id)}</td>
        <td><b>${ech(x.ex.t)}</b>
          ${x.ex.enonce ? `<br>${ech(x.ex.enonce)}` : ""}
          ${x.ex.ctrl ? `<br><span class="gris">${ech(x.ex.ctrl)}${
              x.ex.redige ? " (point de contrôle rédigé)" : ""}</span>` : ""}
          ${sources ? `<br><span class="gris"><i>Source : ${ech(sources)}</i></span>` : ""}</td>
        <td><span class="b ${r.s || "ne"}">${STATUTS[r.s || "ne"].abrege}</span>
          ${r.crit ? `<br><span class="gris">${ech(CRITICITES[r.crit].libelle)}</span>` : ""}</td>
        <td>${r.constat ? ech(r.constat) : ""}${r.com ? `<br><span class="gris">${ech(r.com)}</span>` : ""}
          ${r.reco ? `<br><b>Recommandation :</b> ${ech(r.reco)}` : ""}
          ${!r.constat && !r.com && !r.reco ? "—" : ""}</td></tr>`;
    }
    corps += `</table><p class="gris" style="margin-top:20px">Rapport généré le
      ${ech(horodatageFr(new Date().toISOString()))} par l'outil d'audit SSI hors ligne.</p>`;

    // La mention Spécial France n'est apposée qu'en haut de page (annexe 37).
    const bandeau = (position) => regle.timbre
      ? `<div class="timbre ${position}"><b>${ech(regle.libelle)}</b>${
          meta.specialFrance && position === "haut" ? '<span class="sf">SPÉCIAL FRANCE</span>' : ""}</div>`
      : "";

    const document_ = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
      <title>${ech(timbre)} — Rapport d'audit — ${ech(meta.client)}</title>
      <style>${styles}</style></head><body>
      ${bandeau("haut")}${regle.timbreBas ? bandeau("bas") : ""}
      <div class="page">${corps}</div></body></html>`;

    telecharger(nomFichier("rapport-audit", "html"), document_, "text/html");
    notifier("Rapport HTML autonome généré.");
  },
};

/* ===========================================================================
   18. IMPORT ET CYCLE DE VIE DES AUDITS
   =========================================================================== */
const Fichiers = {
  mode: "audit",

  demander(mode){ this.mode = mode; $("#fichier-import").value = ""; $("#fichier-import").click(); },

  traiter(evenement){
    const fichier = evenement.target.files && evenement.target.files[0];
    if(!fichier) return;
    const lecteur = new FileReader();
    lecteur.onload = () => {
      let donnees;
      try { donnees = JSON.parse(lecteur.result); }
      catch(e){ notifier("Fichier illisible : ce n'est pas un JSON valide."); return; }
      try { Fichiers.appliquer(donnees); }
      catch(e){ notifier("Import impossible : " + (e.message || e)); }
    };
    lecteur.onerror = () => notifier("Lecture du fichier impossible.");
    lecteur.readAsText(fichier, "utf-8");
  },

  appliquer(donnees){
    const audit = donnees.audit || (donnees.meta && donnees.reponses ? donnees : null);
    if(!audit || !audit.meta) throw new Error("ce fichier ne contient pas d'audit");
    if(donnees.perso) Catalogue.fusionnerPerso(donnees.perso);

    const existant = Stockage.lireJSON(cleAudit(audit.id), null);
    if(existant && !confirm("Un audit portant le même identifiant existe déjà dans ce navigateur.\n\n" +
        "OK : le remplacer par la version importée.\nAnnuler : importer comme nouvel audit distinct.")){
      audit.id = identifiant();
      audit.meta.client = (audit.meta.client || "Audit") + " (importé)";
    }
    if(!audit.reponses) audit.reponses = {};
    for(const champ of ["appreciation","conclusion","emetteur","enregistrement",
                        "exemplaire","exemplairesTotal","echeance"])
      if(audit.meta[champ] === undefined) audit.meta[champ] = "";
    if(audit.meta.specialFrance === undefined) audit.meta.specialFrance = false;

    ouvrirAudit(audit, true);
    notifier("Audit importé : " + (audit.meta.client || "sans nom") + ".");
  },
};

async function chargerAudit(id){
  const audit = Stockage.lireJSON(cleAudit(id), null);
  if(!audit){ notifier("Audit introuvable."); return; }
  const lien = await FichierLie.restaurer(id);
  if(lien === "adonner")
    notifier("Fichier lié détecté : la première modification demandera l'autorisation d'écriture.", 5000);
  ouvrirAudit(audit, false);
}

function supprimerAudit(id){
  const index = Stockage.lireJSON(CLE_INDEX, []);
  const entree = index.find(x => x.id === id);
  if(!confirm(`Supprimer définitivement l'audit « ${entree ? entree.client || "sans nom" : id} » ?\n\n` +
      "Cette action est irréversible. Exportez-le en .json au préalable pour le conserver.")) return;
  Stockage.supprimer(cleAudit(id));
  Stockage.ecrireJSON(CLE_INDEX, index.filter(x => x.id !== id));
  if(Audit.etat && Audit.etat.id === id){ Audit.etat = null; EcranAudit.selection = null; }
  EcranAccueil.rendre();
  notifier("Audit supprimé.");
}

function dupliquerAudit(id){
  const source = Stockage.lireJSON(cleAudit(id), null);
  if(!source) return;
  const copie = JSON.parse(JSON.stringify(source));
  copie.id = identifiant();
  copie.cree = copie.maj = new Date().toISOString();
  copie.meta.client = (copie.meta.client || "Audit") + " (copie)";
  const precedent = Audit.etat;
  Audit.etat = copie;
  Stockage.ecrireJSON(cleAudit(copie.id), copie);
  Audit.majIndex();
  Audit.etat = precedent;
  EcranAccueil.rendre();
  notifier("Audit dupliqué.");
}
