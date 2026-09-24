
/* ===========================================================================
   13. ÉCRAN D'AUDIT
   =========================================================================== */
/** Identifiant affiché dans l'arborescence : on retire le préfixe du référentiel
 *  lorsqu'il est présent (II901-art7 -> art7), sinon on garde le code officiel
 *  tel quel (ORG-RSSI, HOMOL_01). */
const identCourt = (id, idReferentiel) =>
  id.startsWith(idReferentiel + "-") ? id.slice(idReferentiel.length + 1) : id;

const EcranAudit = {
  selection: null,               /* identifiant de l'exigence affichée */
  domainesReplies: new Set(),    /* domaines repliés dans le plan de contrôle */

  /** L'exigence passe-t-elle les filtres actifs ? */
  correspondFiltres(x){
    const recherche = ($("#filtre-recherche").value || "").trim().toLowerCase();
    const statutVoulu = $("#filtre-statut").value;
    const refVoulu = $("#filtre-referentiel").value;
    const rep = Audit.etat.reponses[x.ex.id] || {};
    const statut = rep.s || "ne";

    if(refVoulu && x.ref.id !== refVoulu) return false;
    if(statutVoulu === "ecarts"){ if(statut !== "nc" && statut !== "pc") return false; }
    else if(statutVoulu && statut !== statutVoulu) return false;

    if(recherche){
      const officiel = Textes.de(x.ex.id);
      const textes = officiel ? officiel.source + " " + officiel.texte : "";
      const foin = [x.ex.id, x.ex.t, x.ex.ctrl, x.ex.enonce, x.ex.src, x.dom.nom, x.ref.code,
                    rep.constat, rep.com, rep.reco, textes].join(" ").toLowerCase();
      if(!foin.includes(recherche)) return false;
    }
    return true;
  },

  rendreArbre(){
    const visibles = Audit.planDeControle().filter(x => this.correspondFiltres(x));

    /* Le filtre par référentiel n'est alimenté qu'une fois, à l'ouverture. */
    const selectRef = $("#filtre-referentiel");
    if(selectRef.options.length <= 1){
      for(const id of Audit.etat.meta.referentiels){
        const ref = Catalogue.referentiel(id);
        if(!ref) continue;
        const option = document.createElement("option");
        option.value = ref.id; option.textContent = ref.code;
        selectRef.appendChild(option);
      }
    }

    /* Regroupement référentiel > domaine. */
    const parReferentiel = new Map();
    for(const x of visibles){
      if(!parReferentiel.has(x.ref.id)) parReferentiel.set(x.ref.id, {ref:x.ref, domaines:new Map()});
      const groupe = parReferentiel.get(x.ref.id);
      if(!groupe.domaines.has(x.dom.id)) groupe.domaines.set(x.dom.id, {dom:x.dom, exigences:[]});
      groupe.domaines.get(x.dom.id).exigences.push(x);
    }

    let html = "";
    for(const groupe of parReferentiel.values()){
      html += `<div class="arbre-ref">${ech(groupe.ref.code)}</div>`;
      for(const sousGroupe of groupe.domaines.values()){
        const cle = groupe.ref.id + "/" + sousGroupe.dom.id;
        const ouvert = !this.domainesReplies.has(cle);
        const traitees = sousGroupe.exigences
          .filter(x => ((Audit.etat.reponses[x.ex.id] || {}).s || "ne") !== "ne").length;
        html += `<button class="arbre-dom" data-dom="${ech(cle)}" aria-expanded="${ouvert}">
            <span class="chevron">▸</span>
            <span class="nom-dom">${ech(sousGroupe.dom.nom)}</span>
            <span class="compte">${traitees}/${sousGroupe.exigences.length}</span></button>`;
        if(ouvert) for(const x of sousGroupe.exigences){
          const statut = (Audit.etat.reponses[x.ex.id] || {}).s || "ne";
          html += `<button class="arbre-ex" data-id="${ech(x.ex.id)}"${
              this.selection === x.ex.id ? ' aria-current="true"' : ""}>
            <span class="pastille" data-s="${statut}" title="${ech(STATUTS[statut].libelle)}"></span>
            <span class="ident">${ech(identCourt(x.ex.id, groupe.ref.id))}</span>
            <span class="lib">${ech(x.ex.t)}</span></button>`;
        }
      }
    }
    $("#arbre").innerHTML = html || '<p class="vide-msg">Aucune exigence ne correspond aux filtres.</p>';

    const st = Audit.statistiques(Audit.planDeControle());
    $("#jauge-mini").innerHTML = ORDRE_STATUTS
      .map(s => st.n[s] ? `<span class="s-${s}" style="width:${st.n[s] / st.total * 100}%"></span>` : "").join("");
    $("#compteur-mini").textContent = `${st.evaluees}/${st.total}`;
  },

  rendreExigence(id){
    const x = Catalogue.exigence(id);
    const panneau = $("#panneau-exigence");
    if(!x){ panneau.innerHTML = '<div class="vide-msg">Exigence introuvable.</div>'; return; }
    this.selection = id;

    const rep = Audit.reponse(id);
    const visibles = Audit.planDeControle().filter(y => this.correspondFiltres(y));
    const rang = visibles.findIndex(y => y.ex.id === id);

    panneau.innerHTML = `
      <div class="chemin">${ech(x.ref.code)} › ${ech(x.dom.nom)}${
        rang >= 0 ? ` · exigence ${rang + 1} sur ${visibles.length}` : ""}</div>
      <div class="exigence-entete">
        <span class="ident-gros">${ech(x.ex.id)}</span>
        ${x.ex.src ? `<span class="etiq">${ech(x.ex.src)}</span>` : ""}
        ${x.ex.officielTitre
          ? '<span class="etiq" title="Numérotation et intitulé repris du texte officiel">intitulé officiel</span>'
          : ""}
        ${x.ex.redige
          ? '<span class="etiq" title="Énoncé de contrôle rédigé pour cet outil, hors source officielle">point de contrôle rédigé</span>'
          : ""}
      </div>
      <h1 style="margin-bottom:14px">${ech(x.ex.t)}</h1>

      ${this.blocTexteOfficiel(x)}

      ${x.ex.ctrl ? `<div class="bloc"><h3>Point de contrôle${
          x.ex.redige ? ' <span class="etiq">rédigé</span>' : ""}</h3>
        <div class="controle">${ech(x.ex.ctrl)}</div></div>` : ""}

      ${x.ex.pr && x.ex.pr.length ? `<div class="bloc"><h3>Éléments de preuve à collecter</h3>
        <ul class="preuves">${x.ex.pr.map(p => `<li>${ech(p)}</li>`).join("")}</ul></div>` : ""}



      <div class="sep"></div>

      <div class="bloc"><h3>Appréciation de l'auditeur</h3>
        <div class="statuts">${["nc","pc","c","na","ne"].map(s =>
          `<label class="statut${rep.s === s ? " actif" : ""}" data-s="${s}">
            <input type="radio" name="statut" value="${s}"${rep.s === s ? " checked" : ""}>
            <b>${ech(STATUTS[s].libelle)}</b><small>${ech(STATUTS[s].aide)}</small></label>`).join("")}
        </div></div>

      <div class="bloc"><label for="champ-constat">Constat — ce qui a été observé</label>
        <textarea id="champ-constat" rows="4"
          placeholder="Documents examinés, entretiens, constats techniques, échantillon contrôlé…">${ech(rep.constat)}</textarea></div>

      <div class="bloc"><label for="champ-com">Commentaire / analyse de l'écart</label>
        <textarea id="champ-com" rows="4"
          placeholder="Analyse, portée de l'écart, circonstances…">${ech(rep.com)}</textarea></div>

      <div class="bloc"><label for="champ-reco">Recommandation</label>
        <textarea id="champ-reco" rows="3" placeholder="Mesure corrective proposée…">${ech(rep.reco)}</textarea></div>

      <div class="grille">
        <div><label for="champ-crit">Criticité de l'écart</label>
          <select id="champ-crit">${Object.entries(CRITICITES).map(([k, v]) =>
            `<option value="${k}"${rep.crit === k ? " selected" : ""}>${ech(v.libelle)}</option>`).join("")}
          </select></div>
        <div><label for="champ-resp">Responsable de la remédiation</label>
          <input type="text" id="champ-resp" value="${ech(rep.resp)}"></div>
        <div><label for="champ-ech">Échéance proposée</label>
          <input type="date" id="champ-ech" value="${ech(rep.ech)}"></div>
      </div>

      <div class="bloc"><label for="champ-preuves">Références des preuves collectées</label>
        <textarea id="champ-preuves" rows="3"
          placeholder="Une référence par ligne : cote du document, date, interlocuteur, capture…">${ech(rep.preuves)}</textarea></div>

      <p class="aide">${rep.maj ? "Dernière modification : " + ech(horodatageFr(rep.maj))
                                : "Exigence non encore renseignée."}</p>

      <div class="pied-navigation no-print">
        <button class="btn discret" id="btn-prec"${rang <= 0 ? " disabled" : ""}>← Précédente</button>
        <button class="btn" id="btn-suiv"${rang < 0 || rang >= visibles.length - 1 ? " disabled" : ""}>Suivante →</button>
      </div>
      <p class="raccourcis no-print">
        <span><kbd>1</kbd> non conforme</span><span><kbd>2</kbd> partiellement</span>
        <span><kbd>3</kbd> conforme</span><span><kbd>0</kbd> non applicable</span>
        <span><kbd>Alt</kbd>+<kbd>↓</kbd> / <kbd>↑</kbd> naviguer</span></p>`;

    this.brancherChamps(id);
    const actif = $('.arbre-ex[aria-current="true"]');
    if(actif) actif.scrollIntoView({block:"nearest"});
  },

  /** Bloc « énoncé officiel ».

   *  Deux origines possibles, dans cet ordre :
   *    - un énoncé embarqué avec le catalogue (`ex.enonce`), issu du texte
   *      officiel lorsque celui-ci a pu être intégré ;
   *    - à défaut, l'énoncé saisi par l'auditeur depuis son exemplaire. */
  blocTexteOfficiel(x){
    const officiel = Textes.de(x.ex.id);
    const avertissement = x.ref.avertissement
      ? `<div class="provenance">${ech(x.ref.avertissement)}</div>` : "";

    /* Un énoncé issu du texte lui-même n'est pas modifiable ici : seul un
       énoncé saisi par l'auditeur l'est. */
    if(officiel && officiel.officiel){
      return `<div class="bloc"><h3>Énoncé officiel — ${ech(x.ref.code)}</h3>${avertissement}
        <p class="texte-officiel-titre">${ech(officiel.source)}</p>
        <div class="texte-officiel enonce">${ech(officiel.texte)}</div></div>`;
    }

    const bouton = `<button class="btn discret petit no-print" id="btn-editer-texte"
      style="margin-left:auto">${officiel ? "Modifier" : "Saisir l'énoncé"}</button>`;
    const secteurChoisi = Catalogue.secteur(Audit.etat ? Audit.etat.meta.secteur : "");
    const manque = x.ref.id === "LPM"
      ? (!secteurChoisi
         ? `Choisissez le secteur d'activités pour que l'énoncé applicable s'affiche : le texte des
            règles n'est pas le même d'un arrêté sectoriel à l'autre.`
         : (secteurChoisi.reglesPubliees === false
            ? `L'annexe I de l'arrêté « ${ech(secteurChoisi.nom)} » n'est pas publiée au Journal
               officiel : seuls ses quatre chapitres le sont. Les règles vous sont notifiées par
               l'ANSSI ; recopiez ici celle qui s'applique.`
            : `L'arrêté « ${ech(secteurChoisi.nom)} » n'est pas encore intégré à l'outil. Recopiez
               ici la règle depuis votre exemplaire : le texte d'un autre secteur ne conviendrait pas.`))
      : `L'énoncé officiel n'est pas embarqué pour cette exigence. Ouvrez votre exemplaire de
         <b>${ech(x.ref.code)}</b> à la référence « ${ech(x.ex.src || "—")} » et recopiez-le ici.`;
    const corps = officiel
      ? `${officiel.source ? `<p class="texte-officiel-titre">${ech(officiel.source)} — saisi par l'auditeur</p>` : ""}
         <div class="texte-officiel enonce">${ech(officiel.texte)}</div>`
      : `<div class="texte-officiel vide">${manque}</div>`;
    return `<div class="bloc"><h3>Énoncé officiel — ${ech(x.ref.code)}${bouton}</h3>
      ${avertissement}${corps}</div>`;
  },

  /** Relie les champs de saisie à l'état de l'audit. */
  brancherChamps(id){
    const rep = Audit.reponse(id);
    const liaisons = {"#champ-constat":"constat", "#champ-com":"com", "#champ-reco":"reco",
                      "#champ-crit":"crit", "#champ-resp":"resp", "#champ-ech":"ech",
                      "#champ-preuves":"preuves"};
    for(const [selecteur, propriete] of Object.entries(liaisons)){
      const champ = $(selecteur);
      if(!champ) continue;
      const enregistrer = () => {
        rep[propriete] = champ.value;
        rep.maj = new Date().toISOString();
        Audit.marquerModifie();
      };
      champ.addEventListener("input", enregistrer);
      champ.addEventListener("change", enregistrer);
    }
    $$("input[name=statut]").forEach(i =>
      i.addEventListener("change", () => this.definirStatut(id, i.value)));
    const editer = $("#btn-editer-texte");
    if(editer) editer.addEventListener("click", () => ouvrirEditeurTexte(id));
    const prec = $("#btn-prec"), suiv = $("#btn-suiv");
    if(prec) prec.addEventListener("click", () => this.naviguer(-1));
    if(suiv) suiv.addEventListener("click", () => this.naviguer(1));
  },

  definirStatut(id, statut){
    const rep = Audit.reponse(id);
    rep.s = statut;
    rep.maj = new Date().toISOString();
    Audit.marquerModifie();
    $$(".statut").forEach(l => l.classList.toggle("actif", l.dataset.s === statut));
    this.rendreArbre();
  },

  naviguer(pas){
    const visibles = Audit.planDeControle().filter(x => this.correspondFiltres(x));
    let i = visibles.findIndex(x => x.ex.id === this.selection);
    if(i < 0) i = pas > 0 ? -1 : visibles.length;
    const cible = i + pas;
    if(cible < 0 || cible >= visibles.length) return;
    this.rendreExigence(visibles[cible].ex.id);
    this.rendreArbre();
  },
};

/* ===========================================================================
   15. SAISIE D'UN ÉNONCÉ OFFICIEL
   =========================================================================== */
function ouvrirEditeurTexte(idExigence){
  const x = Catalogue.exigence(idExigence);
  if(!x) return;
  const officiel = Textes.de(idExigence) || {texte:"", source:x.ex.src || ""};
  const dialogue = $("#dlg-texte");
  $("#dlg-texte-ident").innerHTML =
    `<b>${ech(x.ex.id)}</b> — ${ech(x.ex.t)}<br>Référentiel : ${ech(x.ref.ref)}`;
  $("#dlg-texte-source").value = officiel.source || x.ex.src || "";
  $("#dlg-texte-zone").value = officiel.texte || "";
  dialogue.returnValue = "";
  dialogue.showModal();
  dialogue.addEventListener("close", function gerer(){
    dialogue.removeEventListener("close", gerer);
    if(dialogue.returnValue !== "ok") return;
    Textes.definir(idExigence, $("#dlg-texte-zone").value, $("#dlg-texte-source").value);
    EcranAudit.rendreExigence(idExigence);
    notifier("Énoncé officiel enregistré.");
  });
}
