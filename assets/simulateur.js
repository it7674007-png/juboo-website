/* Le simulateur de Juboo.
 *
 * Les écrans de l'application, refaits en HTML, avec un vrai carnet derrière : on y tape ce qu'on
 * veut, on appuie où l'on veut, et on peut se tromper exactement comme dans l'application.
 *
 * Le guide suit les règles du jeu de l'application (TutorialPanel.kt) : il juge l'ÉTAT du carnet,
 * jamais les appuis. Tant que rien n'est enregistré, il raconte la situation ; dès que le carnet
 * change, sa réaction remplace la consigne — « très bien », « presque », ou « non ». Les leçons
 * (lecons/*.js) reprennent mot pour mot les répliques et les jugements de l'application.
 */
(() => {
  'use strict';

  // ============================================================================================
  // OUTILS
  // ============================================================================================
  const NB = ' ';
  const groupe = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  /** « 3 400 FCFA », comme formatAmountWithCurrency. */
  const francs = v => groupe(v) + ' FCFA';
  function parseMontant(s) {
    const t = String(s ?? '').replace(/[\s  ]/g, '').replace(',', '.');
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  const montantOuZero = s => parseMontant(s) ?? 0;
  /** Neuf chiffres, sans l'indicatif : IntentUtils.sanitizePhoneInput. */
  function nettoieTel(s) {
    let d = String(s ?? '').replace(/\D/g, '');
    if (d.startsWith('00221')) d = d.slice(5);
    else if (d.startsWith('221') && d.length > 9) d = d.slice(3);
    return d.slice(0, 9);
  }
  const telAffiche = s => {
    const d = nettoieTel(s);
    return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
  };
  const isAmount = (a, v) => Math.abs(a - v) < 0.5;
  function finDuJour(t, plus = 0) {
    const d = new Date(t); d.setDate(d.getDate() + plus); d.setHours(23, 59, 59, 999); return d.getTime();
  }
  function finDuMois(t) {
    const d = new Date(t); d.setMonth(d.getMonth() + 1, 0); d.setHours(23, 59, 59, 999); return d.getTime();
  }
  const memeJour = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  const fmt = (t, o) => new Intl.DateTimeFormat('fr-FR', o).format(new Date(t));
  const dateCourte = t => fmt(t, { day: 'numeric', month: 'short' });
  const dateMoyenne = t => fmt(t, { day: 'numeric', month: 'short', year: 'numeric' });
  const dateLongue = t => fmt(t, { day: 'numeric', month: 'long', year: 'numeric' });
  const majuscule = s => s.charAt(0).toUpperCase() + s.slice(1);
  const dateDuJour = t => majuscule(fmt(t, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  const dateCompacte = t => fmt(t, { day: '2-digit', month: '2-digit', year: 'numeric' });

  function h(tag, props, ...enfants) {
    const el = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.setAttribute('style', v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const e of enfants.flat(Infinity)) {
      if (e == null || e === false) continue;
      el.append(e.nodeType ? e : document.createTextNode(e));
    }
    return el;
  }

  // Les icônes Material de l'application, en chemins SVG.
  const P = {
    menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    retour: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    sortie: 'M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
    ajout: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    moins: 'M19 13H5v-2h14v2z',
    recherche: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    hausse: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',
    horloge: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    personne: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    groupe: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    billets: 'M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z',
    valide: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    coche: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    contact: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 8c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 8H8v-.57c0-.81.48-1.53 1.22-1.85.85-.37 1.79-.58 2.78-.58.99 0 1.93.21 2.78.58.74.32 1.22 1.04 1.22 1.85V18z',
    calendrier: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z',
    deplier: 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
    chevron: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    points: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    coupe: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z',
    ajoutPersonne: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    crayon: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    corbeille: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    actualiser: 'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
    document: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
    partage: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z',
    porteVoix: 'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z',
    ordre: 'M20 9H4v2h16V9zM4 15h16v-2H4v2z',
    tout: 'M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z',
    signet: 'M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z',
    categorie: 'M12 2l-5.5 9h11L12 2zm5.5 11c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zM3 21.5h8v-8H3v8z',
    paiement: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
    personnes: 'M16.5 13c-1.2 0-3.07.34-4.5 1-1.43-.67-3.3-1-4.5-1C5.33 13 1 14.08 1 16.25V19h22v-2.75c0-2.17-4.33-3.25-6.5-3.25zm-4 4.5h-10v-1.25c0-.54 2.56-1.75 5-1.75s5 1.21 5 1.75v1.25zm9 0H14v-1.25c0-.46-.2-.86-.52-1.22.88-.3 1.96-.53 3.02-.53 2.44 0 5 1.21 5 1.75v1.25zM7.5 12c1.93 0 3.5-1.57 3.5-3.5S9.43 5 7.5 5 4 6.57 4 8.5 5.57 12 7.5 12zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 5.5c1.93 0 3.5-1.57 3.5-3.5S18.43 5 16.5 5 13 6.57 13 8.5s1.57 3.5 3.5 3.5zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z'
  };
  const SVG = 'http://www.w3.org/2000/svg';
  function ic(nom, t = 24, style) {
    const s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', t); s.setAttribute('height', t);
    s.setAttribute('class', 'ico'); s.setAttribute('aria-hidden', 'true');
    if (style) s.setAttribute('style', style);
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', P[nom]);
    s.append(p);
    return s;
  }

  /**
   * Ce que dit un bouton que la leçon ne simule pas.
   *
   * Le visiteur ne connaît pas Juboo : un bouton qui ne répond pas, il croit l'avoir cassé. On lui
   * dit donc à quoi ce bouton sert dans l'application, puis pourquoi il ne fait rien ici — il
   * n'est pas au programme de cette leçon. Demandé par le vendeur (29/09/2026).
   */
  const HORS_LECON = {
    menu: 'Ce menu mène aux autres parties de Juboo : le bilan du mois, la caisse du soir, les réglages…',
    fournisseurs: 'Cet onglet tient ce que VOUS devez à vos fournisseurs : les livraisons prises à crédit.',
    stock: 'Cet onglet tient votre stock : vous recensez le rayon, Juboo calcule ce qui est sorti et ce qu\'il faut racheter.',
    contacts: 'Ce bouton reprend le nom et le numéro dans les contacts du téléphone. Ici, écrivez-les à la main.',
    partageClient: 'Ce bouton envoie au client, sur WhatsApp, une image de son compte : ce qu\'il a pris, ce qu\'il a payé.',
    releveClient: 'Ce bouton prépare le relevé du mois de ce client, à lui envoyer.',
    credit: 'Ce bouton note un nouvel achat à crédit pour ce client, sans le recréer.',
    tourneDeja: 'C\'est par ici qu\'on reprend une tontine commencée avant Juboo : le tour en cours, et qui a déjà reçu la cagnotte.',
    historiqueTontine: 'Ce bouton montre l\'historique de la tontine : chaque tour, qui a payé, qui a reçu la cagnotte.',
    ordre: 'Ce bouton montre l\'ordre de passage : qui reçoit la cagnotte, tour après tour.',
    partageOrdre: 'Ce bouton envoie l\'ordre de passage au groupe, sur WhatsApp.',
    rappel: 'Ce bouton prépare un rappel de collecte à envoyer aux membres, sur WhatsApp.',
    membre: 'Ce bouton ajoute les membres de la tontine, un par un, avec leur numéro.',
    ligneMembre: 'Chaque membre a ses boutons : noter sa cotisation, le relancer, lui donner une main de plus.',
    releveProche: 'Ce bouton montre tout ce que vous vous êtes prêté avec cette personne, dans les deux sens.',
    partagePret: 'Ce bouton envoie la fiche du prêt sur WhatsApp.',
    reglementPret: 'Ce bouton note un remboursement, même partiel.',
    reconnaissance: 'Ce bouton prépare une reconnaissance de dette, à signer par les deux personnes.'
  };
  /** Le message lui-même : ce que fait le bouton dans Juboo, puis pourquoi il ne fait rien ici. */
  function horsLecon(cle) {
    clearTimeout(UI.tempsToast);
    const texte = HORS_LECON[cle] || '';
    const carte = h('div', { class: 'hors-lecon', role: 'status', onclick: () => UI.toast.replaceChildren() },
      h('img', { src: 'assets/guide/attend.webp', alt: '' }),
      h('div', null,
        h('div', null, 'Dans l\'application, ' + texte.charAt(0).toLowerCase() + texte.slice(1)),
        h('b', null, 'Ce n\'est pas au programme de cette leçon.')));
    UI.toast.replaceChildren(carte);
    UI.tempsToast = setTimeout(() => UI.toast.replaceChildren(), Math.max(4500, texte.length * 60));
  }
  /** Le numéro du profil, dans le carnet d'exercice : « Je participe » en a besoin. */
  const MON_NUMERO = '770000001';

  // ============================================================================================
  // ÉTAT
  // ============================================================================================
  let L = null;          // la leçon
  let C = null;          // le carnet d'exercice
  let pile = [];         // les écrans ouverts, le dernier au-dessus
  let fenetres = [];     // les fenêtres ouvertes, la dernière au-dessus
  let prochainId = 1;
  const nid = () => prochainId++;
  const UI = {};

  const G = {
    phase: 'intro', etape: 0, essai: 0, partie: 0, revele: false,
    idx: 0, cle: '', cleBase: '', incise: null, correction: null, corriges: new Set(),
    ouvert: true, mainPassee: false, ficheOuverte: true, ficheFormOuverte: true,
    autoJoue: -1, dejaDit: new Set(), tape: false, clavier: false, avantFrappe: false,
    planRepli: '', t: {}, rappel: null, effacement: false, planEfface: ''
  };
  const etape = () => (G.phase === 'jeu' && L ? L.etapes[G.etape] : null);
  const cleEtape = () => G.partie + ':' + G.phase + ':' + G.etape + ':' + G.essai;
  const snap = () => ({
    clients: C.clients, transactions: C.transactions, tontines: C.tontines,
    members: C.members, loans: C.loans, now: Date.now()
  });
  const enPartie = () => G.phase === 'jeu' && !etape()?.autoPlay;

  // ============================================================================================
  // LE CARNET
  // ============================================================================================
  function carnetVide() { return { clients: [], transactions: [], tontines: [], members: [], loans: [] }; }

  function nouvelleCreance(clientId, amount, recu, description, echeance, methode = 'ESPECES') {
    const maintenant = Date.now();
    const solde = recu >= amount && amount > 0;
    return {
      id: nid(), clientId, amount, receivedAmount: recu, description, dueDate: echeance,
      status: solde ? 'PAID' : 'PENDING', createdAt: maintenant, paidAt: solde ? maintenant : null,
      lastPaymentMethod: recu > 0 ? methode : '', pickedBy: ''
    };
  }

  /** Le décor d'une étape, posé dans un carnet effacé — voir SceneDecor dans l'application. */
  function poserDecor(d) {
    C = carnetVide();
    const maintenant = Date.now();
    (d?.clients || []).forEach(c => {
      const cl = { id: nid(), name: c.name, phone: c.phone, tag: c.tag || 'Client', knownAs: '' };
      C.clients.push(cl);
      (c.transactions || []).forEach(t => C.transactions.push(
        nouvelleCreance(cl.id, t.amount, t.received || 0, t.label || '', finDuJour(maintenant, t.dueInDays ?? 7))
      ));
    });
    (d?.loans || []).forEach(l => C.loans.push({
      id: nid(), counterpartyName: l.name, phoneNumber: l.phone, amount: l.amount, receivedAmount: 0,
      startDate: maintenant, endDate: finDuJour(maintenant, l.dueInDays ?? 7), isLender: l.isLender,
      description: l.label || '', isPaid: false, versements: 1
    }));
  }
  function decorA(i) {
    const e = L.etapes[i];
    return e.decor !== undefined ? e.decor : (i === 0 ? (L.decor || null) : undefined);
  }

  /** Toute écriture passe par ici : le guide relit le carnet, l'écran se redessine. */
  function changer(fn) {
    fn();
    verifierNom();
    afficher();
  }

  // La petite erreur de nom, signalée puis réparée pour de bon — voir ClientFix.
  function verifierNom() {
    const e = etape();
    if (!e || !e.clientFix) return;
    const f = e.clientFix;
    const cible = f.pick(snap());
    if (!cible || G.corriges.has(cible.id) || f.accepts(cible.name)) return;
    G.corriges.add(cible.id);
    const ecrit = cible.name;
    cible.name = f.name;
    G.correction = f.says(ecrit);
  }

  // ============================================================================================
  // LA STRUCTURE : scène, téléphone, écrans, fenêtres
  // ============================================================================================
  function monter() {
    UI.scene = document.getElementById('scene');
    UI.hote = h('div', { class: 'hote' });
    UI.fenetres = h('div');
    UI.guide = h('div', { class: 'guide' });
    UI.notif = h('div');
    UI.toast = h('div');
    UI.tel = h('div', { class: 'tel' }, UI.hote, UI.guide, UI.fenetres, UI.notif, UI.toast);
    UI.scene.replaceChildren(UI.tel);
    monterGuide();
    cadrer();
    addEventListener('resize', cadrer);
    if (window.visualViewport) visualViewport.addEventListener('resize', cadrer);
    // Le clavier ouvert, le guide s'efface — comme dans l'application, où il couvrait des touches.
    UI.tel.addEventListener('focusin', e => { if (e.target.matches('input')) { G.clavier = true; majGuide(); } });
    UI.tel.addEventListener('focusout', e => {
      if (!e.target.matches('input')) return;
      setTimeout(() => {
        if (document.activeElement && UI.tel.contains(document.activeElement) && document.activeElement.matches('input')) return;
        G.clavier = false; majGuide();
      }, 60);
    });
  }

  /** Le téléphone fait 360 points de large, agrandi pour remplir la scène. */
  function cadrer() {
    const W = UI.scene.clientWidth, H = UI.scene.clientHeight;
    const k = W / 360;
    UI.tel.style.transform = 'scale(' + k + ')';
    UI.tel.style.height = (H / k) + 'px';
    placerMesures();
  }

  function toast(msg, long) {
    clearTimeout(UI.tempsToast);
    UI.toast.replaceChildren(h('div', { class: 'toast', role: 'status' }, msg));
    UI.tempsToast = setTimeout(() => UI.toast.replaceChildren(), long ? 3500 : 2000);
  }
  function montrerNotif(source, titre, texte) {
    UI.notif.replaceChildren(h('div', { class: 'notif', role: 'status' },
      h('span', { class: 'logo' }, source.charAt(0)),
      h('span', null, h('span', { class: 'source' }, source + ' · maintenant'), h('b', null, titre), h('span', { class: 'detail' }, texte))));
  }
  const cacherNotif = () => UI.notif.replaceChildren();

  function afficher() {
    const haut = pile[pile.length - 1];
    const defilement = UI.hote.querySelector('.defile')?.scrollTop || 0;
    const garde = haut._el && haut.garder;
    if (!garde) {
      haut._el = ECRANS[haut.nom](haut);
      UI.hote.replaceChildren(haut._el);
      const d = UI.hote.querySelector('.defile');
      if (d && haut._memeEcran) d.scrollTop = defilement;
      haut._memeEcran = true;
    }
    majGuide();
  }
  function aller(ecran) {
    pile.push(ecran);
    // Un écran d'ajout est un formulaire comme un autre : le guide y entre avec sa fiche.
    if (ecran.formulaire) signal('ouvert');
    afficher();
  }
  /** Ferme l'écran du dessus sans redessiner : celui qui appelle s'en charge. */
  function quitterEcran() {
    const parti = pile.pop();
    pile[pile.length - 1]._memeEcran = false;
    if (parti.formulaire) { clearTimeout(G.t.live); signal('ferme'); }
  }
  function retour() { if (pile.length > 1) { quitterEcran(); afficher(); } }
  function allerDepart() { pile = [{ nom: L.depart }]; afficher(); }
  /**
   * La porte de sortie. Dans l'application, elle quitte l'exercice d'un coup ; ici, un visiteur
   * qui la touche par curiosité perdrait sa partie sans comprendre : on lui demande d'abord.
   */
  function sortir() {
    const f = fenetre({
      titre: 'Quitter la leçon ?',
      corps: h('p', { style: 'margin:0' }, 'Cette porte fait sortir de l\'exercice. Vous reviendrez à la liste des leçons, et celle-ci recommencera depuis le début.'),
      pied: [
        h('button', { class: 'bouton-texte', onclick: () => f.fermer() }, 'Rester'),
        h('button', { class: 'plein', onclick: () => { location.href = 'index.html#lecons'; } }, 'Quitter')
      ]
    });
    ouvrir(f);
  }

  /**
   * Une fenêtre. Formulaire, elle accueille le guide comme dans l'application : le personnage calé
   * en haut, et la fiche de la situation juste dessous : ni l'un ni l'autre ne défile, on relit
   * la fiche sans remonter. Elle se replie d'un appui quand elle gêne.
   */
  function fenetre({ titre, noir, corps, pied, formulaire, surAnnuler, hauteurMax, classe }) {
    const bandeHote = formulaire ? h('div', { class: 'bande-hote' }) : null;
    const ficheHote = formulaire ? h('div', { class: 'fiche-hote' }) : null;
    const corpsEl = h('div', { class: 'corps', style: hauteurMax ? 'max-height:' + hauteurMax + 'px' : null }, corps);
    const dlg = h('div', { class: 'dlg ' + (classe || ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': titre || '' },
      titre ? h('h2', { class: noir ? 'noir' : '' }, titre) : null, bandeHote, ficheHote, corpsEl,
      pied ? h('div', { class: 'pied' }, pied) : null);
    const voile = h('div', { class: 'voile' }, dlg);
    const f = { voile, dlg, bandeHote, ficheHote, formulaire, corpsEl };
    f.fermer = (comment) => fermerFenetre(f, comment);
    voile.addEventListener('click', ev => { if (ev.target === voile) (surAnnuler || (() => f.fermer()))(); });
    return f;
  }
  function ouvrir(f) {
    fenetres.push(f);
    UI.fenetres.append(f.voile);
    if (f.formulaire) { G.ficheFormOuverte = true; signal('ouvert'); }
    majGuide();
  }
  function fermerFenetre(f, comment = 'ferme') {
    const i = fenetres.indexOf(f);
    if (i < 0) return;
    fenetres.splice(i, 1);
    f.voile.remove();
    // Un encouragement de frappe encore en attente n'a plus lieu d'être : le formulaire est
    // parti, et c'est la réaction à ce qu'il contenait qui doit s'afficher.
    if (f.formulaire) { clearTimeout(G.t.live); signal(comment); }
    majGuide();
  }
  function fermerTout() { fenetres.forEach(f => f.voile.remove()); fenetres = []; }
  const ecranFormulaire = () => !!pile[pile.length - 1]?.formulaire;
  const formulaireOuvert = () => fenetres.some(f => f.formulaire) || ecranFormulaire();
  /** Là où le guide parle quand un formulaire est ouvert : la fenêtre du dessus, ou l'écran d'ajout. */
  function hoteDuGuide() {
    const f = fenetres[fenetres.length - 1];
    if (f) return f.formulaire ? f : null;
    return ecranFormulaire() ? pile[pile.length - 1] : null;
  }

  // ============================================================================================
  // LES PIÈCES DE L'INTERFACE
  // ============================================================================================
  function barreApp() {
    return h('div', { class: 'barre-app' },
      h('button', { class: 'bouton-icone menu', 'aria-label': 'Menu', onclick: () => horsLecon('menu') }, ic('menu')),
      h('div', { class: 'nom' }, 'Juboo'),
      enPartie() ? h('button', { class: 'bouton-texte', onclick: recommencer }, 'Recommencer') : h('span'));
  }
  /** Là où la barre manque, « Recommencer » vit dans un bandeau — comme dans l'application. */
  function bandeau() {
    if (!enPartie()) return h('div', { class: 'espace-bandeau' });
    return h('div', { class: 'bandeau' }, h('span', null, 'Leçon : ' + L.titre),
      h('button', { class: 'bouton-texte', onclick: recommencer }, 'Recommencer'));
  }
  /** Pendant une leçon, la flèche devient la porte de sortie. */
  function enTete(titre, taille) {
    return h('div', { class: 'entete' },
      h('button', { class: 'bouton-icone', 'aria-label': 'Sortir de la simulation', onclick: sortir }, ic('sortie')),
      h('h1', { class: taille }, titre));
  }
  function barreDetail(titre, surRetour, ...actions) {
    return h('div', { class: 'barre-detail' },
      h('button', { class: 'bouton-icone', 'aria-label': 'Retour', onclick: surRetour }, ic('retour')),
      h('h1', null, titre), actions);
  }
  function etatVide({ icone, titre, message, action, surAction }) {
    return h('div', { class: 'vide' },
      icone ? h('div', { class: 'rond' }, ic(icone, 46)) : null,
      h('div', null, h('h2', null, titre), h('p', null, message)),
      action ? h('button', { class: 'principal', onclick: surAction }, ic('ajout'), action) : null);
  }

  /**
   * Le champ de saisie de l'application : libellé dans le champ tant qu'il est vide, puis sur le
   * trait du haut. Un champ téléphone se nettoie à la frappe et s'affiche « 77 123 45 67 ».
   */
  function champ({ lib, valeur = '', type = 'texte', aide, apres, placeholder, surSaisie, blanc }) {
    const input = h('input', {
      type: type === 'tel' ? 'tel' : 'text',
      inputmode: type === 'nombre' ? 'numeric' : type === 'tel' ? 'tel' : null,
      autocomplete: 'off', autocapitalize: type === 'texte' ? 'words' : 'off', spellcheck: 'false',
      placeholder: placeholder || null, 'aria-label': lib, enterkeyhint: 'done'
    });
    const boite = h('div', { class: 'champ' + (blanc ? ' sur-blanc' : '') },
      h('label', { class: 'lib' }, h('span', null, lib)), input, apres || null);
    const aideEl = aide != null ? h('div', { class: 'aide-champ' }, aide) : null;
    const racine = h('div', { class: 'pile' }, boite, aideEl);
    const lire = () => (type === 'tel' ? nettoieTel(input.value) : input.value);
    function etat() {
      const vide = input.value === '';
      const f = document.activeElement === input;
      boite.classList.toggle('focus', f);
      boite.classList.toggle('repos', vide && !f);
    }
    input.value = type === 'tel' ? telAffiche(valeur) : valeur;
    input.addEventListener('focus', () => { etat(); setTimeout(() => boite.scrollIntoView({ block: 'nearest' }), 350); });
    input.addEventListener('blur', etat);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
    input.addEventListener('input', () => {
      if (type === 'tel') { input.value = telAffiche(input.value); }
      etat();
      surSaisie && surSaisie(lire());
    });
    etat();
    return { racine, input, boite, aideEl, lire, ecrire(v) { input.value = type === 'tel' ? telAffiche(v) : v; etat(); } };
  }

  /** Les puces FilterChip, 32 points de haut dans une zone de toucher de 48. */
  function puces(options, choisie, surChoix) {
    const rangee = h('div', { class: 'puces' });
    let cur = choisie;
    function rendre() {
      rangee.replaceChildren(...options.map(([v, l]) => h('button', {
        type: 'button', class: 'puce' + (v === cur ? ' choisie' : ''), 'aria-pressed': String(v === cur),
        onclick: () => { cur = v; rendre(); surChoix && surChoix(v); }
      }, h('span', null, l))));
    }
    rendre();
    return { racine: rangee, lire: () => cur, ecrire(v) { cur = v; rendre(); } };
  }

  /** Un sélecteur de date du navigateur, posé invisible sur ce qui l'ouvre. */
  function surDate(el, valeur, surChoix) {
    const iso = t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const input = h('input', { type: 'date', class: 'date-cachee', value: iso(valeur), 'aria-label': 'Choisir une date' });
    input.addEventListener('click', () => { try { input.showPicker && input.showPicker(); } catch (_) { /* rien */ } });
    input.addEventListener('change', () => {
      if (!input.value) return;
      const [a, m, j] = input.value.split('-').map(Number);
      surChoix(new Date(a, m - 1, j, 12).getTime());
    });
    el.style.position = 'relative';
    el.append(input);
    return input;
  }
  /** Le même calendrier, ouvert depuis un bouton (une puce ne peut pas contenir de champ). */
  function choisirDate(valeur, surChoix) {
    const d = new Date(valeur);
    const input = h('input', { type: 'date', style: 'position:absolute;left:50%;top:50%;width:1px;height:1px;opacity:0',
      value: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') });
    UI.tel.append(input);
    input.addEventListener('change', () => {
      if (!input.value) return;
      const [a, m, j] = input.value.split('-').map(Number);
      surChoix(new Date(a, m - 1, j, 12).getTime());
    });
    input.addEventListener('blur', () => setTimeout(() => input.remove(), 500));
    try { if (input.showPicker) input.showPicker(); else { input.focus(); input.click(); } }
    catch (_) { input.focus(); input.click(); }
  }

  const MOYENS = [['ESPECES', 'Espèces'], ['WAVE', 'Wave'], ['ORANGE_MONEY', 'Orange Money']];
  function choixMoyen(label, choisi, surChoix) {
    const p = puces(MOYENS, choisi, surChoix);
    return { racine: h('div', { class: 'pile g8' }, h('div', { class: 'etiquette' }, label), p.racine), lire: p.lire };
  }

  // ============================================================================================
  // LE CAHIER
  // ============================================================================================
  const ETIQUETTES = ['Client', 'Client régulier', 'Client de passage', 'Famille', 'Ami', 'Voisin'];
  const ECHEANCES = [['TOMORROW', 'Demain'], ['IN_7_DAYS', 'Dans 7 jours'], ['END_OF_MONTH', 'Fin du mois'], ['SPECIFIC_DATE', 'Date précise']];
  function echeanceDe(type, precise) {
    const t = Date.now();
    if (type === 'TOMORROW') return finDuJour(t, 1);
    if (type === 'END_OF_MONTH') return finDuMois(t);
    if (type === 'SPECIFIC_DATE' && precise) return finDuJour(precise);
    return finDuJour(t, 7);
  }
  const resteDe = tx => Math.max(0, tx.amount - tx.receivedAmount);

  function ecranCahier(etat) {
    const encaisse = C.transactions.reduce((s, t) => s + t.receivedAmount, 0);
    const attente = C.transactions.filter(t => t.status === 'PENDING').reduce((s, t) => s + resteDe(t), 0);
    const liste = h('div');
    const input = h('input', { placeholder: 'Nom ou numéro du client', 'aria-label': 'Nom ou numéro du client', autocomplete: 'off', enterkeyhint: 'search', value: etat.q || '' });
    function remplir() {
      const q = (etat.q || '').trim().toLowerCase();
      const clients = C.clients.filter(c => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q.replace(/\s/g, '')));
      if (!clients.length) {
        // La marge de 16 de l'onglet « Mes Clients » s'ajoute à celle de l'état vide : sans
        // elle, la phrase se coupait ailleurs que dans l'application.
        liste.replaceChildren(h('div', { style: 'padding:0 16px' }, q
          ? etatVide({ icone: 'recherche', titre: 'Aucun résultat', message: 'Aucun client ne correspond à « ' + etat.q + ' ».' })
          : etatVide({
            icone: 'personne', titre: 'Votre carnet est vide',
            message: 'Ajoutez votre premier client pour commencer à noter ce qu\'on vous doit.',
            action: 'Ajouter un client', surAction: nouvelleEntree
          })));
        return;
      }
      liste.replaceChildren(h('div', { class: 'liste' }, clients.map(c => {
        const du = C.transactions.filter(t => t.clientId === c.id && t.status === 'PENDING').reduce((s, t) => s + resteDe(t), 0);
        return h('div', { class: 'carte client', role: 'button', tabindex: '0', onclick: () => aller({ nom: 'profil', id: c.id }) },
          h('div', { class: 'haut' },
            h('div', { class: 'initiale' }, c.name.trim().charAt(0).toUpperCase()),
            h('div', { style: 'flex:1;min-width:0' },
              h('div', { class: 'nom' }, c.name),
              h('div', { class: 'petit gris60' }, c.knownAs || (c.phone ? telAffiche(c.phone) : 'Pas de numéro'))),
            h('button', { class: 'badge', onclick: ev => { ev.stopPropagation(); fiabilite(); } }, 'Pas encore d\'historique')),
          du > 0 ? h('div', { class: 'du' }, francs(du)) : null);
      })));
    }
    input.addEventListener('input', () => { etat.q = input.value; remplir(); });
    remplir();
    return h('div', { class: 'ecran' },
      barreApp(), enTete('Cahier Digital', 't24'),
      h('div', { class: 'onglets-cahier' },
        h('button', { class: 'choisi' }, 'Clients'),
        h('button', { onclick: () => horsLecon('fournisseurs') }, 'Fournisseurs'),
        h('button', { onclick: () => horsLecon('stock') }, 'Stock')),
      h('div', { class: 'resume' },
        carteResume('hausse', '#2E7D32', 'rgba(46,125,50,.14)', 'Total Encaissé', francs(encaisse)),
        carteResume('horloge', '#F99F1B', 'rgba(249,159,27,.14)', 'En attente', francs(attente))),
      h('div', { class: 'recherche' }, ic('recherche', 24, 'color:#5C5347'), input),
      h('div', { class: 'defile' }, liste),
      h('button', { class: 'fab etendu', 'data-cible': 'ADD', onclick: nouvelleEntree }, ic('ajout'), 'Nouvelle Entrée'));
  }
  function carteResume(icone, teinte, fond, libelle, valeur) {
    return h('div', { class: 'carte' },
      h('div', { class: 'pastille', style: 'background:' + fond + ';color:' + teinte }, ic(icone, 18)),
      h('div', { style: 'min-width:0' }, h('div', { class: 'libelle' }, libelle), h('div', { class: 'valeur' }, valeur)));
  }

  /** « Nouvelle entrée » — AddClientDialog, champ pour champ. */
  function nouvelleEntree() {
    const nom = champ({ lib: 'Nom complet', surSaisie: v => frappe('CLIENT_NAME', v) });
    const tel = champ({ lib: 'Téléphone (facultatif)', type: 'tel', surSaisie: v => { frappe('CLIENT_PHONE', v); sansNumero.hidden = v !== ''; } });
    const sansNumero = h('div', { class: 'note-petite' }, 'Sans numéro, la dette se note quand même. Vous ne pourrez ni le relancer, ni voir son paiement arriver tout seul.');
    const repere = champ({ lib: 'Repère (facultatif)', placeholder: 'le tailleur, voisin de la mosquée…' });
    const tag = puces(ETIQUETTES.map(t => [t, t]), 'Client');
    const montant = champ({ lib: 'Montant total (FCFA)', type: 'nombre', aide: 'Le prix de tout ce qu\'il a pris', surSaisie: maj });
    const verse = champ({ lib: 'Déjà versé (FCFA)', type: 'nombre', aide: 'Laissez vide s\'il n\'a rien donné', surSaisie: maj });
    const resteVal = h('span', { style: 'font-size:12px;font-weight:900' });
    const reste = h('div', { class: 'ligne-entre' }, h('span', { style: 'font-size:12px;color:#888' }, 'Reste dû :'), resteVal);
    const moyen = choixMoyen('Reçu comment ?', 'ESPECES');
    const blocAcompte = h('div', { class: 'pile g8' }, reste, moyen.racine);
    const note = champ({ lib: 'Note / Article', placeholder: 'Ex: Crédit boutique, sac de riz...' });
    let precise = null;
    const ligneEcheance = h('div', { style: 'font-size:12px;line-height:16px;color:var(--orange)' });
    // « Date précise » ouvre le calendrier du téléphone.
    const quand = puces(ECHEANCES, 'IN_7_DAYS', v => {
      if (v === 'SPECIFIC_DATE') choisirDate(precise || Date.now() + 7 * 864e5, t => { precise = t; majEcheance(); });
      majEcheance();
    });
    const blocEcheance = h('div', { class: 'pile g8' }, h('div', { class: 'etiquette' }, 'À rembourser'), quand.racine, ligneEcheance);
    function majEcheance() { ligneEcheance.textContent = 'Échéance le ' + dateMoyenne(echeanceDe(quand.lire(), precise)); }
    function maj() {
      const du = montantOuZero(montant.lire()), v = montantOuZero(verse.lire());
      const trop = v > du && du > 0;
      verse.racine.hidden = !(du > 0);
      blocEcheance.hidden = !(du > 0);
      blocAcompte.hidden = !(v > 0 && !trop) || !(du > 0);
      verse.aideEl.textContent = trop ? 'Plus que le montant total. Reprenez.' : 'Laissez vide s\'il n\'a rien donné';
      verse.aideEl.classList.toggle('erreur-champ', trop);
      verse.boite.classList.toggle('erreur', trop);
      resteVal.textContent = francs(du - v);
      resteVal.style.color = du - v > 0 ? 'var(--rouge)' : 'var(--vert)';
    }
    maj(); majEcheance();

    const f = fenetre({
      titre: 'Nouvelle entrée', formulaire: true, surAnnuler: () => f.fermer('annule'),
      corps: h('div', { class: 'pile g16' },
        h('div', { class: 'pile g8' },
          h('div', { class: 'etiquette' }, 'Identité du client'),
          h('div', { style: 'display:flex;align-items:center' },
            h('div', { style: 'flex:1;min-width:0' }, nom.racine),
            h('button', { class: 'bouton-icone', 'aria-label': 'Contacts', style: 'color:var(--orange)', onclick: () => horsLecon('contacts') }, ic('contact'))),
          tel.racine, sansNumero, repere.racine),
        h('div', { class: 'pile g8' }, h('div', { class: 'etiquette' }, 'Catégorie'), tag.racine),
        h('div', { class: 'pile g8' }, h('div', { class: 'etiquette' }, 'Détails de la dette'),
          montant.racine, verse.racine, blocAcompte, note.racine, blocEcheance)),
      pied: [
        h('button', { class: 'bouton-texte', onclick: () => f.fermer('annule') }, 'Annuler'),
        h('button', { class: 'plein carre', onclick: enregistrer }, 'Enregistrer')
      ]
    });
    function enregistrer() {
      const n = nom.lire(), du = montantOuZero(montant.lire()), v = montantOuZero(verse.lire());
      if (!n.trim()) return toast('Il faut au moins un nom');
      if (v > du && du > 0) return toast('L\'acompte dépasse le montant total.', true);
      const cherche = n.trim().toLowerCase();
      const homonyme = cherche.length >= 3 ? C.clients.find(c => c.name.trim().toLowerCase() === cherche) : null;
      const valider = attache => {
        f.fermer();
        ajouterClient(n, tel.lire(), repere.lire(), tag.lire(), du, du > 0 ? v : 0, moyen.lire(), note.lire(), echeanceDe(quand.lire(), precise), attache);
      };
      if (homonyme) return homonymeDialogue(homonyme, valider);
      valider(null);
    }
    ouvrir(f);
  }

  function homonymeDialogue(deja, valider) {
    const cote = deja.knownAs || (deja.phone ? telAffiche(deja.phone) : '');
    const f = fenetre({
      titre: 'Vous connaissez déjà ce nom',
      corps: h('p', { style: 'margin:0;white-space:pre-line' },
        'Il y a déjà un « ' + deja.name + ' » dans votre cahier' + (cote ? ' — ' + cote : '') + '.\n\nC\'est la même personne, ou quelqu\'un d\'autre ?'),
      pied: [
        h('button', { class: 'bouton-texte', onclick: () => { f.fermer(); valider(null); } }, 'Quelqu\'un d\'autre'),
        h('button', { class: 'plein', onclick: () => { f.fermer(); valider(deja.id); } }, 'C\'est lui')
      ]
    });
    ouvrir(f);
  }

  function ajouterClient(nom, tel, repere, tag, montant, verse, moyen, note, echeance, attache) {
    const existant = attache ? C.clients.find(c => c.id === attache)
      : (tel ? C.clients.find(c => c.phone && c.phone === tel) : null);
    changer(() => {
      let cl = existant;
      if (!cl) { cl = { id: nid(), name: nom.trim(), phone: tel, tag, knownAs: repere.trim() }; C.clients.push(cl); }
      if (montant > 0) C.transactions.push(nouvelleCreance(cl.id, montant, verse, note.trim(), echeance, moyen));
    });
    if (existant) toast(attache ? 'Ajouté à la dette de ' + existant.name + '.' : 'Ce numéro existe déjà pour ' + existant.name + ' : la dette est ajoutée à son compte.', true);
    else toast('Client ajouté !');
  }

  /** La fiche d'un client : son ardoise, « Encaisser », et « Effacer cette ligne ». */
  function ecranProfil(etat) {
    const c = C.clients.find(x => x.id === etat.id);
    if (!c) { setTimeout(retour, 0); return h('div', { class: 'ecran' }); }
    const txs = C.transactions.filter(t => t.clientId === c.id);
    const du = txs.filter(t => t.status === 'PENDING').reduce((s, t) => s + resteDe(t), 0);
    const historique = txs.reduce((s, t) => s + t.amount, 0);
    const maintenant = Date.now();
    const aTemps = txs.filter(t => t.status === 'PAID' && (!t.paidAt || t.paidAt <= t.dueDate)).length;
    const retards = txs.filter(t => (t.status === 'PAID' && t.paidAt > t.dueDate) || (t.status !== 'PAID' && maintenant > t.dueDate && resteDe(t) > 0)).length;
    const stat = (lib, val, couleur) => h('div', { style: 'text-align:center' },
      h('div', { style: 'font-size:12px;line-height:16px;color:var(--var)' }, lib),
      h('div', { style: 'font-size:16px;line-height:24px;font-weight:700;color:' + (couleur || 'var(--var)') }, val));
    return h('div', { class: 'ecran' },
      bandeau(),
      h('div', { class: 'barre-detail' },
        h('button', { class: 'bouton-icone', 'aria-label': 'Retour', onclick: retour }, ic('retour')),
        h('h1', { style: 'font-weight:700' }, 'Profil Client'),
        h('button', { class: 'bouton-icone', 'aria-label': 'Partager la fiche du client', onclick: () => horsLecon('partageClient') }, ic('partage')),
        h('button', { class: 'bouton-icone', 'aria-label': 'Relevé du mois', onclick: () => horsLecon('releveClient') }, ic('calendrier')),
        h('button', { class: 'bouton-icone', 'aria-label': 'Supprimer le client', style: 'color:#B3261E', onclick: () => supprimerClient(c) }, ic('corbeille'))),
      h('div', { class: 'defile', style: 'padding:16px 16px calc(var(--bas) + 16px)' },
        h('div', { class: 'pile g16' },
          h('div', { style: 'text-align:center' },
            h('div', { style: 'font-size:24px;line-height:30px;font-weight:900' }, c.name),
            c.knownAs ? h('div', { style: 'font-size:16px;color:#888' }, c.knownAs) : null,
            h('div', { style: 'font-size:16px;line-height:24px;color:#888' }, c.phone ? telAffiche(c.phone) : 'Pas de numéro — relance impossible'),
            h('div', { style: 'margin-top:12px' }, h('button', { class: 'badge', onclick: fiabilite }, 'Pas encore d\'historique')),
            h('button', { onclick: () => etiquette(c), style: 'background:none;color:var(--encre);margin-top:8px;display:inline-flex;align-items:center;gap:8px;border:1px solid var(--contour);border-radius:8px;height:32px;padding:0 16px 0 8px;font-size:14px;font-weight:500' },
              ic('categorie', 18, 'color:var(--orange)'), c.tag)),
          h('button', { class: 'principal', style: 'width:100%', onclick: () => horsLecon('credit') }, ic('paiement'), 'Accorder un crédit'),
          h('div', { style: 'font-size:16px;line-height:24px;font-weight:700' }, 'Historique des transactions'),
          txs.length ? h('div', { class: 'pile g12' }, txs.map(t => ligneCreance(t, c)))
            : h('div', { style: 'color:var(--var)' }, 'Aucune opération pour ce client.'),
          h('div', { style: 'background:rgba(241,232,223,.5);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px' },
            h('div', { style: 'display:flex;justify-content:space-around' }, stat('Total dû', francs(du), du > 0 ? 'var(--rouge)' : null), stat('Total historique', francs(historique))),
            h('div', { style: 'height:1px;background:rgba(26,27,75,.1)' }),
            h('div', { style: 'display:flex;justify-content:space-around' }, stat('Payé à temps', String(aTemps), 'var(--vert)'), stat('Retards', String(retards), retards ? 'var(--rouge)' : null))))));
  }

  function ligneCreance(tx, client) {
    const paye = tx.status === 'PAID';
    const partiel = !paye && tx.receivedAmount > 0;
    const maintenant = Date.now();
    const retard = !paye && tx.dueDate < maintenant && resteDe(tx) > 0;
    const jours = Math.floor((maintenant - tx.dueDate) / 864e5);
    const [etiq, couleur] = paye ? ['Réglée', 'var(--vert)'] : retard && jours < 3 ? ['En retard', 'var(--orange)']
      : retard ? ['En retard depuis ' + jours + ' jours', 'var(--rouge)'] : partiel ? ['Acompte reçu', '#F9A825'] : ['En attente', null];
    return h('div', { class: 'carte', style: 'border-radius:16px;padding:16px;display:flex;align-items:center;gap:8px;cursor:pointer' + (paye ? ';background:#F8F8F8;box-shadow:none' : ''), onclick: () => detailCreance(tx, client) },
      h('div', { style: 'flex:1;min-width:0' },
        h('div', { style: 'display:flex;align-items:center;gap:8px;font-size:11px;line-height:16px;font-weight:700;color:' + (couleur || 'rgba(26,27,75,.6)') },
          h('span', { style: 'width:10px;height:10px;border-radius:50%;background:' + (couleur || '#fff') + (couleur ? '' : ';border:1px solid rgba(136,136,136,.5)') }), etiq),
        h('div', { style: 'font-size:16px;line-height:24px;font-weight:900;margin-top:4px;color:' + (paye ? '#888' : 'var(--encre)') }, francs(tx.amount)),
        h('div', { style: 'font-size:11px;line-height:16px;color:#888' }, dateMoyenne(tx.createdAt)),
        partiel ? h('div', { style: 'font-size:11px;line-height:16px;font-weight:700;color:#E65100' }, 'Reçu : ' + groupe(tx.receivedAmount) + ' sur ' + francs(tx.amount)) : null,
        tx.description ? h('div', { style: 'font-size:12px;line-height:16px;color:rgba(26,27,75,.7)' }, tx.description) : null),
      paye ? ic('tout', 20, 'color:#888')
        : h('button', { class: 'plein carre', style: 'background:var(--vert);padding:0 14px;display:flex;align-items:center;gap:6px;font-size:13px', onclick: ev => { ev.stopPropagation(); encaisser(tx); } }, ic('valide', 16), 'Encaisser'));
  }

  function encaisser(tx) {
    const total = resteDe(tx);
    const montant = champ({ lib: 'Montant reçu (FCFA)', type: 'nombre', valeur: String(Math.round(total)), surSaisie: maj });
    const apres = h('span', { style: 'font-weight:900' });
    const rac = (lib, v) => h('button', { type: 'button', class: 'puce', onclick: () => { montant.ecrire(String(v)); maj(); } }, h('span', null, lib));
    const moyen = choixMoyen('Reçu via', 'ESPECES');
    function maj() { const r = Math.max(0, total - montantOuZero(montant.lire())); apres.textContent = francs(r); apres.style.color = r > 0 ? 'var(--rouge)' : 'var(--vert)'; }
    maj();
    const f = fenetre({
      titre: 'Enregistrer un règlement', formulaire: true,
      corps: h('div', { class: 'pile g14' },
        h('div', { class: 'ligne-entre' }, h('span', { style: 'color:#888' }, 'Reste dû actuel :'), h('b', { style: 'color:var(--encre)' }, francs(total))),
        montant.racine,
        h('div', { class: 'puces' }, rac('Tout régler', Math.round(total)), rac('50%', Math.floor(total / 2)), rac('5 000 FCFA', 5000), rac('10 000 FCFA', 10000)),
        h('div', { class: 'ligne-entre' }, h('span', { style: 'font-size:12px;color:#888' }, 'Reste dû après ce règlement :'), apres),
        h('div', { style: 'height:1px;background:rgba(26,27,75,.1)' }),
        moyen.racine),
      pied: [
        h('button', { class: 'bouton-texte', onclick: () => f.fermer() }, 'Annuler'),
        h('button', { class: 'plein carre', onclick: () => {
          const m = montantOuZero(montant.lire());
          if (m <= 0) return;
          f.fermer();
          changer(() => {
            tx.receivedAmount = Math.min(tx.amount, tx.receivedAmount + m);
            tx.lastPaymentMethod = moyen.lire();
            if (tx.receivedAmount >= tx.amount) { tx.status = 'PAID'; tx.paidAt = Date.now(); }
          });
        } }, 'Enregistrer')
      ]
    });
    ouvrir(f);
  }

  function detailCreance(tx, client) {
    const ligne = (a, b, couleur) => h('div', { class: 'ligne-entre' }, h('span', { style: 'color:#888' }, a), h('b', { style: 'color:' + (couleur || 'var(--encre)') }, b));
    const f = fenetre({
      titre: 'Détails de l\'opération', noir: true,
      corps: h('div', { class: 'pile g16' },
        ligne('Montant :', francs(tx.amount)),
        ligne('Date :', fmt(tx.createdAt, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })),
        tx.receivedAmount > 0 ? ligne('Reçu à ce jour :', francs(tx.receivedAmount), 'var(--vert)') : null,
        tx.lastPaymentMethod ? ligne('Dernier règlement via :', (MOYENS.find(m => m[0] === tx.lastPaymentMethod) || [0, 'Espèces'])[1]) : null,
        tx.description ? h('div', { style: 'background:#E3F2FD;border-radius:12px;padding:16px' },
          h('div', { style: 'font-size:11px;font-weight:700;color:#1976D2' }, 'Note / Observation'),
          h('div', { style: 'margin-top:8px;color:var(--encre)' }, tx.description)) : null),
      pied: [
        h('button', { class: 'bouton-texte', style: 'color:var(--rouge)', onclick: () => {
          const c = fenetre({
            titre: 'Effacer cette ligne ?', noir: true,
            corps: h('div', { class: 'pile g8' },
              h('div', { style: 'color:var(--encre)' }, francs(tx.amount) + (tx.description ? ' — ' + tx.description : '')),
              h('div', { style: 'font-size:12px;line-height:16px' }, tx.receivedAmount > 0
                ? 'Les ' + francs(tx.receivedAmount) + ' déjà reçus sur cette ligne disparaîtront aussi.'
                : 'À n\'utiliser que pour une ligne notée par erreur.')),
            pied: [
              h('button', { class: 'bouton-texte', onclick: () => c.fermer() }, 'Annuler'),
              h('button', { class: 'plein carre rouge', onclick: () => {
                c.fermer(); f.fermer();
                changer(() => { C.transactions = C.transactions.filter(t => t !== tx); });
                toast('Ligne effacée.');
              } }, 'Effacer')
            ]
          });
          ouvrir(c);
        } }, 'Effacer cette ligne'),
        h('button', { class: 'plein carre', onclick: () => f.fermer() }, 'Fermer')
      ]
    });
    ouvrir(f);
  }

  /** La pastille de fiabilité, touchée : ce que Juboo sait de la façon dont ce client paie. */
  function fiabilite() {
    const f = fenetre({
      titre: 'Pas encore d\'historique',
      corps: h('p', { style: 'margin:0' }, 'Pas encore d\'historique avec cette personne. Juboo jugera sa fiabilité à la façon dont elle paie : à temps, en retard, ou pas du tout.'),
      pied: [h('button', { class: 'bouton-texte', onclick: () => f.fermer() }, 'OK')]
    });
    ouvrir(f);
  }

  /** « Client », « Voisin », « Famille »… : l'étiquette se change depuis la fiche. */
  function etiquette(c) {
    const f = fenetre({
      titre: 'Étiquette Relationnelle',
      corps: h('div', { class: 'pile' }, ETIQUETTES.map(t => h('button', {
        class: 'mode' + (t === c.tag ? ' choisi' : ''), style: 'padding:4px 0',
        onclick: () => { f.fermer(); changer(() => { c.tag = t; }); }
      }, h('div', { class: 'rangee' }, h('span', { class: 'radio' }, h('i')), t))))
    });
    ouvrir(f);
  }

  function supprimerClient(c) {
    const f = fenetre({
      titre: 'Supprimer le client ?',
      corps: h('p', { style: 'margin:0' }, 'Toutes les transactions associées seront également supprimées. Cette action est irréversible.'),
      pied: [
        h('button', { class: 'bouton-texte', onclick: () => f.fermer() }, 'Annuler'),
        h('button', { class: 'bouton-texte', style: 'color:#B3261E', onclick: () => {
          f.fermer();
          pile.pop();
          changer(() => {
            C.clients = C.clients.filter(x => x !== c);
            C.transactions = C.transactions.filter(t => t.clientId !== c.id);
          });
        } }, 'Supprimer')
      ]
    });
    ouvrir(f);
  }

  // ============================================================================================
  // LES TONTINES
  // ============================================================================================
  const MODES = [
    ['ORDERED', 'Ordre fixe', 'Chacun touche à son tour, dans l\'ordre fixé au départ. Juboo désigne le suivant tout seul.'],
    ['RANDOM', 'Tirage au sort', 'À chaque tour, Juboo tire le gagnant au hasard parmi ceux qui n\'ont pas encore touché.'],
    ['MANUAL', 'Désignation manuelle', 'À chaque tour, vous choisissez qui touche la cagnotte, selon les besoins du groupe.'],
    ['FLEXIBLE', 'Flexible', 'À chaque tour, vous décidez : tirer au sort, ou désigner vous-même.']
  ];
  const membresDe = t => C.members.filter(m => m.tontineId === t.id);

  function ecranTontines() {
    const corps = C.tontines.length
      ? h('div', { class: 'defile' }, h('div', { class: 'liste', style: 'padding-top:16px' }, C.tontines.map(t =>
        h('div', { class: 'carte', role: 'button', tabindex: '0', style: 'padding:20px;display:flex;align-items:center;gap:16px;cursor:pointer', onclick: () => aller({ nom: 'tontine', id: t.id }) },
          anneau(56, 5, 0, h('span', { style: 'font-size:11px;font-weight:700' }, '0%')),
          h('div', { style: 'flex:1;min-width:0' },
            h('div', { style: 'font-size:16px;line-height:24px;font-weight:700' }, t.name),
            h('div', { class: 'petit gris60' }, membresDe(t).length + '/' + t.totalShares + ' membres • ' + francs(t.contributionAmount) + '/' + (t.frequency === 'WEEKLY' ? 'sem.' : 'mois'))),
          ic('chevron', 20, 'color:rgba(26,27,75,.3)')))))
      : h('div', { class: 'defile centre' }, etatVide({
        icone: 'groupe', titre: 'Aucune tontine', message: 'Créez-en une, ou reprenez une tontine qui tourne déjà.',
        action: 'Créer ou reprendre une tontine', surAction: choixTontine
      }));
    return h('div', { class: 'ecran' }, barreApp(), enTete('Mes Tontines', 't22'), corps,
      h('button', { class: 'fab rond', 'data-cible': 'ADD', 'aria-label': 'Ajouter une tontine', onclick: choixTontine }, ic('ajout')));
  }
  function anneau(taille, trait, part, centre) {
    const r = (taille - trait) / 2, tour = 2 * Math.PI * r;
    const s = document.createElementNS(SVG, 'svg');
    s.setAttribute('width', taille); s.setAttribute('height', taille); s.setAttribute('style', 'position:absolute;inset:0');
    s.innerHTML = '<circle cx="' + taille / 2 + '" cy="' + taille / 2 + '" r="' + r + '" fill="none" stroke="#F4EDE4" stroke-width="' + trait + '"/>' +
      (part > 0 ? '<circle cx="' + taille / 2 + '" cy="' + taille / 2 + '" r="' + r + '" fill="none" stroke="#F99F1B" stroke-width="' + trait + '" stroke-linecap="round" stroke-dasharray="' + tour * part + ' ' + tour + '" transform="rotate(-90 ' + taille / 2 + ' ' + taille / 2 + ')"/>' : '');
    return h('div', { style: 'position:relative;width:' + taille + 'px;height:' + taille + 'px;display:grid;place-items:center;flex:none' }, s, h('div', { style: 'position:relative;text-align:center' }, centre));
  }

  /** « Est-ce que des tours ont déjà eu lieu ? » — posé avant le formulaire. */
  function choixTontine() {
    const f = fenetre({
      titre: 'Ajouter une tontine', noir: true, formulaire: true,
      corps: h('div', { class: 'pile g16' },
        h('div', null, 'Est-ce que des tours ont déjà eu lieu dans cette tontine ?'),
        h('button', { class: 'principal', style: 'width:100%', onclick: () => { f.fermer(); nouvelleTontine(); } }, 'Non, elle commence'),
        h('div', { style: 'font-size:12px;line-height:16px;color:rgba(26,27,75,.6)' }, 'Vous choisirez la date de la première collecte, même si c\'est dans plusieurs jours.'),
        h('button', { class: 'secondaire', onclick: () => horsLecon('tourneDeja') }, 'Oui, elle tourne déjà'),
        h('div', { style: 'font-size:12px;line-height:16px;color:rgba(26,27,75,.6)' }, 'Vous saisirez le tour en cours et qui a déjà reçu la cagnotte.')),
      pied: [h('button', { class: 'bouton-texte', onclick: () => f.fermer() }, 'Annuler')]
    });
    ouvrir(f);
  }

  function selecteurMode(choisi) {
    let cur = choisi, ouvert = false;
    const racine = h('div', { class: 'modes' });
    function rendre() {
      racine.classList.toggle('ouvert', ouvert);
      const m = MODES.find(x => x[0] === cur);
      racine.replaceChildren(
        h('button', { type: 'button', class: 'tete', 'aria-expanded': String(ouvert), onclick: () => { ouvert = !ouvert; rendre(); } },
          h('div', { style: 'flex:1' },
            h('div', { style: 'font-size:12px;line-height:16px;color:rgba(26,27,75,.6)' }, 'Qui touche la cagnotte ?'),
            h('div', { style: 'font-size:16px;line-height:24px;font-weight:700' }, m[1])),
          ic('deplier')),
        ouvert ? h('div', { class: 'liste-modes' }, MODES.map(([v, lib, desc]) =>
          h('button', { type: 'button', class: 'mode' + (v === cur ? ' choisi' : ''), onclick: () => { cur = v; rendre(); } },
            h('div', { class: 'rangee' }, h('span', { class: 'radio' }, h('i')), lib),
            v === cur ? h('p', null, desc) : null))) : '');
    }
    rendre();
    return { racine, lire: () => cur };
  }
  function champAmende(valeur = '') {
    const c = champ({ lib: 'Amende par retard (facultatif, FCFA)', type: 'nombre', valeur });
    return { racine: h('div', { class: 'pile', style: 'gap:4px' }, c.racine, h('div', { style: 'font-size:12px;line-height:16px;color:rgba(26,27,75,.6)' }, 'Due pour chaque tour payé après la date de collecte. Elle est gardée à part de la cagnotte.')), lire: c.lire };
  }

  /** « Nouvelle Tontine » — AddTontineDialog. */
  function nouvelleTontine() {
    const nom = champ({ lib: 'Nom de la tontine' });
    const montant = champ({ lib: 'Cotisation par membre (FCFA)', type: 'nombre', surSaisie: maj });
    const freq = puces([['WEEKLY', 'Hebdomadaire'], ['MONTHLY', 'Mensuelle']], 'WEEKLY');
    let date = Date.now();
    const dateTitre = h('div', { style: 'font-size:16px;line-height:24px;font-weight:700' });
    const dateAide = h('div', { style: 'font-size:12px;line-height:16px;color:rgba(26,27,75,.6)' });
    const surfaceDate = h('div', { class: 'surface', role: 'button' }, ic('calendrier', 20, 'color:var(--orange)'), h('div', { style: 'flex:1' }, dateTitre, dateAide));
    function majDate() {
      dateTitre.textContent = dateDuJour(date);
      dateAide.textContent = memeJour(date, Date.now()) ? 'Aujourd\'hui. Touchez pour choisir un autre jour.' : 'Touchez pour changer.';
    }
    majDate();
    surDate(surfaceDate, date, t => { date = t; majDate(); });
    const gestionnaire = champ({ lib: 'Numéro Wave/OM du gestionnaire', type: 'tel' });
    const mains = champ({ lib: 'Nombre de mains', type: 'nombre', valeur: '5', surSaisie: maj });
    const cagnotte = h('div', { style: 'font-size:12px;line-height:16px;font-weight:700;color:var(--orange)' });
    let participe = false;
    const monNom = champ({ lib: 'Votre nom (affiché aux autres membres)', valeur: 'Moi' });
    const caseCochee = h('i');
    const surfaceMoi = h('button', { type: 'button', class: 'surface', onclick: () => { participe = !participe; majMoi(); } },
      h('span', { class: 'case' }, caseCochee),
      h('div', null,
        h('div', { style: 'font-size:16px;line-height:24px;font-weight:700' }, 'Je participe aussi à cette tontine'),
        h('div', { style: 'font-size:12px;line-height:16px;color:rgba(26,27,75,.6)' }, 'Vous serez ajouté(e) comme membre, avec votre numéro enregistré.')));
    function majMoi() {
      surfaceMoi.classList.toggle('cochee', participe);
      caseCochee.replaceChildren(participe ? ic('coche', 16) : '');
      monNom.racine.hidden = !participe;
    }
    majMoi();
    const mode = selecteurMode('ORDERED');
    const amende = champAmende();
    function maj() {
      const n = parseInt(mains.lire(), 10) || 0, m = montantOuZero(montant.lire());
      cagnotte.hidden = !(n > 0 && m > 0);
      cagnotte.textContent = 'Cagnotte de chaque tour : ' + francs(m * n) + ' · ' + n + ' tour' + (n > 1 ? 's' : '');
    }
    maj();
    const f = fenetre({
      titre: 'Nouvelle Tontine', noir: true, formulaire: true, hauteurMax: 480,
      corps: h('div', { class: 'pile g12' },
        nom.racine, montant.racine,
        h('div', { class: 'etiquette l' }, 'Fréquence'), freq.racine,
        h('div', { class: 'etiquette l' }, 'Première collecte'), surfaceDate,
        gestionnaire.racine, mains.racine,
        h('div', { style: 'font-size:12px;line-height:16px;color:rgba(26,27,75,.6)' }, 'Une main = une cotisation et un tour. 10 mains font 10 tours. Une personne peut en prendre plusieurs, ou en partager une à deux.'),
        cagnotte, surfaceMoi, monNom.racine,
        h('div', { class: 'etiquette l' }, 'Mode de désignation'), mode.racine, amende.racine),
      pied: [
        h('button', { class: 'bouton-texte', onclick: () => f.fermer() }, 'Annuler'),
        h('button', { class: 'plein', onclick: () => {
          const n = parseInt(mains.lire(), 10) || 0, cotisation = montantOuZero(montant.lire());
          if (!nom.lire().trim()) return toast('Donnez un nom à la tontine.');
          if (cotisation <= 0) return toast('Indiquez le montant de la cotisation.');
          if (n <= 0) return toast('Indiquez le nombre de mains.');
          f.fermer();
          changer(() => {
            const t = {
              id: nid(), name: nom.lire().trim(), contributionAmount: cotisation, frequency: freq.lire(),
              startDate: finDuJour(date), totalMembers: n, totalShares: n, paymentIdentifier: gestionnaire.lire(),
              selectionMode: mode.lire(), amendeRetard: montantOuZero(amende.lire())
            };
            C.tontines.push(t);
            if (participe) C.members.push({ id: nid(), tontineId: t.id, name: monNom.lire().trim() || 'Moi', phoneNumber: MON_NUMERO, payoutOrder: 1 });
          });
        } }, 'Créer')
      ]
    });
    ouvrir(f);
  }

  function ecranTontine(etat) {
    const t = C.tontines.find(x => x.id === etat.id);
    if (!t) { setTimeout(retour, 0); return h('div', { class: 'ecran' }); }
    const membres = membresDe(t);
    const cible = t.contributionAmount * t.totalShares;
    const libres = t.totalShares - membres.length;
    const beneficiaire = t.selectionMode === 'ORDERED' ? membres.find(m => m.payoutOrder === 1) : null;
    const menu = h('div', { hidden: true });
    function ouvrirMenu() {
      const item = (icone, lib, action, danger) => h('button', { class: danger ? 'danger' : '', onclick: () => { menu.hidden = true; action(); } }, ic(icone, 24), lib);
      menu.replaceChildren(
        h('div', { style: 'position:absolute;inset:0;z-index:24', onclick: () => { menu.hidden = true; } }),
        h('div', { class: 'menu-deroulant', role: 'menu' },
          item('actualiser', 'Actualiser', () => toast('Actualisation...')),
          item('document', 'Historique de la tontine', () => horsLecon('historiqueTontine')),
          t.selectionMode === 'ORDERED' ? item('ordre', 'Ordre de passage', () => horsLecon('ordre')) : null,
          t.selectionMode === 'ORDERED' ? item('partage', 'Partager l\'ordre de passage', () => horsLecon('partageOrdre')) : null,
          item('crayon', 'Modifier la tontine', () => modifierTontine(t)),
          item('corbeille', 'Dissoudre la tontine', () => dissoudre(t), true)));
      menu.hidden = false;
    }
    const bouton = (icone, lib, cle) => h('button', { class: 'contour', style: 'height:40px', onclick: () => horsLecon(cle) }, ic(icone, 18), lib);
    return h('div', { class: 'ecran' },
      bandeau(),
      barreDetail(t.name, retour, h('button', { class: 'bouton-icone', 'aria-label': 'Actions', onclick: ouvrirMenu }, ic('points'))),
      menu,
      h('div', { class: 'defile', style: 'padding:16px 16px calc(var(--bas) + 96px)' },
        h('div', { class: 'pile g16' },
          h('div', { class: 'carte', style: 'border-radius:28px;padding:24px 0;display:flex;flex-direction:column;align-items:center' },
            h('div', { style: 'background:rgba(249,159,27,.12);border-radius:999px;padding:6px 16px;color:var(--orange);font-weight:900;font-size:14px' }, 'TOUR 1 / ' + t.totalShares),
            h('div', { style: 'height:16px' }),
            anneau(194, 14, 0, h('div', null,
              h('div', { style: 'font-size:36px;line-height:44px;font-weight:900' }, '0%'),
              h('div', { style: 'font-size:14px;line-height:20px' }, '0 sur ' + francs(cible)),
              h('div', { style: 'font-size:12px;line-height:16px;font-weight:700' }, 'Il manque ' + francs(cible)))),
            libres > 0 ? h('div', { style: 'margin-top:10px;font-size:12px;line-height:16px;font-weight:700;color:rgba(26,27,75,.6);text-align:center;padding:0 16px' },
              libres + ' main' + (libres > 1 ? 's' : '') + ' libre' + (libres > 1 ? 's' : '') + ' — c\'est ce qui manque à la cagnotte') : null,
            h('div', { style: 'height:14px' }),
            beneficiaire ? h('div', { style: 'display:flex;align-items:center;gap:6px;color:var(--vert);font-weight:700;font-size:16px' }, ic('coupe', 18), 'Bénéficiaire : ' + beneficiaire.name)
              : h('div', { style: 'font-size:12px;color:rgba(26,27,75,.5)' }, 'Bénéficiaire pas encore désigné')),
          h('div', { class: 'carte', style: 'padding:20px;display:flex;flex-direction:column;gap:12px' },
            h('div', { style: 'font-size:16px;font-weight:900' }, 'Gestion du Tour'),
            h('div', { style: 'font-size:14px;font-weight:700;color:var(--var)' }, 'Collecte prévue le ' + dateLongue(t.startDate)),
            membres.length ? bouton('porteVoix', 'Rappeler la collecte', 'rappel') : null,
            t.selectionMode === 'ORDERED' ? bouton('ordre', 'Ordre de passage', 'ordre') : null),
          h('div', { style: 'display:flex;align-items:center;justify-content:space-between' },
            h('div', { style: 'font-size:16px;font-weight:900' }, 'Membres (' + membres.length + ')')),
          membres.length ? membres.map(m => h('div', { class: 'carte', role: 'button', onclick: () => horsLecon('ligneMembre'), style: 'padding:14px;display:flex;align-items:center;gap:12px;border-radius:16px;cursor:pointer' },
            h('div', { class: 'initiale' }, m.name.charAt(0).toUpperCase()),
            h('div', { style: 'flex:1' }, h('div', { style: 'font-weight:700' }, m.name), h('div', { class: 'petit gris60' }, '1 main · pas encore payé'))))
            : etatVide({ icone: 'groupe', titre: 'Aucun membre pour l\'instant', message: 'Ajoutez les personnes qui cotisent à cette tontine. Un nom et un numéro suffisent.' }))),
      h('button', { class: 'fab rond', 'aria-label': 'Ajouter un membre', onclick: () => horsLecon('membre') }, ic('ajoutPersonne')));
  }

  /** « Modifier la Tontine » : la cotisation se corrige ici ; le nombre de mains, jamais. */
  function modifierTontine(t) {
    const nom = champ({ lib: 'Nom', valeur: t.name });
    const montant = champ({ lib: 'Cotisation par membre (FCFA)', type: 'nombre', valeur: String(Math.round(t.contributionAmount)) });
    const freq = puces([['WEEKLY', 'Hebdomadaire'], ['MONTHLY', 'Mensuelle']], t.frequency);
    const mode = selecteurMode(t.selectionMode);
    const amende = champAmende(t.amendeRetard > 0 ? String(Math.round(t.amendeRetard)) : '');
    const f = fenetre({
      titre: 'Modifier la Tontine', noir: true, hauteurMax: 480,
      corps: h('div', { class: 'pile g12' }, nom.racine, montant.racine,
        h('div', { class: 'etiquette l' }, 'Fréquence'), freq.racine,
        h('div', { class: 'etiquette l' }, 'Mode de désignation'), mode.racine, amende.racine),
      pied: [
        h('button', { class: 'bouton-texte', onclick: () => f.fermer() }, 'Annuler'),
        h('button', { class: 'plein', onclick: () => {
          f.fermer();
          changer(() => {
            t.name = nom.lire(); t.contributionAmount = parseMontant(montant.lire()) ?? t.contributionAmount;
            t.frequency = freq.lire(); t.selectionMode = mode.lire(); t.amendeRetard = montantOuZero(amende.lire());
          });
        } }, 'Enregistrer')
      ]
    });
    ouvrir(f);
  }
  function dissoudre(t) {
    const f = fenetre({
      titre: 'Dissoudre la tontine ?',
      corps: h('p', { style: 'margin:0' }, 'Cette action est irréversible. Toutes les données de cette tontine seront supprimées.'),
      pied: [
        h('button', { class: 'bouton-texte', onclick: () => f.fermer() }, 'Annuler'),
        h('button', { class: 'plein danger', onclick: () => {
          f.fermer();
          pile.pop();
          changer(() => { C.tontines = C.tontines.filter(x => x !== t); C.members = C.members.filter(m => m.tontineId !== t.id); });
        } }, 'Dissoudre')
      ]
    });
    ouvrir(f);
  }

  // ============================================================================================
  // LES PRÊTS
  // ============================================================================================
  function segments(index, surChoix, cible) {
    return h('div', { class: 'segments', 'data-cible': cible || null, role: 'tablist' },
      ['Je dois', 'On me doit'].map((lib, i) => h('button', {
        class: i === index ? 'choisi' : '', role: 'tab', 'aria-selected': String(i === index), onclick: () => surChoix(i)
      }, i === index ? ic('coche', 18) : null, lib)));
  }
  /** Les prêts d'une même personne, d'un même côté, regroupés — GroupedLoan. */
  function groupes(cote) {
    const g = new Map();
    C.loans.filter(l => l.isLender === cote && !l.isPaid).forEach(l => {
      const cle = l.phoneNumber || ('nom:' + l.counterpartyName.trim().toLowerCase());
      if (!g.has(cle)) g.set(cle, { cle, phone: l.phoneNumber, noms: [], prets: [], isLender: cote });
      const x = g.get(cle);
      if (!x.noms.includes(l.counterpartyName)) x.noms.push(l.counterpartyName);
      x.prets.push(l);
    });
    return [...g.values()];
  }

  function ecranPrets(etat) {
    if (etat.onglet == null) etat.onglet = 1;
    const cote = etat.onglet === 1;
    const liste = groupes(cote);
    const ouvrirFormulaire = pret => { G.ficheFormOuverte = true; aller({ nom: 'pretForm', pret, garder: true, formulaire: true }); };
    let corps;
    if (!liste.length) {
      corps = h('div', { class: 'defile' }, cote
        ? etatVide({ icone: 'billets', titre: 'Personne ne vous doit rien', message: 'Notez un prêt dès que vous avancez de l\'argent à quelqu\'un.', action: 'Noter un prêt', surAction: () => ouvrirFormulaire(true) })
        : etatVide({ icone: 'valide', titre: 'Vous ne devez rien', message: 'Aucun emprunt en cours. Notez-en un si vous empruntez à un proche.', action: 'Noter un emprunt', surAction: () => ouvrirFormulaire(false) }));
    } else {
      corps = h('div', { class: 'defile' },
        !cote ? h('div', { style: 'margin:8px 16px;background:rgba(46,125,50,.1);border-radius:12px;padding:12px;display:flex;align-items:center;gap:12px;color:var(--vert);font-size:12px;font-weight:700' },
          h('span', { style: 'width:8px;height:8px;border-radius:50%;background:var(--vert)' }), 'Ma discipline : 100% de mes dettes à jour') : null,
        h('div', { class: 'liste', style: 'padding-top:16px' }, liste.map(g => {
          const total = g.prets.reduce((s, l) => s + Math.max(0, l.amount - l.receivedAmount), 0);
          const prochaine = Math.min(...g.prets.map(l => l.versements > 1 ? l.premiereEcheance : l.endDate));
          const plusieurs = g.prets.some(l => l.versements > 1);
          return h('div', { class: 'carte', role: 'button', tabindex: '0', style: 'padding:20px;display:flex;align-items:center;gap:8px;cursor:pointer', onclick: () => aller({ nom: 'pretDetail', cle: g.cle, isLender: cote }) },
            h('div', { style: 'flex:1;min-width:0' },
              h('div', { style: 'font-size:16px;line-height:24px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis' }, g.noms.join(', ')),
              h('div', { style: 'display:inline-block;margin:4px 0;background:rgba(142,142,147,.1);border-radius:4px;padding:2px 6px;font-size:9px;font-weight:700;color:var(--gris)' }, 'Pas encore d\'historique'),
              h('div', { class: 'petit gris60' }, g.phone ? telAffiche(g.phone) : 'Pas de numéro'),
              h('div', { style: 'font-size:12px;line-height:16px;font-weight:500;color:rgba(26,27,75,.7)' },
                (plusieurs ? 'Prochain versement le ' : 'À rendre le ') + dateCourte(prochaine))),
            h('div', { style: 'display:flex;align-items:center' },
              h('span', { style: 'font-size:18px;line-height:24px;font-weight:900;color:' + (cote ? 'var(--vert)' : 'var(--rouge)') }, francs(total)),
              ic('deplier', 24, 'color:rgba(26,27,75,.3)')));
        })));
    }
    return h('div', { class: 'ecran' }, barreApp(), enTete('Prêts et emprunts', 't28'),
      segments(etat.onglet, i => { etat.onglet = i; afficher(); }, 'TABS'), corps,
      h('button', { class: 'fab grand', 'data-cible': 'ADD', 'aria-label': 'Noter un prêt', onclick: () => ouvrirFormulaire(cote) }, ic('ajout', 24)));
  }

  function champPret(lib, placeholder, type, surSaisie) {
    const input = h('input', {
      type: type === 'tel' ? 'tel' : 'text', inputmode: type === 'nombre' ? 'numeric' : type === 'tel' ? 'tel' : null,
      placeholder, autocomplete: 'off', autocapitalize: type ? 'off' : 'words', spellcheck: 'false', 'aria-label': lib, enterkeyhint: 'done'
    });
    input.addEventListener('input', () => { if (type === 'tel') input.value = telAffiche(input.value); surSaisie && surSaisie(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
    input.addEventListener('focus', () => setTimeout(() => input.scrollIntoView({ block: 'center' }), 350));
    const titre = h('div', { class: 'titre-champ' }, lib);
    return { racine: h('div', { class: 'champ-pret' }, titre, h('div', { class: 'boite' }, input)), titre, input, lire: () => (type === 'tel' ? nettoieTel(input.value) : input.value) };
  }

  /** « Suivi des prêts » : un écran entier, avec les deux côtés en haut — AddLoanScreen. */
  function ecranPretForm(etat) {
    let preteur = etat.pret;
    const nom = champPret('', 'Ex : Modou Fall');
    const tel = champPret('Numéro de téléphone', '7X XXX XX XX', 'tel');
    const montant = champPret('Montant (FCFA)', '10000', 'nombre', majEcheancier);
    const note = champPret('Note (optionnel)', 'Ex : Pour l\'achat du mouton');
    let plusieurs = false, nombre = 3, rythme = 'MENSUEL';
    let echeance = Date.now() + 7 * 864e5;
    const rembourse = puces([[false, 'En une fois'], [true, 'En plusieurs fois']], false, v => { plusieurs = v; majEcheancier(); });
    const titreDate = h('div', { class: 'titre-champ', style: 'font-size:14px;line-height:20px;font-weight:700;color:rgba(26,27,75,.6)' });
    const texteDate = h('span');
    const boutonDate = h('div', { class: 'contour', role: 'button', style: 'margin-top:6px' }, ic('horloge', 18), texteDate);
    surDate(boutonDate, echeance, t => { echeance = t; majEcheancier(); });
    const echeancier = h('div', { class: 'pile g8' });
    function dates() {
      const premiere = finDuJour(echeance);
      return Array.from({ length: plusieurs ? nombre : 1 }, (_, i) => {
        const d = new Date(premiere);
        if (rythme === 'HEBDO') d.setDate(d.getDate() + 7 * i); else d.setMonth(d.getMonth() + i);
        return d.getTime();
      });
    }
    function majEcheancier() {
      titreDate.textContent = plusieurs ? 'Date du premier versement' : 'Échéance de remboursement';
      texteDate.textContent = dateLongue(echeance);
      echeancier.hidden = !plusieurs;
      if (!plusieurs) return;
      const m = montantOuZero(montant.lire());
      const part = Math.floor(m / nombre);
      const ds = dates();
      echeancier.replaceChildren(
        h('div', { style: 'display:flex;align-items:center' },
          h('button', { class: 'bouton-icone', 'aria-label': 'Un versement de moins', disabled: nombre <= 2 ? true : null, onclick: () => { nombre = Math.max(2, nombre - 1); majEcheancier(); } }, ic('moins')),
          h('b', { style: 'padding:0 4px' }, nombre + ' versements'),
          h('button', { class: 'bouton-icone', 'aria-label': 'Un versement de plus', onclick: () => { nombre = Math.min(12, nombre + 1); majEcheancier(); } }, ic('ajout'))),
        puces([['HEBDO', 'Chaque semaine'], ['MENSUEL', 'Chaque mois']], rythme, v => { rythme = v; majEcheancier(); }).racine,
        m > 0 ? h('div', { style: 'font-size:12px;line-height:16px;font-weight:700;color:var(--orange);white-space:pre-line' },
          ds.map((d, i) => (i + 1) + '. ' + francs(i === nombre - 1 ? m - part * (nombre - 1) : part) + ' le ' + dateCourte(d)).join('\n')) : '');
    }
    majEcheancier();
    const cote = h('div');
    function majCote() {
      nom.titre.textContent = preteur ? 'Qui vous doit de l\'argent ?' : 'À qui devez-vous de l\'argent ?';
      nom.input.setAttribute('aria-label', nom.titre.textContent);
      cote.replaceChildren(segments(preteur ? 1 : 0, i => { preteur = i === 1; majCote(); }));
    }
    majCote();
    const ajouter = () => {
      const m = montantOuZero(montant.lire());
      if (!nom.lire() || m <= 0) return toast('Veuillez remplir le nom et le montant');
      const ds = dates();
      const pret = {
        id: nid(), counterpartyName: nom.lire(), phoneNumber: tel.lire(), amount: m, receivedAmount: 0,
        startDate: Date.now(), endDate: ds[ds.length - 1], isLender: preteur, description: note.lire(), isPaid: false,
        versements: plusieurs ? nombre : 1, premiereEcheance: plusieurs ? ds[0] : 0
      };
      // Retour à la liste, sur l'onglet d'où l'on venait : un prêt noté du mauvais côté ne s'y
      // voit pas, et c'est justement ce que le guide fera remarquer.
      quitterEcran();
      changer(() => C.loans.push(pret));
    };
    etat.bandeHote = h('div', { class: 'bande-hote ecran-bande' });
    etat.ficheHote = h('div', { class: 'fiche-hote' });
    return h('div', { class: 'ecran' },
      bandeau(),
      h('div', { class: 'barre-detail' },
        h('button', { class: 'bouton-icone', 'aria-label': 'Retour', onclick: retour }, ic('retour')),
        h('h1', { style: 'font-weight:700' }, 'Suivi des prêts')),
      etat.bandeHote, etat.ficheHote,
      h('div', { class: 'defile', style: 'padding:16px 16px calc(var(--bas) + 16px)' },
        h('div', { class: 'pile g16' },
          h('div', { style: 'margin:-8px -16px' }, cote),
          h('div', { class: 'carte', style: 'border-radius:24px;padding:24px;display:flex;flex-direction:column;gap:16px' },
            h('div', { style: 'display:flex;align-items:flex-end' },
              h('div', { style: 'flex:1;min-width:0' }, nom.racine),
              h('button', { class: 'bouton-icone', 'aria-label': 'Sélectionner un contact', style: 'color:var(--orange);margin-bottom:4px', onclick: () => horsLecon('contacts') }, ic('contact'))),
            tel.racine, montant.racine, note.racine,
            h('div', { class: 'pile g8' }, h('div', { style: 'font-size:14px;line-height:20px;font-weight:700;color:rgba(26,27,75,.6)' }, 'Remboursement'), rembourse.racine),
            h('div', null, titreDate, boutonDate),
            echeancier,
            h('div', { style: 'height:8px' }),
            h('button', { class: 'plein', style: 'height:56px;border-radius:16px;background:var(--encre);color:var(--fond);font-size:16px;font-weight:500', onclick: ajouter }, 'Ajouter')))));
  }

  function ecranPretDetail(etat) {
    const prets = C.loans.filter(l => l.isLender === etat.isLender && !l.isPaid && (l.phoneNumber || ('nom:' + l.counterpartyName.trim().toLowerCase())) === etat.cle);
    if (!prets.length) {
      // Plus rien d'ouvert avec ce contact : on revient à la liste, comme l'application.
      if (!etat.sortie) { etat.sortie = true; setTimeout(() => { if (pile[pile.length - 1] === etat) retour(); }, 1200); }
      return h('div', { class: 'ecran' }, bandeau(), barreDetail('Détails du prêt', retour));
    }
    const premier = prets[0];
    const total = prets.reduce((s, l) => s + Math.max(0, l.amount - l.receivedAmount), 0);
    const preteur = etat.isLender;
    return h('div', { class: 'ecran' },
      bandeau(),
      barreDetail(premier.counterpartyName, retour,
        h('button', { class: 'bouton-icone', 'aria-label': 'Relevé complet avec cette personne', onclick: () => horsLecon('releveProche') }, ic('personnes')),
        h('button', { class: 'bouton-icone', 'aria-label': 'Partager la fiche du prêt', onclick: () => horsLecon('partagePret') }, ic('partage'))),
      h('div', { class: 'defile', style: 'padding:16px 16px calc(var(--bas) + 16px)' },
        h('div', { class: 'pile', style: 'gap:24px' },
          h('div', { class: 'carte', style: 'border-radius:24px;padding:24px;text-align:center' },
            h('div', { style: 'font-size:14px;font-weight:500;color:rgba(26,27,75,.6)' }, preteur ? 'On vous doit encore' : 'Vous devez encore'),
            h('div', { style: 'font-size:40px;line-height:52px;font-weight:900;color:' + (preteur ? 'var(--vert)' : 'var(--rouge)') }, francs(total)),
            h('div', { style: 'margin-top:8px;font-size:22px;line-height:28px' }, 'avec ' + premier.counterpartyName),
            premier.phoneNumber ? h('div', { style: 'color:rgba(26,27,75,.6)' }, telAffiche(premier.phoneNumber)) : null),
          h('div', { style: 'font-size:16px;font-weight:700' }, 'Historique des transactions'),
          h('div', { class: 'pile g12' }, prets.map(l => h('div', { style: 'background:rgba(241,232,223,.3);border-radius:16px;padding:16px;display:flex;align-items:center;gap:8px;cursor:pointer', onclick: () => detailPret(l) },
            h('div', { style: 'flex:1;font-size:12px;font-weight:500' }, dateMoyenne(l.startDate)),
            h('b', null, francs(l.amount)),
            h('button', { class: 'bouton-icone', 'aria-label': 'Enregistrer un règlement', style: 'color:var(--vert)', onclick: ev => { ev.stopPropagation(); horsLecon('reglementPret'); } }, ic('valide')),
            h('button', { class: 'bouton-icone', 'aria-label': 'Effacer cette ligne', style: 'color:#B3261E', onclick: ev => { ev.stopPropagation(); effacerPret(l); } }, ic('corbeille'))))))));
  }
  function detailPret(l) {
    const f = fenetre({
      titre: 'Détails du prêt', noir: true, formulaire: true,
      corps: h('div', { class: 'pile g12', style: 'color:var(--encre)' },
        h('div', null, 'Date : ' + dateCompacte(l.startDate)),
        h('div', null, 'À rendre le ' + dateCompacte(l.endDate)),
        l.description ? h('div', { style: 'background:#F1F8E9;border-radius:12px;padding:16px' },
          h('div', { style: 'font-size:11px;font-weight:700;color:var(--vert)' }, 'Note / Objet :'), h('div', { style: 'margin-top:4px' }, l.description)) : null),
      pied: [
        h('button', { class: 'bouton-texte', onclick: () => horsLecon('reconnaissance') }, 'Reconnaissance de dette'),
        h('button', { class: 'plein', onclick: () => f.fermer() }, 'Fermer')
      ]
    });
    ouvrir(f);
  }
  function effacerPret(l) {
    const f = fenetre({
      titre: 'Effacer cette ligne ?', noir: true,
      corps: h('div', { class: 'pile g8' },
        h('div', { style: 'color:var(--encre)' }, l.isLender
          ? 'Le prêt de ' + francs(l.amount) + ' à ' + l.counterpartyName + ' disparaîtra du carnet.'
          : 'L\'emprunt de ' + francs(l.amount) + ' auprès de ' + l.counterpartyName + ' disparaîtra du carnet.'),
        h('div', { style: 'color:#888' }, 'C\'est définitif.')),
      pied: [
        h('button', { class: 'bouton-texte', onclick: () => f.fermer() }, 'Annuler'),
        h('button', { class: 'plein danger', onclick: () => { f.fermer(); changer(() => { C.loans = C.loans.filter(x => x !== l); }); } }, 'Effacer')
      ]
    });
    ouvrir(f);
  }

  const ECRANS = {
    cahier: ecranCahier, profil: ecranProfil,
    tontines: ecranTontines, tontine: ecranTontine,
    prets: ecranPrets, pretForm: ecranPretForm, pretDetail: ecranPretDetail
  };

  // ============================================================================================
  // LE GUIDE — la logique de TutorialPanel.kt
  // ============================================================================================
  function monterGuide() {
    UI.fiche = h('div', { class: 'fiche', hidden: true });
    UI.rond = h('button', { class: 'rond-guide', 'aria-label': 'Le guide', onclick: () => { G.ouvert = !G.ouvert; G.planRepli = ''; majGuide(); } }, h('img', { alt: '' }));
    UI.etape = h('div', { class: 'etape' });
    UI.solution = h('div', { class: 'solution' }, 'Voici comment faire');
    UI.texte = h('div', { class: 'texte', 'aria-live': 'polite', onclick: () => { if (UI.texte.classList.contains('suite')) avancerLigne(); } });
    UI.indice = h('button', { class: 'indice', onclick: () => { G.revele = true; majGuide(); } }, 'Indice');
    UI.avance = h('button', { class: 'avance' });
    UI.bulle = h('div', { class: 'bulle' }, UI.etape, UI.solution, UI.texte, h('div', { class: 'actions' }, UI.indice, h('span', { class: 'vide-flex' }), UI.avance));
    UI.guide.append(UI.fiche, h('div', { class: 'ligne' }, UI.rond, UI.bulle));
  }

  function calculer() {
    const e = etape();
    let lignes, humeur, issue = 'WAITING', solution = false;
    if (G.phase === 'intro') { lignes = L.accueil.concat(L.invitation); humeur = 'explique'; }
    else if (G.phase === 'fin') { lignes = L.outro.concat(L.apercu); humeur = 'fete'; issue = 'DONE'; }
    else {
      const v = e.evaluate(snap());
      issue = v.issue;
      const rien = issue === 'WAITING';
      // La solution remplace la CONSIGNE, jamais les réactions.
      if (rien && G.revele) { lignes = e.solution; solution = true; humeur = 'explique'; }
      // Après un effacement, la consigne cède la place à ce qu'il faut refaire — voir rappel.
      else if (rien && G.rappel) { lignes = G.rappel; humeur = 'explique'; }
      else if (rien) { lignes = (e.bridge || []).concat(e.brief); humeur = 'explique'; }
      else { lignes = v.lignes; humeur = v.humeur; }
      return { e, v, lignes, humeur, issue, solution };
    }
    return { e, lignes, humeur, issue, solution };
  }

  function avancerLigne() {
    G.idx++;
    // Une fois la correction du nom lue, elle s'efface : l'index retombe sur la réaction qui suit.
    if (!G.incise && G.correction && G.idx >= G.correction.length) {
      G.idx -= G.correction.length;
      G.correction = null;
      G.cle = cleEtape() + '|' + calculer().lignes.join('\n');
    }
    G.planRepli = '';
    majGuide();
  }

  /** Ce que le personnage glisse entre deux gestes : un formulaire ouvert, refermé. */
  function signal(k) {
    const c = calculer();
    const attend = G.phase === 'jeu' && c.issue !== 'DONE' && !c.e?.autoPlay;
    if (!attend) return;
    if (k === 'ouvert') { G.incise = L.nudges.formOpened; G.cle = ''; }
    else if (k === 'annule') G.incise = L.nudges.formCancelled;
  }

  /** Ce qu'il tape, avant tout enregistrement : le personnage encourage, une fois par champ. */
  function frappe(champ, valeur) {
    G.tape = true;
    clearTimeout(G.t.tape);
    G.t.tape = setTimeout(() => { G.tape = false; majGuide(); }, 2500);
    clearTimeout(G.t.live);
    const c = calculer();
    const attend = G.phase === 'jeu' && c.issue !== 'DONE' && !c.e?.autoPlay;
    if (attend && !G.revele && !G.dejaDit.has(champ)) {
      G.t.live = setTimeout(() => {
        const lh = (c.e.liveHints || []).find(x => x.champ === champ && x.test(valeur));
        if (!lh || G.dejaDit.has(champ)) return;
        G.dejaDit.add(champ);
        G.incise = lh.lignes;
        majGuide();
      }, 700);
    }
    majGuide();
  }

  function effacerMinuteurs() {
    ['repli', 'bloque', 'live'].forEach(k => clearTimeout(G.t[k]));
    (G.t.auto || []).forEach(clearTimeout);
    G.t.auto = [];
    G.planRepli = '';
  }

  function majGuide() {
    if (!L || !C) return;
    const c = calculer();
    const base = cleEtape() + '|' + c.lignes.join('\n');
    if (base !== G.cleBase) { G.cleBase = base; G.incise = null; }
    const montrees = G.incise || (G.correction || []).concat(c.lignes);
    const cle = cleEtape() + '|' + montrees.join('\n') + (G.incise ? '|i' : '');
    const frappeEnCours = G.tape || G.clavier;
    if (cle !== G.cle) { G.cle = cle; G.idx = 0; G.ouvert = !frappeEnCours; G.planRepli = ''; }
    if (frappeEnCours !== G.avantFrappe) { G.avantFrappe = frappeEnCours; G.ouvert = !frappeEnCours; G.planRepli = ''; }
    G.idx = Math.min(G.idx, montrees.length - 1);
    const e = c.e;
    const suite = G.idx < montrees.length - 1;
    const ligne = montrees[G.idx] || '';
    const enJeu = G.phase === 'jeu' && c.issue !== 'DONE';
    const attend = enJeu && !e.autoPlay;
    if (enJeu && !suite) G.mainPassee = true;
    const estSolution = c.solution && !G.incise;
    const humeur = G.incise ? 'attend' : estSolution ? (G.idx === 0 ? 'decu' : 'explique') : c.humeur;
    const peutAvancer = G.phase !== 'jeu' || c.issue === 'DONE';
    const fiche = enJeu && G.mainPassee && e.card ? e.card : null;
    const formOuvert = formulaireOuvert();

    // --- La bulle : absente dès qu'un formulaire est ouvert, le guide parle dedans ---
    const cache = fenetres.length > 0 || G.clavier || ecranFormulaire();
    UI.guide.hidden = cache;
    UI.rond.firstChild.src = 'assets/guide/' + humeur + '.webp';
    UI.bulle.hidden = !G.ouvert;
    UI.etape.textContent = G.phase === 'jeu' && L.etapes.length > 1 ? 'Étape ' + (G.etape + 1) + ' sur ' + L.etapes.length : '';
    UI.etape.hidden = !UI.etape.textContent;
    UI.solution.hidden = !estSolution;
    UI.texte.textContent = ligne;
    UI.texte.classList.toggle('suite', suite);
    UI.indice.hidden = !(G.phase === 'jeu' && !e.autoPlay && !estSolution);
    if (suite) { UI.avance.hidden = false; UI.avance.textContent = 'Suivant ›'; UI.avance.onclick = avancerLigne; }
    else if (peutAvancer) {
      UI.avance.hidden = false;
      UI.avance.textContent = G.phase === 'intro' ? 'Commencer' : G.phase === 'fin' ? 'Terminer' : 'Continuer';
      UI.avance.onclick = primaire;
    } else UI.avance.hidden = true;
    remplirFiche(UI.fiche, fiche, G.ficheOuverte, () => { G.ficheOuverte = !G.ficheOuverte; majGuide(); });

    // --- Le guide dans le formulaire ouvert : le personnage en haut, la fiche en tête du contenu ---
    const hote = hoteDuGuide();
    fenetres.concat(pile).forEach(x => {
      if (x === hote) return;
      x.bandeHote?.replaceChildren();
      x.ficheHote?.replaceChildren();
    });
    if (hote && hote.bandeHote) {
      if (G.phase !== 'jeu') { hote.bandeHote.replaceChildren(); hote.ficheHote.replaceChildren(); }
      else {
        hote.bandeHote.replaceChildren(
          h('button', { type: 'button', class: 'bande', onclick: () => { if (suite) avancerLigne(); } },
            h('img', { src: 'assets/guide/' + humeur + '.webp', alt: '' }), h('span', null, ligne), suite ? h('b', null, '›') : null));
        const f2 = fiche ? h('div', { class: 'fiche' }) : null;
        if (f2) remplirFiche(f2, fiche, G.ficheFormOuverte, () => { G.ficheFormOuverte = !G.ficheFormOuverte; majGuide(); });
        hote.ficheHote.replaceChildren(...(f2 ? [f2] : []));
      }
    }

    // --- Le bouton qui bat : boutonQuiBat ---
    let cibleBat = null;
    if (enJeu && (!suite || (G.incise && G.mainPassee)) && !formOuvert && !fenetres.length && !G.clavier) cibleBat = e.highlight || null;
    UI.tel.querySelectorAll('[data-cible]').forEach(el => el.classList.toggle('bat', el.dataset.cible === cibleBat));

    // --- Quand la bulle se replie, et quand le personnage propose son aide ---
    const plan = cle + '#' + G.idx;
    if (!suite && attend && G.ouvert && G.planRepli !== plan) {
      G.planRepli = plan;
      clearTimeout(G.t.repli);
      G.t.repli = setTimeout(() => { G.ouvert = false; majGuide(); }, Math.min(1400 + ligne.length * 45, 6000));
    }
    clearTimeout(G.t.bloque);
    if (attend && !frappeEnCours && !formOuvert && !suite && !G.incise) {
      G.t.bloque = setTimeout(() => {
        if (G.revele || G.tape || G.clavier || formulaireOuvert()) return;
        G.incise = L.nudges.stuck.concat(e.hint || [], L.nudges.stuckOffer);
        majGuide();
      }, 25000);
    }

    // --- L'erreur écrite, effacée par le personnage — voir Correction dans l'application ---
    // Une fois sa dernière phrase affichée (« Je l'efface, regardez »), il laisse le temps de la
    // lire, puis il efface sous les yeux du visiteur.
    const aEffacer = G.phase === 'jeu' && c.v?.correction && (c.issue === 'ALMOST' || c.issue === 'WRONG') && !G.incise
      ? c.v.correction : null;
    if (aEffacer && !suite && !G.effacement && !formOuvert && !fenetres.length && !G.clavier && G.planEfface !== cle) {
      G.planEfface = cle;
      clearTimeout(G.t.efface);
      G.t.efface = setTimeout(() => effacer(aEffacer), 1500);
    }

    // --- L'étape que le jeu joue lui-même : le paiement Wave ---
    if (e && e.autoPlay && G.phase === 'jeu' && G.etape > G.autoJoue && !suite) {
      G.autoJoue = G.etape;
      paiementWave();
    }
    placerMesures();
  }

  function remplirFiche(el, fiche, ouverte, basculer) {
    el.hidden = !fiche;
    if (!fiche) return;
    el.classList.toggle('pliee', !ouverte);
    el.replaceChildren(
      h('button', { type: 'button', class: 'tete', onclick: basculer, 'aria-expanded': String(ouverte) }, h('span', null, fiche.title), h('span', null, ouverte ? '⌃' : '⌄')),
      h('dl', null, fiche.facts.map(([k, v]) => [h('dt', null, k), h('dd', null, v)])),
      ...(fiche.note ? [h('div', { class: 'note' }, fiche.note)] : []));
  }

  /** Les listes se raccourcissent de la hauteur du guide ; le bouton flottant monte au-dessus de lui. */
  function placerMesures() {
    if (!UI.guide) return;
    const visible = !UI.guide.hidden;
    const hauteur = visible ? UI.guide.offsetHeight : 0;
    const ficheOuverte = !UI.fiche.hidden && G.ficheOuverte;
    const replie = !G.ouvert && !ficheOuverte;
    UI.tel.style.setProperty('--bas', visible && !replie ? (hauteur + 84) + 'px' : '0px');
    UI.tel.style.setProperty('--leve', visible && G.ouvert ? (hauteur + 76) + 'px' : '0px');
  }

  function paiementWave() {
    const partie = cleEtape();
    const plus = (ms, fn) => G.t.auto.push(setTimeout(() => { if (cleEtape() === partie) fn(); }, ms));
    plus(2000, () => {
      const du = C.transactions.find(t => isAmount(t.amount, 3400));
      if (!du || resteDe(du) <= 0) return;
      const payeur = C.clients.find(c => c.id === du.clientId);
      if (!payeur) return;
      const reste = resteDe(du);
      montrerNotif('Wave', 'Vous avez reçu ' + francs(reste), 'De ' + payeur.name + ' · ' + telAffiche(payeur.phone));
      plus(2500, () => changer(() => {
        du.receivedAmount = du.amount; du.status = 'PAID'; du.paidAt = Date.now(); du.lastPaymentMethod = 'WAVE';
      }));
      plus(6000, cacherNotif);
    });
  }

  // ============================================================================================
  // LE DÉROULÉ : l'accueil, les étapes, la fin
  // ============================================================================================
  function reinitEtape() {
    effacerMinuteurs();
    clearTimeout(G.t.efface);
    UI.tel?.querySelectorAll('.eff-voile').forEach(x => x.remove());
    Object.assign(G, { revele: false, incise: null, correction: null, corriges: new Set(), dejaDit: new Set(), mainPassee: false, ficheOuverte: true, ouvert: true, rappel: null, effacement: false, planEfface: '' });
    cacherNotif();
  }

  /**
   * Le personnage efface lui-même la ligne écrite de travers — EffacementParLeGuide dans
   * l'application. Il appuie sur la ligne, la fenêtre de Juboo s'ouvre avec ses vrais mots, il
   * appuie sur le bouton ; chaque appui laisse un cercle qui s'estompe. Puis l'étape repart de son
   * décor, et il dit ce qu'il faut refaire.
   */
  function effacer(c) {
    if (G.effacement) return;
    G.effacement = true;
    const partie = cleEtape();
    const ligne = h('div', { class: 'eff-ligne' }, h('b', null, c.ligne), h('span', null, c.detail));
    const bouton = h('span', { class: 'eff-bouton' }, c.bouton);
    const fenetre = h('div', { class: 'eff-fenetre', hidden: true },
      h('h3', null, c.question), h('p', null, c.detail),
      h('div', { class: 'eff-actions' }, h('span', { class: 'eff-annuler' }, 'Annuler'), bouton));
    const voile = h('div', { class: 'eff-voile' }, h('div', { class: 'eff-pile' }, ligne, fenetre));
    UI.tel.append(voile);
    const doigt = el => el.append(h('i', { class: 'eff-doigt' }));
    const plus = (ms, fn) => G.t.auto.push(setTimeout(() => { if (cleEtape() === partie) fn(); }, ms));
    plus(600, () => doigt(ligne));
    plus(1700, () => { fenetre.hidden = false; });
    plus(2700, () => doigt(bouton));
    plus(3600, () => ligne.classList.add('partie'));
    plus(4500, () => {
      voile.remove();
      G.essai++;
      entrerEtape();
      G.rappel = c.apres;
      majGuide();
    });
  }
  function entrerEtape() {
    reinitEtape();
    const d = decorA(G.etape);
    if (d !== undefined) poserDecor(d);
    fermerTout();
    allerDepart();
  }
  function primaire() {
    if (G.phase === 'intro') { G.phase = 'jeu'; G.etape = 0; entrerEtape(); }
    else if (G.phase === 'jeu') {
      if (G.etape + 1 < L.etapes.length) { G.etape++; entrerEtape(); }
      else { G.phase = 'fin'; reinitEtape(); fermerTout(); allerDepart(); }
    } else finir();
  }
  /** Rejoue l'étape affichée depuis son début : le décor est reposé, la marche à suivre retirée. */
  function recommencer() {
    if (!enPartie()) return;
    G.essai++;
    entrerEtape();
  }

  function finir() {
    const fin = h('div', { class: 'fin' }, h('div', { class: 'carte-fin' },
      h('img', { src: 'assets/guide/fete.webp', alt: '' }),
      h('h2', null, 'Ce n\'était qu\'un aperçu'),
      h('p', null, 'Juboo fait bien plus que ça. Pour tout découvrir et vous en servir, installez l\'application : elle s\'installe par WhatsApp.'),
      h('a', { class: 'principal-fin', 'data-whatsapp': '', href: 'https://wa.me/221775543487' }, 'Recevoir Juboo sur WhatsApp'),
      h('a', { class: 'second', href: 'index.html#lecons' }, 'Essayer un autre espace'),
      h('a', { class: 'second', href: '#', onclick: ev => { ev.preventDefault(); fin.remove(); relancer(); } }, 'Rejouer la leçon')));
    UI.scene.append(fin);
  }

  function relancer() {
    G.partie++; G.phase = 'intro'; G.etape = 0; G.essai = 0; G.autoJoue = -1;
    reinitEtape();
    poserDecor(L.decor || null);
    fermerTout();
    allerDepart();
  }

  // ============================================================================================
  // L'ENTRÉE : chaque leçon appelle JubooSim.lancer({...})
  // ============================================================================================
  window.JubooSim = {
    /** Une réaction du guide : l'issue, son humeur, ses phrases. */
    V: (issue, humeur, ...lignes) => ({
      issue, humeur, lignes, correction: null,
      /** Ce verdict porte sur une ligne écrite de travers : le personnage l'effacera. */
      efface(ligne, detail, question, bouton, ...apres) {
        return { ...this, correction: { ligne, detail, question, bouton, apres } };
      }
    }),
    JE_L_EFFACE: 'Je l\'efface, regardez.',
    /** « 1 200 F » : les montants tels que le personnage et ses fiches les écrivent. */
    F: v => groupe(v) + ' F',
    /** La créance t, effacée : « Effacer cette ligne ? », puis « Effacer ». */
    effaceCreance(v, s, t, ...apres) {
      const nom = s.clients.find(c => c.id === t.clientId)?.name || 'Client';
      const detail = (t.description || 'Marchandise') + ' · ' + groupe(t.amount) + ' F' +
        (t.receivedAmount > 0.5 ? ' · reçu ' + groupe(t.receivedAmount) + ' F' : '');
      return v.efface(nom, detail, 'Effacer cette ligne ?', 'Effacer', ...apres);
    },
    /** Le prêt l, effacé. */
    effacePret(v, l, ...apres) {
      const detail = (l.isLender ? 'Prêté' : 'Emprunté') + ' · ' + groupe(l.amount) + ' F' +
        (l.receivedAmount > 0.5 ? ' · rendu ' + groupe(l.receivedAmount) + ' F' : '');
      return v.efface(l.counterpartyName || 'Prêt', detail, 'Effacer cette ligne ?', 'Effacer', ...apres);
    },
    /** La tontine t, dissoute : le nombre de mains ne se modifie pas. */
    effaceTontine(v, t, mains, ...apres) {
      return v.efface(t.name, 'Cotisation ' + groupe(t.contributionAmount) + ' F · ' + mains + ' mains',
        'Dissoudre la tontine ?', 'Dissoudre', ...apres);
    },
    isAmount, memeJour, finDuJour,
    lancer(lecon) {
      L = lecon;
      document.title = L.titre + ' — Juboo';
      document.getElementById('titre').textContent = 'Leçon : ' + L.titre;
      monter();
      relancer();
      // Les images du guide, chargées d'avance : une humeur qui change ne doit pas clignoter.
      ['explique', 'attend', 'bravo', 'non', 'corrige', 'decu', 'fete'].forEach(n => { new Image().src = 'assets/guide/' + n + '.webp'; });
    }
  };
})();
