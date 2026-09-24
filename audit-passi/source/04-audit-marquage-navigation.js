
/* ===========================================================================
   8. AUDIT COURANT
   =========================================================================== */
const Audit = (() => {
  let etat = null;                 /* audit ouvert, ou null                      */
  let minuteurEnregistrement = null;
  let dernierEnregistrement = null;

  /** Structure d'un audit vierge. Toute évolution de forme se fait ici. */
  function vierge(){
    return {
      version: 2,
      id: identifiant(),
      cree: new Date().toISOString(),
      maj: new Date().toISOString(),
      meta: {
        client:"", perimetre:"", site:"", reference:"", auditeurs:"", commanditaire:"",
        dateDebut: aujourdhui(), dateFin:"",
        referentiels: [], secteur: "",
        niveaux: [], filtrerNiveaux: false,   /* sans objet ici : aucun référentiel n'est gradué */
        marquage:"DR", marquageLibre:"", specialFrance:false,
        emetteur:"", enregistrement:"", exemplaire:"", exemplairesTotal:"", echeance:"",
        appreciation:"", conclusion:"",
      },
      reponses: {},
      textes: {},          /* énoncés officiels saisis par l'auditeur, par exigence */
    };
  }

  /** Réponse de l'auditeur pour une exigence, créée à la demande. */
  function reponse(idExigence){
    if(!etat.reponses[idExigence]) etat.reponses[idExigence] = {
      s:"ne", constat:"", com:"", reco:"", crit:"", preuves:"", resp:"", ech:"", maj:null,
    };
    return etat.reponses[idExigence];
  }

  /** Plan de contrôle : exigences retenues compte tenu des référentiels et niveaux choisis. */
  function planDeControle(audit){
    const a = audit || etat;
    const retenues = [];
    for(const ref of Catalogue.tous()){
      if(!a.meta.referentiels.includes(ref.id)) continue;
      for(const dom of ref.domaines) for(const ex of dom.exigences){
        const niveaux = ex.n || ref.niveaux;
        const horsNiveau = a.meta.filtrerNiveaux && niveaux && niveaux.length
                           && !niveaux.some(n => a.meta.niveaux.includes(n));
        if(!horsNiveau) retenues.push({ref, dom, ex});
      }
    }
    return retenues;
  }

  /** Compteurs et taux sur une liste d'exigences. */
  function statistiques(liste){
    const n = {nc:0, pc:0, c:0, na:0, ne:0};
    for(const x of liste) n[(etat.reponses[x.ex.id] || {}).s || "ne"]++;
    const total = liste.length;
    const evaluees = total - n.ne;
    const notees = n.nc + n.pc + n.c;       /* les NA sortent du taux de conformité */
    return {
      n, total, evaluees, notees,
      avancement: total ? Math.round(evaluees / total * 1000) / 10 : 0,
      taux: notees ? Math.round((n.c + 0.5 * n.pc) / notees * 1000) / 10 : null,
    };
  }

  /* --- Enregistrement ---------------------------------------------------- */

  function marquerModifie(){
    if(!etat) return;
    etat.maj = new Date().toISOString();
    afficherEtatEnregistrement("encours");
    clearTimeout(minuteurEnregistrement);
    minuteurEnregistrement = setTimeout(enregistrer, 450);
  }

  async function enregistrer(){
    if(!etat) return;
    const okLocal = Stockage.ecrireJSON(cleAudit(etat.id), etat);
    majIndex();
    if(FichierLie.actif){
      const r = await FichierLie.ecrire(JSON.stringify(paquet(), null, 2));
      if(r === "refus"){ afficherEtatEnregistrement("fichier-refus"); return; }
      if(r === true){
        dernierEnregistrement = new Date();
        afficherEtatEnregistrement(okLocal ? "ok-fichier" : "fichier-seul");
        return;
      }
    }
    dernierEnregistrement = new Date();
    afficherEtatEnregistrement(okLocal && Stockage.disponible ? "ok" : "memoire");
  }

  function afficherEtatEnregistrement(mode){
    const zone = $("#etat-sauvegarde"), texte = $("#etat-txt");
    if(!zone || !texte) return;
    zone.hidden = !etat;
    zone.className = "etat-sauvegarde";
    const heure = dernierEnregistrement
      ? dernierEnregistrement.toLocaleTimeString("fr-FR", {hour:"2-digit", minute:"2-digit"}) : "";
    const messages = {
      "encours":       ["", "Enregistrement…"],
      "ok":            ["", "Enregistré " + heure],
      "ok-fichier":    ["", "Enregistré (fichier) " + heure],
      "fichier-seul":  ["alerte", "Fichier seul " + heure],
      "fichier-refus": ["ko", "Accès fichier à réautoriser"],
      "memoire":       ["ko", "Non persistant — exportez"],
    };
    const [classe, libelle] = messages[mode] || ["", ""];
    if(classe) zone.classList.add(classe);
    texte.textContent = libelle;
  }

  /** Index des audits présents dans ce navigateur, pour l'écran d'accueil. */
  function majIndex(){
    const index = Stockage.lireJSON(CLE_INDEX, []);
    const st = statistiques(planDeControle());
    const entree = {
      id: etat.id, client: etat.meta.client, perimetre: etat.meta.perimetre,
      refs: etat.meta.referentiels.slice(), marquage: etat.meta.marquage,
      maj: etat.maj, avancement: st.avancement, total: st.total,
    };
    const i = index.findIndex(x => x.id === etat.id);
    if(i >= 0) index[i] = entree; else index.push(entree);
    Stockage.ecrireJSON(CLE_INDEX, index);
  }

  /** Enveloppe d'export : l'audit et les exigences complémentaires qu'il utilise. */
  function paquet(){
    return {
      type:"audit-passi-audit", format:1, genere:new Date().toISOString(),
      audit: etat, perso: Catalogue.listePerso(),
    };
  }

  return {
    get etat(){ return etat; },
    set etat(v){ etat = v; },
    vierge, reponse, planDeControle, statistiques,
    marquerModifie, enregistrer, afficherEtatEnregistrement, majIndex, paquet,
  };
})();

