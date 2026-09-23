
/* ===========================================================================
   14. ÉCRAN DE SYNTHÈSE
   =========================================================================== */
const COULEURS_STATUT = {c:"#18753c", pc:"#b34000", nc:"#ce0500", na:"#8c8c8c", ne:"#d6d6d6"};

/** Anneau de répartition, dessiné en SVG sans bibliothèque. */
function anneau(compteurs, total){
  const circonference = 2 * Math.PI * 60;
  let decalage = 0, segments = "";
  for(const s of ORDRE_STATUTS){
    if(!compteurs[s]) continue;
    const longueur = compteurs[s] / total * circonference;
    segments += `<circle cx="80" cy="80" r="60" fill="none" stroke="${COULEURS_STATUT[s]}" stroke-width="26"
      stroke-dasharray="${longueur.toFixed(2)} ${(circonference - longueur).toFixed(2)}"
      stroke-dashoffset="${(-decalage).toFixed(2)}"/>`;
    decalage += longueur;
  }
  return `<svg viewBox="0 0 160 160" width="160" height="160" role="img"
    aria-label="Répartition des statuts"><g transform="rotate(-90 80 80)">${segments}</g></svg>`;
}
function jauge(compteurs, total){
  return `<div class="jauge">${ORDRE_STATUTS.map(s => compteurs[s]
    ? `<span class="s-${s}" style="width:${(compteurs[s] / total * 100).toFixed(2)}%"
        title="${ech(STATUTS[s].libelle)} : ${compteurs[s]}"></span>` : "").join("")}</div>`;
}
function legende(compteurs){
  return `<div class="legende">${ORDRE_STATUTS.map(s =>
    `<span><i style="background:${COULEURS_STATUT[s]}"></i>${ech(STATUTS[s].libelle)} :
      <b>${compteurs[s] || 0}</b></span>`).join("")}</div>`;
}

