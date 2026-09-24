<script>
"use strict";
/* ===========================================================================
   APPLICATION
   ---------------------------------------------------------------------------
    1. Constantes métier          9. Marquage réglementaire
    2. Outils généraux           10. Navigation entre écrans
    3. Accès aux données         11. Écran d'accueil
    4. Stockage local            12. Écran d'initialisation
    5. Fichier lié               13. Écran d'audit
    6. Catalogue                 14. Écran de synthèse
    7. Corpus officiel           15. Écran des textes officiels
    8. Audit courant             16. Écran du dossier
                                 17. Exports  18. Import
                                 19. Événements  20. Démarrage
   =========================================================================== */

/* ===========================================================================
   1. CONSTANTES MÉTIER
   =========================================================================== */

/** Statuts d'évaluation. `poids` sert au calcul du taux de conformité ;
 *  `null` signifie que l'exigence n'entre pas dans ce calcul. */
const STATUTS = {
  ne: {code:"ne", libelle:"Non évaluée",            abrege:"NE", aide:"à traiter",           poids:null},
  nc: {code:"nc", libelle:"Non conforme",           abrege:"NC", aide:"écart majeur",        poids:0},
  pc: {code:"pc", libelle:"Partiellement conforme", abrege:"PC", aide:"écart partiel",       poids:0.5},
  c:  {code:"c",  libelle:"Conforme",               abrege:"C",  aide:"exigence satisfaite", poids:1},
  na: {code:"na", libelle:"Non applicable",         abrege:"NA", aide:"hors périmètre",      poids:null},
};
const ORDRE_STATUTS = ["nc", "pc", "c", "na", "ne"];

/** Niveaux de protection traités par le système audité. */
const NIVEAUX = {
  DR: {id:"DR", libelle:"Diffusion Restreinte",
       aide:"Mention de protection — l'IGI 1300 § 1.3.2 rappelle qu'il ne s'agit pas d'un timbre de classification"},
  S:  {id:"S",  libelle:"Secret",      aide:"Information classifiée au titre du secret de la défense nationale"},
  TS: {id:"TS", libelle:"Très Secret", aide:"Niveau le plus élevé, assorti de mentions particulières"},
};

/** Marquage du rapport lui-même.
 *  `timbre`    : un timbre doit-il être apposé ?
 *  `timbreBas` : doit-il l'être aussi au bas de chaque page ?
 *                Oui pour les informations classifiées (IGI 1300 § 7.1.2.3 a),
 *                non pour la mention Diffusion Restreinte (IM 900 § 7.2.3 :
 *                « au milieu du haut de la page »). */
/** `avertissementPenal` : l'annexe 37 ne prévoit le rappel du code pénal que
 *  dans les modèles Secret et Très Secret, sur la couverture des documents
 *  reliés. La mention Diffusion Restreinte n'en comporte pas. */
const MARQUAGES = {
  NP: {id:"NP", libelle:"Non protégé",          timbre:false, timbreBas:false,
       avertissementPenal:false, source:""},
  DR: {id:"DR", libelle:"Diffusion Restreinte", timbre:true,  timbreBas:false,
       avertissementPenal:false, source:"IGI 1300 annexe 1 ; IM 900 § 7.2.3"},
  S:  {id:"S",  libelle:"Secret",               timbre:true,  timbreBas:true,
       avertissementPenal:true,  source:"IGI 1300 § 7.1.2.3 a) et annexe 37"},
  TS: {id:"TS", libelle:"Très Secret",          timbre:true,  timbreBas:true,
       avertissementPenal:true,  source:"IGI 1300 § 7.1.2.3 a) et annexe 37"},
};

/** Avertissement porté sous le niveau sur la couverture des documents reliés,
 *  reproduit à l'identique de l'annexe 37 de l'IGI 1300. */
const AVERTISSEMENT_PENAL =
  "Toute personne qui détient ce document sans avoir qualité pour le connaître tombe sous le " +
  "coup des dispositions du code pénal réprimant les atteintes au secret de la défense nationale";

/** Encres prescrites par les textes, reprises à l'identique dans les éditions. */
const ENCRE_ROUGE = "#c9191e";   /* timbre de classification et mention DR */
const ENCRE_BLEUE = "#0050c8";   /* mention complémentaire Spécial France  */