/* ===========================================================================
   9. MARQUAGE RÉGLEMENTAIRE
   ---------------------------------------------------------------------------
   Applique à l'écran le timbre correspondant au marquage retenu :
     - niveau inscrit en toutes lettres, en capitales (IGI 1300 § 7.1.2.1) ;
     - encre rouge, au milieu du haut de chaque page (IGI 1300 § 7.1.2.3 a,
       IM 900 § 7.2.3) ;
     - également au bas de chaque page pour Secret et Très Secret ;
     - mention Spécial France en bleu, immédiatement à droite (IM 900 § 7.3.2).
   =========================================================================== */
function appliquerMarquage(){
  const meta = Audit.etat ? Audit.etat.meta : {marquage:"NP", specialFrance:false};
  const regle = MARQUAGES[meta.marquage] || MARQUAGES.NP;
  /* Un marquage libre emprunte la forme du timbre mais porte le libellé saisi. */
  const libelle = regle.libre ? (meta.marquageLibre || "Marquage à préciser") : regle.libelle;

  const haut = $("#bandeau-haut"), bas = $("#bandeau-bas");
  haut.dataset.niveau = regle.id;
  bas.dataset.niveau  = regle.id;
  $("#timbre-haut").textContent = libelle;
  $("#timbre-bas").textContent  = libelle;
  bas.hidden = !regle.timbreBas;
  $("#special-haut").hidden = !(regle.timbre && meta.specialFrance);

  document.title = (regle.timbre ? libelle + " — " : "") + "Audit PASSI"
                 + (meta.client ? " — " + meta.client : "");
}

/** Libellé complet du marquage, tel qu'il est reporté sur les éditions. */
function libelleMarquage(){
  const meta = Audit.etat.meta;
  const regle = MARQUAGES[meta.marquage] || MARQUAGES.NP;
  const libelle = regle.libre ? (meta.marquageLibre || "Marquage à préciser") : regle.libelle;
  return libelle.toUpperCase() + (meta.specialFrance ? " — SPÉCIAL FRANCE" : "");
}

/* ===========================================================================
   10. NAVIGATION ENTRE ÉCRANS
   =========================================================================== */
const ECRANS = ["accueil", "init", "audit", "synthese", "dossier"];
let ecranCourant = "accueil";