const EcranSynthese = {
  /** Écarts (NC et PC) triés par criticité décroissante. */
  ecarts(plan){
    return plan
      .filter(x => ["nc", "pc"].includes((Audit.etat.reponses[x.ex.id] || {}).s))
      .sort((a, b) => {
        const ra = Audit.etat.reponses[a.ex.id], rb = Audit.etat.reponses[b.ex.id];
        const parCriticite = CRITICITES[rb.crit || ""].rang - CRITICITES[ra.crit || ""].rang;
        if(parCriticite) return parCriticite;
        if(ra.s !== rb.s) return ra.s === "nc" ? -1 : 1;
        return a.ex.id.localeCompare(b.ex.id);
      });
  },

  rendre(){
    const plan = Audit.planDeControle();
    const st = Audit.statistiques(plan);
    const meta = Audit.etat.meta;
    const ecarts = this.ecarts(plan);
    const graves = ecarts.filter(x => ["elevee", "critique"]
      .includes(Audit.etat.reponses[x.ex.id].crit)).length;

    const fiche = [
      ["Client / entité auditée", meta.client], ["Périmètre", meta.perimetre], ["Site", meta.site],
      ["Référence de la mission", meta.reference], ["Auditeur(s)", meta.auditeurs],
      ["Commanditaire", meta.commanditaire],
      ["Période", dateFr(meta.dateDebut) + (meta.dateFin ? " au " + dateFr(meta.dateFin) : "")],
      ["Référentiels", meta.referentiels.map(id => (Catalogue.referentiel(id) || {code:id}).code).join(" + ")],
      ["Niveaux traités", meta.niveaux.map(n => NIVEAUX[n] ? NIVEAUX[n].libelle : n).join(", ") || "—"],
      ["Marquage du rapport", libelleMarquage()],
    ];

    let html = `<h1>Synthèse de l'audit</h1>
      <div class="carte" style="margin-bottom:20px"><div class="grille">${fiche.map(([k, v]) =>
        `<div><div style="font-size:.76rem;text-transform:uppercase;letter-spacing:.05em;
          color:var(--texte-3);font-weight:600">${ech(k)}</div><div>${ech(v || "—")}</div></div>`).join("")}
      </div></div>

      <div class="kpis">
        <div class="kpi" data-t="b"><div class="l">Avancement</div><div class="v">${pct(st.avancement)}</div>
          <div class="d">${st.evaluees} exigences évaluées sur ${st.total}</div></div>
        <div class="kpi" data-t="c"><div class="l">Taux de conformité</div><div class="v">${pct(st.taux)}</div>
          <div class="d">conformes + 0,5 × partiels, hors non applicables</div></div>
        <div class="kpi" data-t="nc"><div class="l">Non conformités</div><div class="v">${st.n.nc}</div>
          <div class="d">${graves} écart(s) de criticité élevée ou critique</div></div>
        <div class="kpi" data-t="pc"><div class="l">Conformités partielles</div><div class="v">${st.n.pc}</div>
          <div class="d">écarts à traiter</div></div>
      </div>

      <div class="carte" style="margin-bottom:20px"><h2>Répartition générale</h2>
        <div style="display:flex;gap:26px;align-items:center;flex-wrap:wrap">
          ${anneau(st.n, st.total || 1)}
          <div style="flex:1;min-width:240px">${jauge(st.n, st.total || 1)}${legende(st.n)}
            <p class="aide" style="margin-top:10px">Plan de contrôle : <b>${st.total}</b> exigences issues de
            ${meta.referentiels.length} référentiel(s).</p></div>
        </div></div>`;

    /* Conformité par référentiel puis par domaine. */
    html += '<div class="carte" style="margin-bottom:20px"><h2>Conformité par référentiel</h2>';
    for(const id of meta.referentiels){
      const ref = Catalogue.referentiel(id);
      const sous = plan.filter(x => x.ref.id === id);
      if(!ref || !sous.length) continue;
      const s2 = Audit.statistiques(sous);
      html += `<div class="barre-dom"><span class="nom" title="${ech(ref.nom)}"><b>${ech(ref.code)}</b></span>
        ${jauge(s2.n, s2.total)}<span class="pct">${pct(s2.taux)}</span></div>`;
    }
    html += "</div>";

    html += '<div class="carte" style="margin-bottom:20px"><h2>Conformité par domaine</h2>';
    const vus = new Set();
    for(const x of plan){
      const cle = x.ref.id + "/" + x.dom.id;
      if(vus.has(cle)) continue;
      vus.add(cle);
      const sous = plan.filter(y => y.ref.id === x.ref.id && y.dom.id === x.dom.id);
      const s2 = Audit.statistiques(sous);
      html += `<div class="barre-dom"><span class="nom" title="${ech(x.ref.code + " — " + x.dom.nom)}">
        ${ech(x.dom.nom)} <small style="color:var(--texte-3)">(${ech(x.ref.code)})</small></span>
        ${jauge(s2.n, s2.total)}<span class="pct">${pct(s2.taux)}</span></div>`;
    }
    html += "</div>";

    /* Écarts. */
    html += `<div class="carte saut-page" style="margin-bottom:20px"><h2>Écarts relevés (${ecarts.length})</h2>`;
    html += ecarts.length
      ? `<div class="tableau-enveloppe"><table><thead><tr><th>Réf.</th><th>Exigence</th><th>Statut</th>
          <th>Criticité</th><th>Constat</th><th>Recommandation</th></tr></thead><tbody>${
          ecarts.map(x => { const r = Audit.etat.reponses[x.ex.id];
            return `<tr><td><code>${ech(x.ex.id)}</code></td><td>${ech(x.ex.t)}</td>
              <td><span class="badge-s" data-s="${r.s}">${ech(STATUTS[r.s].abrege)}</span></td>
              <td>${ech(CRITICITES[r.crit || ""].libelle)}</td>
              <td>${ech(r.constat || "—")}</td><td>${ech(r.reco || "—")}</td></tr>`; }).join("")}
        </tbody></table></div>`
      : '<p class="aide">Aucun écart relevé à ce stade.</p>';
    html += "</div>";

    /* Plan d'action. */
    const actions = ecarts.filter(x => {
      const r = Audit.etat.reponses[x.ex.id];
      return r.reco || r.resp || r.ech;
    });
    html += `<div class="carte" style="margin-bottom:20px"><h2>Plan d'action</h2>${actions.length
      ? `<div class="tableau-enveloppe"><table><thead><tr><th>Réf.</th><th>Action</th><th>Criticité</th>
          <th>Responsable</th><th>Échéance</th></tr></thead><tbody>${
          actions.map(x => { const r = Audit.etat.reponses[x.ex.id];
            return `<tr><td><code>${ech(x.ex.id)}</code></td><td>${ech(r.reco || x.ex.t)}</td>
              <td>${ech(CRITICITES[r.crit || ""].libelle)}</td><td>${ech(r.resp || "—")}</td>
              <td>${ech(r.ech ? dateFr(r.ech) : "—")}</td></tr>`; }).join("")}
        </tbody></table></div>`
      : `<p class="aide">Aucune action renseignée. Complétez les champs « recommandation »,
         « responsable » et « échéance » des écarts.</p>`}</div>`;

    /* Appréciation rédigée. */
    html += `<div class="carte no-print"><h2>Appréciation générale</h2>
      <label for="champ-appreciation">Synthèse rédigée de l'auditeur</label>
      <textarea id="champ-appreciation" rows="5">${ech(meta.appreciation)}</textarea>
      <label for="champ-conclusion" style="margin-top:12px">Conclusion et avis</label>
      <textarea id="champ-conclusion" rows="4">${ech(meta.conclusion)}</textarea></div>`;
    if(meta.appreciation || meta.conclusion){
      html += `<div class="carte" style="margin-top:16px"><h2>Appréciation générale</h2>
        <p style="white-space:pre-wrap">${ech(meta.appreciation || "—")}</p>
        <h3 style="margin-top:14px">Conclusion</h3>
        <p style="white-space:pre-wrap">${ech(meta.conclusion || "—")}</p></div>`;
    }

    html += `<div class="ligne-boutons no-print" style="margin-top:18px">
      <button class="btn" id="btn-syn-rapport">Rapport HTML autonome</button>
      <button class="btn secondaire" id="btn-syn-imprimer">Imprimer / PDF</button>
      <button class="btn discret" id="btn-syn-csv">Matrice .csv</button></div>`;

    $("#synthese-contenu").innerHTML = html;

    const appreciation = $("#champ-appreciation"), conclusion = $("#champ-conclusion");
    appreciation.addEventListener("input", () => { meta.appreciation = appreciation.value; Audit.marquerModifie(); });
    conclusion.addEventListener("input",  () => { meta.conclusion  = conclusion.value;  Audit.marquerModifie(); });
    $("#btn-syn-rapport").addEventListener("click", Exports.rapportHTML);
    $("#btn-syn-imprimer").addEventListener("click", () => window.print());
    $("#btn-syn-csv").addEventListener("click", Exports.matriceCSV);
  },
};

/* ===========================================================================
   16. ÉCRAN DU DOSSIER
   =========================================================================== */
const EcranDossier = {
  rendre(){
    const meta = Audit.etat.meta;
    const champsTexte = [
      ["client","Client / entité auditée"], ["perimetre","Périmètre"], ["site","Site"],
      ["reference","Référence de la mission"], ["auditeurs","Auditeur(s)"],
      ["commanditaire","Commanditaire"], ["emetteur","Autorité émettrice"],
      ["enregistrement","Numéro d'enregistrement"], ["exemplaire","Numéro d'exemplaire"],
      ["exemplairesTotal","Nombre total d'exemplaires"], ["echeance","Échéance de la classification"],
    ];
    $("#form-parametres").innerHTML =
      champsTexte.map(([cle, libelle]) => `<div style="margin-bottom:10px">
        <label for="param-${cle}">${ech(libelle)}</label>
        <input type="text" id="param-${cle}" data-meta="${cle}" value="${ech(meta[cle] || "")}"></div>`).join("") +
      `<div style="margin-bottom:10px"><label for="param-marquage">Marquage du rapport</label>
        <select id="param-marquage" data-meta="marquage">${Object.values(MARQUAGES).map(m =>
          `<option value="${m.id}"${meta.marquage === m.id ? " selected" : ""}>${ech(m.libelle)}</option>`).join("")}
      </select></div>
      <label class="case"><input type="checkbox" id="param-special" ${meta.specialFrance ? "checked" : ""}>
        <span><b>Mention Spécial France</b></span></label>
      <div class="grille"><div><label for="param-dateDebut">Début</label>
        <input type="date" id="param-dateDebut" data-meta="dateDebut" value="${ech(meta.dateDebut || "")}"></div>
        <div><label for="param-dateFin">Fin</label>
        <input type="date" id="param-dateFin" data-meta="dateFin" value="${ech(meta.dateFin || "")}"></div></div>`;

    $$("#form-parametres [data-meta]").forEach(champ =>
      champ.addEventListener("input", () => {
        meta[champ.dataset.meta] = champ.value;
        Audit.marquerModifie(); majContexte();
      }));
    $("#param-special").addEventListener("change", e => {
      meta.specialFrance = e.target.checked; Audit.marquerModifie(); appliquerMarquage();
    });

    $("#etat-fichier-lie").innerHTML = FichierLie.actif
      ? `Lié à <b>${ech(FichierLie.nom)}</b> : chaque modification y est écrite.`
      : (FichierLie.supporte
         ? "Non lié. L'enregistrement se fait dans le stockage du navigateur."
         : "Non disponible dans ce navigateur. Utilisez l'export .json.");

    const perso = Catalogue.listePerso();
    $("#liste-exigences-perso").innerHTML = perso.length
      ? `<ul class="liste-audits">${perso.map(ex => `<li data-perso="${ech(ex.id)}">
          <span class="info"><b>${ech(ex.id)} — ${ech(ex.t)}</b><small>${ech(ex.dom || "—")}</small></span>
          <button class="btn discret petit" data-act="supprimer-perso">Supprimer</button></li>`).join("")}</ul>`
      : '<p class="aide">Aucune exigence ajoutée.</p>';
  },
};