const CRITICITES = {
  "":         {libelle:"—",        rang:0},
  faible:     {libelle:"Faible",   rang:1},
  moderee:    {libelle:"Modérée",  rang:2},
  elevee:     {libelle:"Élevée",   rang:3},
  critique:   {libelle:"Critique", rang:4},
};

/* Clés du stockage local. */
const CLE_INDEX = "auditssi.index";
const CLE_PREFS = "auditssi.prefs";
const CLE_PERSO = "auditssi.perso";
const cleAudit  = id => "auditssi.audit." + id;

/* ===========================================================================
   2. OUTILS GÉNÉRAUX
   =========================================================================== */

const $  = (selecteur, racine) => (racine || document).querySelector(selecteur);
const $$ = (selecteur, racine) => Array.from((racine || document).querySelectorAll(selecteur));

/** Échappe le texte destiné à être inséré dans du HTML. */
const ech = valeur => String(valeur == null ? "" : valeur)
  .replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const identifiant = () => "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const aujourdhui  = () => new Date().toISOString().slice(0, 10);

/** Pourcentage à la française : séparateur décimal virgule, tiret si indéfini. */
const pct = v => (v === null || v === undefined) ? "—" : String(v).replace(".", ",") + " %";

function dateFr(iso){
  if(!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString("fr-FR", {day:"2-digit", month:"2-digit", year:"numeric"});
}
function horodatageFr(iso){
  if(!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleString("fr-FR",
    {day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit"});
}

let minuteurNotification;
/** Affiche un message transitoire en bas d'écran. */
function notifier(message, dureeMs){
  clearTimeout(minuteurNotification);
  let boite = $("#notif");
  if(!boite){
    boite = document.createElement("div");
    boite.id = "notif"; boite.className = "notif"; boite.setAttribute("role", "status");
    document.body.appendChild(boite);
  }
  boite.textContent = message;
  minuteurNotification = setTimeout(() => boite.remove(), dureeMs || 3200);
}

/** Déclenche le téléchargement d'un contenu produit en mémoire. */
function telecharger(nom, contenu, typeMime){
  const url = URL.createObjectURL(new Blob([contenu], {type:(typeMime || "application/json") + ";charset=utf-8"}));
  const lien = document.createElement("a");
  lien.href = url; lien.download = nom;
  document.body.appendChild(lien); lien.click();
  setTimeout(() => { URL.revokeObjectURL(url); lien.remove(); }, 1500);
}

/** Nom de fichier lisible, dérivé du nom du client. */
function nomFichier(base, extension){
  const client = (Audit.etat && Audit.etat.meta.client ? Audit.etat.meta.client : "audit")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "audit";
  return `${base}_${client}_${aujourdhui()}.${extension}`;
}

/* ===========================================================================
   3. ACCÈS AUX DONNÉES EMBARQUÉES
   ---------------------------------------------------------------------------
   Les données (catalogue et textes officiels) sont stockées dans des blocs
   <script type="application/json"> : le code reste lisible et les textes ne
   sont pas noyés dans des littéraux JavaScript.
   =========================================================================== */
function lireBlocJSON(id){
  const bloc = document.getElementById(id);
  if(!bloc) throw new Error("bloc de données introuvable : " + id);
  return JSON.parse(bloc.textContent);
}

/* ===========================================================================
   4. STOCKAGE LOCAL
   ---------------------------------------------------------------------------
   `localStorage` peut être indisponible (fichier ouvert depuis le disque sous
   certains navigateurs, navigation privée, stockage bloqué). On le teste au
   démarrage et on bascule sinon sur une mémoire de session, en avertissant.
   =========================================================================== */
const Stockage = (() => {
  let disponible = false, motifIndisponibilite = "";
  try {
    const cleTest = "__test__" + Math.random();
    localStorage.setItem(cleTest, "1");
    disponible = localStorage.getItem(cleTest) === "1";
    localStorage.removeItem(cleTest);
    if(!disponible) motifIndisponibilite = "le navigateur n'a pas restitué la valeur écrite";
  } catch(e){
    motifIndisponibilite = (e && e.name === "SecurityError")
      ? "le navigateur bloque le stockage local pour les fichiers ouverts depuis le disque"
      : ((e && e.message) || "cause inconnue");
  }
  const memoire = new Map();   /* repli non persistant */

  return {
    disponible, motifIndisponibilite,
    lire(cle){
      try { return disponible ? localStorage.getItem(cle) : (memoire.get(cle) ?? null); }
      catch(e){ return null; }
    },
    ecrire(cle, valeur){
      try {
        if(disponible) localStorage.setItem(cle, valeur); else memoire.set(cle, valeur);
        return true;
      } catch(e){
        memoire.set(cle, valeur);
        if(/quota/i.test(e.name + e.message))
          notifier("Stockage local saturé : exportez l'audit en .json.", 6000);
        return false;
      }
    },
    supprimer(cle){ try { if(disponible) localStorage.removeItem(cle); } catch(e){} memoire.delete(cle); },
    lireJSON(cle, defaut){
      const brut = this.lire(cle);
      if(!brut) return defaut;
      try { return JSON.parse(brut); } catch(e){ return defaut; }
    },
    ecrireJSON(cle, objet){ return this.ecrire(cle, JSON.stringify(objet)); },
  };
})();

/* ===========================================================================
   5. FICHIER LIÉ
   ---------------------------------------------------------------------------
   Sur les navigateurs qui exposent l'API « File System Access », l'audit peut
   être écrit en continu dans un fichier choisi par l'auditeur (clé USB par
   exemple). La poignée est conservée dans IndexedDB pour survivre au
   rechargement ; l'autorisation d'écriture, elle, doit être redonnée.
   =========================================================================== */
const FichierLie = (() => {
  const supporte = typeof window.showSaveFilePicker === "function";
  let poignee = null, idAuditLie = null;
  const BASE = "auditssi-fs", MAGASIN = "poignees";

  function ouvrirBase(){
    return new Promise((resoudre, rejeter) => {
      if(!window.indexedDB) return rejeter(new Error("IndexedDB indisponible"));
      const req = indexedDB.open(BASE, 1);
      req.onupgradeneeded = () => {
        if(!req.result.objectStoreNames.contains(MAGASIN)) req.result.createObjectStore(MAGASIN);
      };
      req.onsuccess = () => resoudre(req.result);
      req.onerror   = () => rejeter(req.error);
    });
  }
  async function ecrireBase(cle, valeur){
    try {
      const base = await ouvrirBase();
      await new Promise((ok, ko) => {
        const t = base.transaction(MAGASIN, "readwrite");
        t.objectStore(MAGASIN).put(valeur, cle);
        t.oncomplete = ok; t.onerror = () => ko(t.error);
      });
    } catch(e){ /* le fichier lié est une commodité : son échec n'est pas bloquant */ }
  }
  async function lireBase(cle){
    try {
      const base = await ouvrirBase();
      return await new Promise((ok, ko) => {
        const t = base.transaction(MAGASIN, "readonly");
        const r = t.objectStore(MAGASIN).get(cle);
        r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error);
      });
    } catch(e){ return null; }
  }

  return {
    supporte,
    get actif(){ return !!poignee; },
    get nom(){ return poignee ? poignee.name : null; },

    async lier(nomPropose, idAudit){
      if(!supporte){ notifier("Ce navigateur ne permet pas l'enregistrement direct dans un fichier."); return false; }
      try {
        poignee = await window.showSaveFilePicker({
          suggestedName: nomPropose,
          types: [{description:"Audit SSI (JSON)", accept:{"application/json":[".json"]}}],
        });
        idAuditLie = idAudit;
        await ecrireBase("poignee:" + idAudit, poignee);
        return true;
      } catch(e){ return false; }   /* l'auditeur a annulé la boîte de dialogue */
    },

    /** Retourne true (prêt), "adonner" (autorisation à redemander) ou false. */
    async restaurer(idAudit){
      if(!supporte) return false;
      const p = await lireBase("poignee:" + idAudit);
      if(!p) return false;
      poignee = p; idAuditLie = idAudit;
      try { return (await p.queryPermission({mode:"readwrite"})) === "granted" ? true : "adonner"; }
      catch(e){ poignee = null; return false; }
    },

    delier(){ if(idAuditLie) ecrireBase("poignee:" + idAuditLie, null); poignee = null; idAuditLie = null; },

    /** Retourne true, "refus" (autorisation manquante) ou false. */
    async ecrire(texte){
      if(!poignee) return false;
      try {
        if((await poignee.queryPermission({mode:"readwrite"})) !== "granted") return "refus";
        const flux = await poignee.createWritable();
        await flux.write(texte); await flux.close();
        return true;
      } catch(e){ return false; }
    },
  };
})();

/* ===========================================================================
   6. CATALOGUE DES POINTS DE CONTRÔLE
   ---------------------------------------------------------------------------
   Référentiels livrés + exigences ajoutées par l'auditeur, regroupées dans un
   pseudo-référentiel « PERSO ».
   =========================================================================== */
const Catalogue = (() => {
  const livre = lireBlocJSON("donnees-catalogue");
  let perso = Stockage.lireJSON(CLE_PERSO, []);

  function enregistrerPerso(){ Stockage.ecrireJSON(CLE_PERSO, perso); }

  /** Construit le référentiel virtuel des exigences ajoutées. */
  function referentielPerso(){
    if(!perso.length) return null;
    const parDomaine = new Map();
    for(const ex of perso){
      const nom = ex.dom || "Exigences complémentaires";
      if(!parDomaine.has(nom)) parDomaine.set(nom, []);
      parDomaine.get(nom).push(ex);
    }
    return {
      id:"PERSO", code:"Complément", nom:"Exigences ajoutées par l'auditeur",
      ref:"Exigences propres à la mission (clause contractuelle, PSSI interne, annexe de sécurité)",
      portee:"Exigences saisies dans cet outil par l'auditeur.", niveaux:null,
      domaines: Array.from(parDomaine, ([nom, exigences], i) => ({id:"P" + i, nom, exigences})),
    };
  }

  return {
    version: livre.version,
    tous(){
      const liste = livre.referentiels.slice();
      const p = referentielPerso();
      if(p) liste.push(p);
      return liste;
    },
    referentiel(id){ return this.tous().find(r => r.id === id) || null; },
    /** Toutes les exigences, aplaties, avec leur référentiel et leur domaine. */
    aplati(){
      const out = [];
      for(const ref of this.tous())
        for(const dom of ref.domaines)
          for(const ex of dom.exigences) out.push({ref, dom, ex});
      return out;
    },
    exigence(id){ return this.aplati().find(x => x.ex.id === id) || null; },
    nombreExigences(){ return this.aplati().length; },

    listePerso(){ return perso.slice(); },
    ajouterPerso(ex){ perso.push(ex); enregistrerPerso(); },
    supprimerPerso(id){ perso = perso.filter(e => e.id !== id); enregistrerPerso(); },
    fusionnerPerso(liste){
      for(const ex of liste || []) if(!perso.some(p => p.id === ex.id)) perso.push(ex);
      enregistrerPerso();
    },
  };
})();

/* ===========================================================================
   7. CORPUS OFFICIEL
   ---------------------------------------------------------------------------
   Texte des trois instructions, découpé par article ou section. Une exigence
   du catalogue référence une ou plusieurs de ces sections par la propriété
   `sec` ; l'écran d'audit les affiche telles quelles.
   =========================================================================== */
const Corpus = (() => {
  const corpus = {};
  for(const id of ["II901", "IGI1300", "IM900"]) corpus[id] = lireBlocJSON("donnees-corpus-" + id);

  return {
    /** Le corpus d'un référentiel, ou null pour un référentiel sans texte (PERSO). */
    de(idReferentiel){ return corpus[idReferentiel] || null; },
    tous(){ return Object.values(corpus); },
    /** Une section précise : {t: intitulé, x: texte officiel}. */
    section(idReferentiel, cle){
      const c = corpus[idReferentiel];
      return c && c.sections[cle] ? c.sections[cle] : null;
    },
    /** Sections officielles rattachées à une exigence. */
    sectionsDe(idReferentiel, cles){
      return (cles || []).map(cle => {
        const s = this.section(idReferentiel, cle);
        return s ? {cle, titre:s.t, texte:s.x} : {cle, titre:cle, texte:""};
      });
    },
    statistiques(){
      return this.tous().map(c => ({
        code: c.code,
        sections: Object.keys(c.sections).length,
        caracteres: Object.values(c.sections).reduce((n, s) => n + s.x.length, 0),
      }));
    },
  };
})();