function montrerEcran(nom){
  ecranCourant = nom;
  for(const e of ECRANS){
    const section = $("#vue-" + e);
    if(section) section.hidden = (e !== nom);
  }
  const avecAudit = !!Audit.etat && nom !== "accueil" && nom !== "init";
  $("#onglets").hidden          = !avecAudit;
  $("#contexte-barre").hidden   = !avecAudit;
  $("#etat-sauvegarde").hidden  = !avecAudit;
  $$("#onglets button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.vue === nom)));

  if(nom === "accueil")  EcranAccueil.rendre();
  if(nom === "audit")    { EcranAudit.rendreArbre(); if(EcranAudit.selection) EcranAudit.rendreExigence(EcranAudit.selection); }
  if(nom === "synthese") EcranSynthese.rendre();
  if(nom === "dossier")  EcranDossier.rendre();
  window.scrollTo(0, 0);
}

/** Rappel du contexte dans la barre d'application. */
function majContexte(){
  if(!Audit.etat) return;
  const meta = Audit.etat.meta;
  $("#ctx-client").textContent = meta.client || "Audit sans client";
  const refs = meta.referentiels.map(id => (Catalogue.referentiel(id) || {code:id}).code).join(" + ");
  const secteur = meta.secteur ? (Catalogue.secteur(meta.secteur) || {}).nom : "";
  $("#ctx-detail").textContent =
    [meta.perimetre, refs, secteur ? "secteur " + secteur : ""].filter(Boolean).join(" · ");
  appliquerMarquage();
}

/* ===========================================================================
   11. ÉCRAN D'ACCUEIL
   =========================================================================== */
const EcranAccueil = {
  rendre(){
    const index = Stockage.lireJSON(CLE_INDEX, []).sort((a, b) => (b.maj || "").localeCompare(a.maj || ""));
    $("#aucun-audit").hidden = index.length > 0;
    $("#liste-audits").innerHTML = index.map(a => {
      const refs = (a.refs || []).map(id => (Catalogue.referentiel(id) || {code:id}).code).join(" + ");
      const marquage = MARQUAGES[a.marquage] || MARQUAGES.NP;
      return `<li data-id="${ech(a.id)}">
        <span class="etiq" ${marquage.timbre ? 'data-n="' + ech(marquage.id) + '"' : ""}>${ech(marquage.libelle)}</span>
        <span class="info"><b>${ech(a.client || "Sans nom")}</b>
          <small>${ech(a.perimetre || "—")} · ${ech(refs)} · ${a.total || 0} exigences ·
          ${pct(a.avancement || 0)} traité · modifié le ${ech(horodatageFr(a.maj))}</small></span>
        <button class="btn petit" data-act="ouvrir">Ouvrir</button>
        <button class="btn discret petit" data-act="dupliquer">Dupliquer</button>
        <button class="btn discret petit" data-act="supprimer">Supprimer</button></li>`;
    }).join("");

    const volumes = Catalogue.tous().map(r =>
      `<b>${ech(r.code)}</b> : ${r.domaines.reduce((n, d) => n + d.exigences.length, 0)} exigences`);
    $("#encart-textes-detail").innerHTML = volumes.join(" · ") +
      `. Les énoncés officiels ne sont pas embarqués : ils se saisissent exigence par exigence et
       sont conservés avec l'audit.`;

    const diag = $("#diag-stockage");
    if(Stockage.disponible){
      diag.innerHTML = `Stockage local du navigateur <b>opérationnel</b> : la progression est conservée
        automatiquement, y compris après fermeture du navigateur. Ce stockage est propre à ce navigateur,
        à cette machine et à l'emplacement de ce fichier : déplacer le fichier ou changer de navigateur
        fait perdre l'accès aux audits. Exportez régulièrement en <code>.json</code>.` +
        (FichierLie.supporte ? " Ce navigateur permet en outre d'enregistrer en continu dans un fichier local." : "");
    } else {
      diag.innerHTML = `<b>Attention : le stockage local est indisponible</b> (${ech(Stockage.motifIndisponibilite)}).
        La progression n'est conservée que le temps de la session. ` +
        (FichierLie.supporte
          ? "Utilisez « Lier l'audit à un fichier local » pour un enregistrement continu sur disque."
          : "Exportez l'audit en <code>.json</code> avant de fermer l'onglet.");
    }
  },
};

/* ===========================================================================
   12. ÉCRAN D'INITIALISATION
   =========================================================================== */
const EcranInit = {
  rendre(){
    $("#choix-referentiels").innerHTML = Catalogue.tous().map(ref => {
      const nb = ref.domaines.reduce((n, d) => n + d.exigences.length, 0);
      return `<label class="case" data-ref="${ech(ref.id)}">
        <input type="checkbox" name="ref" value="${ech(ref.id)}">
        <span><b>${ech(ref.code)} — ${ech(ref.nom)}</b>
          <small>${ech(ref.ref)}</small>
          <small>${ech(ref.portee)}</small>
          <small>${nb} exigences${ref.secteurs ? " · un secteur d'activités est à préciser" : ""}</small>
        </span></label>`;
    }).join("");

    /* Le secteur ne conditionne pas les exigences : les vingt règles de l'annexe I
       sont communes à tous les secteurs, les différences figurant dans des annexes
       non publiées. Il identifie la mission et est reporté sur les éditions. */
    $("#choix-secteur").innerHTML =
      `<select id="champ-secteur" aria-label="Secteur d'activités d'importance vitale">
         <option value="">— Sans objet ou non déterminé —</option>
         ${Catalogue.secteurs().map(sec =>
           `<option value="${ech(sec.id)}">${ech(sec.nom)} — arrêté du ${ech(sec.arrete)}${
             sec.reglesPubliees ? "" : " (annexe I non publiée)"}</option>`).join("")}
       </select>`;

    $("#choix-marquage").innerHTML = Object.values(MARQUAGES).map(m =>
      `<label class="case" data-marq="${m.id}">
        <input type="radio" name="marq" value="${m.id}"${m.id === "DR" ? " checked" : ""}>
        <span><b>${ech(m.libre ? "Marquage libre" : m.libelle)}</b><small>${m.libre
          ? "Libellé de votre choix, rendu en capitales grasses rouges dans un cadre rouge, en haut de chaque page"
          : (m.timbre
             ? "Timbre rouge en haut" + (m.timbreBas ? " et en bas" : "") + " de chaque page — " + ech(m.source)
             : "Aucun timbre apposé")}</small></span></label>`).join("");

    $("#champ-date-debut").value = aujourdhui();
    this.majApercu();
  },

  /** Met à jour l'état visuel des cases, le décompte et l'affichage conditionnel. */
  majApercu(){
    $$("#vue-init .case").forEach(l => l.classList.toggle("coche", $("input", l).checked));
    const refs = $$("input[name=ref]:checked").map(i => i.value);
    /* Le secteur n'a de sens que pour la LPM ; le champ libre, que pour ce marquage. */
    const avecSecteur = refs.some(id => (Catalogue.referentiel(id) || {}).secteurs);
    $("#bloc-secteur").hidden = !avecSecteur;
    const marquage = ($("input[name=marq]:checked") || {}).value;
    $("#bloc-marquage-libre").hidden = marquage !== "LIBRE";

    const apercu = $("#apercu-plan");
    if(!refs.length){ apercu.textContent = "Sélectionnez au moins un référentiel."; return; }
    const n = Audit.planDeControle({meta:{referentiels:refs, niveaux:[], filtrerNiveaux:false}}).length;
    apercu.textContent = `${n} exigence${n > 1 ? "s" : ""} au plan de contrôle.`;
  },

  /** Crée l'audit à partir du formulaire. */
  creer(evenement){
    evenement.preventDefault();
    const refs = $$("input[name=ref]:checked").map(i => i.value);
    if(!refs.length){ notifier("Sélectionnez au moins un référentiel."); return; }
    const marquage = ($("input[name=marq]:checked") || {value:"DR"}).value;
    if(marquage === "LIBRE" && !$("#champ-marquage-libre").value.trim()){
      notifier("Saisissez le libellé du marquage libre."); return;
    }
    const audit = Audit.vierge();
    const champs = ["client","perimetre","site","reference","auditeurs","commanditaire",
                    "emetteur","enregistrement","exemplaire","exemplairesTotal","echeance"];
    for(const c of champs) audit.meta[c] = ($("#champ-" + c.replace(/([A-Z])/g, "-$1").toLowerCase()) || {value:""}).value.trim();
    audit.meta.dateDebut = $("#champ-date-debut").value;
    audit.meta.dateFin   = $("#champ-date-fin").value;
    audit.meta.referentiels = refs;
    audit.meta.secteur = ($("#champ-secteur") || {value:""}).value;
    audit.meta.marquage = marquage;
    audit.meta.marquageLibre = $("#champ-marquage-libre").value.trim();
    audit.meta.specialFrance = $("#champ-special-france").checked;

    ouvrirAudit(audit, true);
    notifier(`Audit créé : ${Audit.planDeControle().length} exigences au plan de contrôle.`);
  },
};

/** Ouvre un audit (nouveau ou restauré) et bascule sur l'écran d'audit. */
function ouvrirAudit(audit, estNouveau){
  Audit.etat = audit;
  EcranAudit.selection = null;
  EcranAudit.domainesReplies = new Set();
  $("#filtre-referentiel").innerHTML = '<option value="">Tous référentiels</option>';
  if(estNouveau){ Stockage.ecrireJSON(cleAudit(audit.id), audit); Audit.majIndex(); }
  majContexte();
  Audit.afficherEtatEnregistrement("ok");
  montrerEcran("audit");
  const plan = Audit.planDeControle();
  if(plan.length) EcranAudit.rendreExigence(plan[0].ex.id);
}
