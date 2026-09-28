// « Créer une tontine » — la scène tontinePremiere de l'application (TontineScenarios.kt).
//
// LA confusion du module : le montant demandé est la COTISATION d'un tour, pas la cagnotte. Qui
// saisit 60 000 au lieu de 10 000 verra Juboo réclamer six fois trop à chacun, tous les mois — et
// rien à l'écran ne le détrompe : 60 000 est un montant valide. Le guide, lui, le voit.
(() => {
  const { V, isAmount } = JubooSim;

  JubooSim.lancer({
    id: 'tontine_premiere',
    titre: 'Créer une tontine',
    depart: 'tontines',
    accueil: [
      'Bonjour ! Je suis le guide de Juboo.',
      'Juboo, c\'est un carnet de comptes dans votre téléphone : pour la boutique, les tontines et les prêts entre proches.',
      'Vous avez choisi « Mes tontines ».',
      'Ce que vous voyez fonctionne comme l\'application : vous pouvez toucher, écrire, et même vous tromper.'
    ],
    invitation: [
      'Une tontine se tient bien sur un cahier, tant que personne ne conteste.',
      'Juboo garde la mémoire : qui a payé, et qui a déjà reçu la cagnotte.'
    ],
    outro: [
      'Voilà, votre tontine est créée.',
      'Vous avez fixé la cotisation, le nombre de mains et l\'ordre de passage.',
      'Juboo s\'occupe des calculs.'
    ],
    apercu: [
      'Ce n\'était qu\'un aperçu. Il reste beaucoup d\'autres fonctions que nous n\'avons pas vues.',
      'Encaisser les cotisations, remettre la cagnotte, tirer l\'ordre au sort, les amendes de retard… et les espaces Boutique et Prêts.',
      'Pour les découvrir et vous en servir, il faut installer Juboo.'
    ],
    nudges: {
      formOpened: ['Bien, c\'est le bon formulaire.', 'Remplissez les champs, puis validez avec le bouton du bas.'],
      formCancelled: ['Le formulaire est fermé.', 'Reprenez quand vous voulez : rien n\'est perdu.'],
      stuck: ['Besoin d\'aide ?'],
      stuckOffer: ['Appuyez sur « Indice » : je vous guide pas à pas.']
    },
    decor: null,
    etapes: [{
      id: 'creer',
      bridge: ['Cinq commerçantes du marché veulent créer une tontine avec vous.'],
      brief: [
        'Vous serez six en tout, en vous comptant.',
        'Chaque membre cotise 10 000 F par mois.',
        'Chaque mois, un membre reçoit toute la cagnotte : 60 000 F.',
        'Créez la tontine.'
      ],
      // La fiche parle la langue de la SITUATION, pas celle du formulaire : le piège est de saisir
      // la cagnotte à la place de la part.
      card: {
        title: 'La tontine du marché',
        facts: [['Membres', '6, en vous comptant'], ['Chaque membre verse', '10 000 F'], ['Tous les', 'mois'], ['La cagnotte du mois', '60 000 F']]
      },
      highlight: 'ADD',
      hint: [
        'Juboo demande ce que chaque membre verse, pas le montant de la cagnotte.',
        'Le nombre de mains, lui, fixe le nombre de tours.'
      ],
      solution: [
        'Je vous montre.',
        'Appuyez sur « Créer ou reprendre une tontine ».',
        'Donnez-lui un nom : la tontine du marché.',
        'Dans « Cotisation par membre », mettez 10 000 F.',
        'C\'est la part de CHAQUE MEMBRE, pas les 60 000 F de la cagnotte.',
        'Pour la fréquence, choisissez « Mensuelle ».',
        'Descendez jusqu\'à « Nombre de mains », et mettez six : une par personne.',
        'Puis appuyez sur « Créer ».'
      ],
      evaluate: s => {
        const t = s.tontines[0];
        const mains = t ? (t.totalShares > 0 ? t.totalShares : t.totalMembers) : 0;
        if (!t) return V('WAITING', 'attend', 'Les cinq commerçantes attendent.', 'Chaque membre cotise 10 000 F, tous les mois.');
        if (isAmount(t.contributionAmount, 60000)) return V('ALMOST', 'corrige',
          'Attention : 60 000 F, c\'est la cagnotte qu\'un membre REÇOIT.',
          'Juboo demande ce que chaque membre VERSE : 10 000 F.',
          'Sinon, il réclamera 60 000 F à chaque membre, tous les mois.',
          'Ouvrez la tontine, puis le menu en haut à droite.',
          'Choisissez ensuite « Modifier la tontine ».');
        if (!isAmount(t.contributionAmount, 10000)) return V('WRONG', 'non',
          'Ce n\'est pas le bon montant.',
          'Chaque membre cotise 10 000 F par mois.');
        // Le nombre de mains ne se rattrape PAS : la seule issue est de dissoudre et recommencer.
        if (mains < 6) return V('ALMOST', 'corrige',
          'Le montant est bon.',
          'Mais vous êtes six en vous comptant. Il manque une main.',
          'Une main de moins, c\'est un tour de moins : une personne ne recevrait rien.',
          'Le nombre de mains ne se modifie plus ensuite : il fixe les tours.',
          'Ouvrez le menu en haut à droite, choisissez « Dissoudre la tontine », et recommencez.');
        if (mains > 6) return V('ALMOST', 'corrige',
          'Le montant est bon, mais vous avez trop de mains.',
          'Vous êtes six : il faut six mains, donc six tours.',
          'Cela ne se modifie plus : ouvrez le menu en haut à droite, puis « Dissoudre ».');
        return V('DONE', 'bravo',
          'Parfait : 10 000 F par main, six mains et six tours.',
          'La cagnotte sera de 60 000 F, et Juboo la calcule tout seul.');
      }
    }]
  });
})();
