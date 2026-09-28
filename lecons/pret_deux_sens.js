// « Prêter ou emprunter » — la scène pretDeuxSens de l'application (PretScenarios.kt).
//
// L'erreur qui INVERSE un solde : un emprunt noté comme un prêt fait croire au contraire exact de
// la vérité, et c'est invisible, parce qu'un solde inversé se lit comme un solde normal.
(() => {
  const { V, isAmount } = JubooSim;

  JubooSim.lancer({
    id: 'pret_deux_sens',
    titre: 'Prêter ou emprunter',
    depart: 'prets',
    accueil: [
      'Bonjour ! Je suis le guide de Juboo.',
      'Juboo, c\'est un carnet de comptes dans votre téléphone : pour la boutique, les tontines et les prêts entre proches.',
      'Vous avez choisi les prêts entre proches : l\'argent que vous prêtez à la famille et aux amis, et celui qu\'on vous prête.',
      'Ce que vous voyez fonctionne comme l\'application : vous pouvez toucher, écrire, et même vous tromper.'
    ],
    invitation: [
      'On prête à un frère, on emprunte à un voisin.',
      'Puis on oublie, et c\'est ainsi que l\'on se fâche.'
    ],
    outro: [
      'Voilà, la leçon est terminée.',
      'D\'un côté ce qu\'on vous doit, de l\'autre ce que vous devez.',
      'Personne n\'a plus besoin de s\'en souvenir : c\'est écrit.'
    ],
    apercu: [
      'Ce n\'était qu\'un aperçu. Il reste beaucoup d\'autres fonctions que nous n\'avons pas vues.',
      'Prêter en plusieurs versements, la reconnaissance de dette, le relevé complet avec un proche… et les espaces Boutique et Tontines.',
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
      {
        id: 'prete',
        bridge: ['Votre cousin Malick passe vous voir.'],
        brief: [
          'Il a besoin de 20 000 F pour un imprévu.',
          'Il promet de vous rembourser à la fin du mois.',
          'Notez ce prêt.'
        ],
        card: {
          title: 'Ce que Malick demande',
          facts: [['Personne', 'Malick Diagne'], ['Téléphone', '77 666 55 44'], ['Montant', '20 000 F'], ['Motif', 'Un imprévu'], ['Il remboursera', 'À la fin du mois']]
        },
        highlight: 'ADD',
        hint: ['C\'est VOUS qui prêtez l\'argent.', 'Le bouton du bas ouvre le bon côté.'],
        solution: [
          'Je vous montre.',
          'Dans les prêts, passez sur « On me doit ».',
          'Appuyez sur « Noter un prêt ».',
          'Notez Malick, 20 000 F, à rembourser à la fin du mois.',
          'Puis appuyez sur « Ajouter ».'
        ],
        evaluate: s => {
          const sien = s.loans.find(l => isAmount(l.amount, 20000));
          if (!sien && s.loans.length) return V('WRONG', 'non', 'Ce n\'est pas le bon montant.', 'Malick vous demande 20 000 F.');
          if (!sien) return V('WAITING', 'attend', 'Malick attend devant vous.', 'Il demande 20 000 F, à rembourser à la fin du mois.');
          // Le piège : noté du côté des emprunts.
          if (!sien.isLender) return V('WRONG', 'non',
            'Non. Vous venez d\'écrire que vous devez 20 000 F à Malick.',
            'C\'est l\'inverse : c\'est lui qui vous les doit.',
            'Sinon, votre solde serait faux de 40 000 F.',
            'Effacez cette ligne, et reprenez du côté « On me doit ».');
          return V('DONE', 'bravo',
            'Voilà. Malick vous doit 20 000 F, avec une date de remboursement.',
            'S\'il n\'a pas remboursé à la fin du mois, Juboo vous le rappellera.');
        }
      },
      {
        id: 'emprunte',
        bridge: ['Le même jour, en fin d\'après-midi.'],
        // Le prêt de Malick, tel qu'il aurait dû être noté — du bon côté.
        decor: { loans: [{ name: 'Malick Diagne', phone: '776665544', amount: 20000, isLender: true, label: 'Imprévu' }] },
        brief: [
          'Votre voisin Serigne vous prête 5 000 F pour la boutique.',
          'Cette fois, c\'est vous qui devez.',
          'Notez cet emprunt.'
        ],
        card: {
          title: 'Ce que Serigne vous prête',
          facts: [['Personne', 'Serigne Mbaye'], ['Téléphone', '77 888 77 66'], ['Montant', '5 000 F'], ['Motif', 'Pour la boutique']],
          note: 'Cette fois, c\'est vous qui devez.'
        },
        // Les onglets, et non « Ajouter » : ce qui se rate ici, c'est de changer de côté avant d'écrire.
        highlight: 'TABS',
        hint: ['Allez sur l\'autre onglet, « Je dois ».', 'Les deux côtés ne se mélangent jamais.'],
        solution: [
          'Je vous montre.',
          'Passez sur l\'onglet « Je dois ».',
          'Appuyez sur « Noter un emprunt », puis notez Serigne, 5 000 F.',
          'Votre solde sera alors de 15 000 F, et il sera juste.'
        ],
        evaluate: s => {
          const emprunt = s.loans.find(l => isAmount(l.amount, 5000));
          if (!emprunt) return V('WAITING', 'attend', 'Serigne vous a prêté 5 000 F.', 'Notez-le du bon côté.');
          if (emprunt.isLender) return V('WRONG', 'non',
            'Non. Vous venez d\'écrire que Serigne vous doit 5 000 F.',
            'C\'est lui qui vous a prêté l\'argent. C\'est vous qui devez.',
            'Effacez, et reprenez sur l\'onglet « Je dois ».');
          return V('DONE', 'fete',
            'Parfait. On vous doit 20 000 F, et vous devez 5 000 F.',
            'Votre solde est de 15 000 F, et il est juste.');
        }
      }
    ]
  });
})();
