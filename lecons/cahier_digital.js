// « Noter une dette » — la scène cahierDigital de l'application (TutorialScenario.kt), mot pour mot.
//
// Le guide ne dicte rien : il raconte une situation de boutique et juge ce que le carnet contient
// une fois qu'on a agi. Noter 2 000 F au lieu de 3 400 F donne un solde juste et une vente perdue :
// c'est l'erreur que la scène laisse commettre, pour la faire comprendre.
(() => {
  const { V, isAmount, memeJour } = JubooSim;
  const MOUSSA = { name: 'Moussa Diop', phone: '771234567', tag: 'Voisin',
    transactions: [{ amount: 3400, received: 1400, label: 'Huile, eau, brioches, jus' }] };
  // Les montants qui appartiennent au premier client : l'étape d'Awa les ignore.
  const premier = t => isAmount(t.amount, 3400) || isAmount(t.amount, 2000);

  JubooSim.lancer({
    id: 'cahier_digital',
    titre: 'Noter une dette',
    depart: 'cahier',
    accueil: [
      'Bonjour ! Je suis le guide de Juboo.',
      'Juboo, c\'est un carnet de comptes dans votre téléphone : pour la boutique, les tontines et les prêts entre proches.',
      'Vous avez choisi « Ma boutique » : le cahier où vous notez ce que vos clients vous doivent.',
      'Ce que vous voyez fonctionne comme l\'application : vous pouvez toucher, écrire, et même vous tromper.'
    ],
    invitation: [
      'Plutôt qu\'une longue explication, prenons un exemple.',
      'Imaginons que vous teniez une boutique au marché Sandaga.'
    ],
    outro: [
      'Voilà, la leçon est terminée.',
      'Vous savez noter une dette, l\'acompte reçu et la date de paiement.',
      'Vous avez aussi vu Juboo enregistrer un paiement Wave tout seul.'
    ],
    apercu: [
      'Ce n\'était qu\'un aperçu. Il reste beaucoup d\'autres fonctions que nous n\'avons pas vues.',
      'Relancer les retards sur WhatsApp, compter sa caisse le soir, le bilan du mois… et les espaces Tontines et Prêts.',
      'Pour les découvrir et vous en servir, il faut installer Juboo.'
    ],
    nudges: {
      formOpened: ['Bien, c\'est le bon formulaire.', 'Remplissez les champs, puis validez avec le bouton du bas.'],
      formCancelled: ['Le formulaire est fermé.', 'Reprenez quand vous voulez : rien n\'est perdu.'],
      stuck: ['Besoin d\'aide ?'],
      stuckOffer: ['Appuyez sur « Indice » : je vous guide pas à pas.']
    },
    decor: null,
    etapes: [
      // Client 1 — LA leçon : deux saisies donnent le bon solde, une seule est juste.
      {
        id: 'moussa',
        bridge: ['Il est neuf heures. Vous ouvrez la boutique.'],
        brief: [
          'Un client entre. Il s\'appelle Moussa Diop, c\'est votre voisin.',
          'Il prend une bouteille d\'huile, une bouteille d\'eau, deux brioches et un jus.',
          'Le total est de 3 400 F, mais il ne vous donne que 1 400 F.',
          'Comment le notez-vous ?'
        ],
        card: {
          title: 'Ce que Moussa a pris',
          facts: [['Client', 'Moussa Diop'], ['Téléphone', '77 123 45 67'], ['Total de la vente', '3 400 F'], ['Il vous remet', '1 400 F']],
          note: 'C\'est votre voisin.'
        },
        highlight: 'ADD',
        hint: ['Commencez par l\'ajouter dans le Cahier.', 'Le bouton « Nouvelle Entrée » se trouve en bas de l\'écran.'],
        liveHints: [
          { champ: 'CLIENT_NAME', test: v => v.trim().length >= 4 && /mouss/i.test(v), lignes: ['Voilà, c\'est lui.'] },
          { champ: 'CLIENT_PHONE', test: v => v.replace(/\D/g, '') === '771234567', lignes: ['C\'est bien son numéro.'] }
        ],
        clientFix: {
          name: 'Moussa Diop',
          accepts: n => /mouss/i.test(n),
          pick: s => s.clients.reduce((a, c) => (!a || c.id < a.id ? c : a), null),
          says: ecrit => ['Petite erreur de nom : c\'est Moussa, pas « ' + ecrit + ' ».', 'Je corrige pour vous.']
        },
        solution: [
          'Je vous montre.',
          'Ce n\'est pas grave, vous débutez.',
          'Appuyez sur « Nouvelle Entrée », en bas de l\'écran.',
          'Écrivez son nom, Moussa Diop, et son numéro, 77 123 45 67. Choisissez « Voisin ».',
          'Dans « Montant total », mettez 3 400 F : le prix de la vente, pas ce qui reste dû.',
          'Juste en dessous, dans « Déjà versé », mettez 1 400 F.',
          'Puis appuyez sur « Enregistrer ».',
          'C\'est tout.'
        ],
        evaluate: s => {
          const txs = s.transactions;
          const full = txs.find(t => isAmount(t.amount, 3400));
          const shortcut = txs.find(t => isAmount(t.amount, 2000));
          if (full && isAmount(full.receivedAmount, 1400)) return V('DONE', 'bravo',
            'Très bien.',
            'Il vous doit encore 2 000 F, et vous avez vendu pour 3 400 F.',
            'Le Cahier garde les deux chiffres : la vente et ce qui reste dû.');
          if (full && full.receivedAmount < 0.5) return V('PROGRESS', 'attend',
            'Bien, le prix de la vente est noté.',
            'Il manque les 1 400 F qu\'il vous a donnés.',
            'Ouvrez sa fiche et appuyez sur « Encaisser ».');
          if (full) return V('ALMOST', 'corrige',
            'Il vous a donné 1 400 F, pas un autre montant.',
            'Regardez ce que vous avez noté comme reçu.');
          if (shortcut) return V('ALMOST', 'corrige',
            'Le reste est juste : il vous doit bien 2 000 F.',
            'Mais combien avez-vous vendu ce matin ?',
            'D\'après le Cahier, seulement 2 000 F.',
            'Les 3 400 F de la vente ont disparu de vos comptes.',
            'Reprenez : 3 400 F au total, et 1 400 F déjà versés.');
          if (txs.length) return V('WRONG', 'non',
            'Ce n\'est pas le bon montant.',
            'L\'huile, l\'eau, les deux brioches et le jus font 3 400 F.');
          if (s.clients.length) return V('PROGRESS', 'attend',
            'Bien, il est dans le Cahier.',
            'Maintenant, notez ce qu\'il a pris.');
          return V('WAITING', 'attend', 'Je vous écoute.', 'Moussa attend devant le comptoir.');
        }
      },

      // Client 2 — l'échéance.
      {
        id: 'awa',
        bridge: ['Moussa est noté.', 'La matinée continue.'],
        decor: { clients: [MOUSSA] },
        brief: [
          'Une cliente entre. Elle s\'appelle Awa Ndiaye.',
          'Elle prend pour 5 000 F de marchandise.',
          'Elle vous dit qu\'elle passera payer demain.',
          'Notez la dette, et surtout la date où elle paiera.'
        ],
        card: {
          title: 'Ce qu\'Awa a pris',
          facts: [['Cliente', 'Awa Ndiaye'], ['Téléphone', '77 555 44 33'], ['Montant', '5 000 F'], ['Elle paiera', 'Demain']],
          note: 'Elle ne vous donne rien aujourd\'hui.'
        },
        highlight: 'ADD',
        hint: ['Le formulaire demande quand elle paiera.', 'Ne laissez pas le choix proposé par défaut.'],
        liveHints: [
          { champ: 'CLIENT_NAME', test: v => v.trim().length >= 3 && /awa/i.test(v), lignes: ['C\'est elle.'] }
        ],
        clientFix: {
          name: 'Awa Ndiaye',
          accepts: n => /awa/i.test(n),
          // Le PREMIER client est exclu, toujours : Moussa ne doit jamais devenir Awa.
          pick: s => {
            const tries = [...s.clients].sort((a, b) => a.id - b.id);
            const premierId = tries[0]?.id;
            const sienne = s.transactions.find(t => isAmount(t.amount, 5000));
            const candidat = (sienne && s.clients.find(c => c.id === sienne.clientId)) || tries[1];
            return candidat && candidat.id !== premierId ? candidat : null;
          },
          says: ecrit => ['Petite erreur de nom : c\'est Awa, pas « ' + ecrit + ' ».', 'Je corrige pour vous.']
        },
        solution: [
          'Ajoutez Awa, avec une dette de 5 000 F.',
          'Pour la date de paiement, choisissez « Demain ».',
          'C\'est cette date qui déclenchera le rappel si elle oublie.'
        ],
        evaluate: s => {
          const fresh = s.transactions.filter(t => !premier(t));
          const hers = fresh.find(t => isAmount(t.amount, 5000));
          const demain = s.now + 864e5;
          if (hers && memeJour(hers.dueDate, demain)) return V('DONE', 'bravo',
            'Parfait.',
            'Si elle n\'a pas payé demain soir, Juboo vous le rappellera.',
            'Vous n\'aurez pas à y penser.');
          if (hers) return V('ALMOST', 'corrige',
            'Le montant est bon.',
            'Mais elle a dit DEMAIN, et le Cahier indique une autre date.',
            'Corrigez la date, sinon le rappel arrivera au mauvais moment.');
          if (fresh.length) return V('WRONG', 'non', 'Ce n\'est pas le bon montant.', 'Awa a pris pour 5 000 F.');
          return V('WAITING', 'attend', 'Awa attend.', 'Elle prend 5 000 F, et elle paiera demain.');
        }
      },

      // Client 3 — le paiement qui arrive tout seul.
      {
        id: 'wave',
        bridge: ['Deux clients sont notés. Vous vous en sortez très bien.', 'Pour le dernier, vous n\'aurez rien à faire.'],
        decor: {
          clients: [MOUSSA, { name: 'Awa Ndiaye', phone: '775554433', tag: 'Client',
            transactions: [{ amount: 5000, label: 'Marchandise', dueInDays: 1 }] }]
        },
        brief: ['Regardez votre téléphone.', 'Moussa vient de vous envoyer ses 2 000 F par Wave.'],
        hint: ['Ne touchez à rien.', 'Regardez ce que Juboo fait tout seul.'],
        solution: ['Il n\'y a rien à faire.', 'Juboo a reconnu le numéro de Moussa, et il a soldé sa dette.'],
        autoPlay: true,
        evaluate: s => {
          const moussa = s.transactions.find(t => isAmount(t.amount, 3400));
          if (moussa && moussa.receivedAmount >= 3399.5) return V('DONE', 'fete',
            'Vous avez vu ? Vous n\'avez rien tapé.',
            'Juboo a reconnu son numéro, et il a soldé sa dette tout seul.',
            'Chaque paiement Wave reconnu, c\'est une saisie de moins pour vous.');
          return V('WAITING', 'attend', 'Le paiement arrive…');
        }
      }
    ]
  });
})();
