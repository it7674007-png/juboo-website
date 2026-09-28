# juboo-website

Le site de Juboo : une page d'accueil courte, et le tutoriel de l'application, jouable dans le
navigateur.

- `index.html` : l'accueil, avec les trois espaces, les prix et l'installation par WhatsApp.
- `jouer.html?lecon=<id>` : le simulateur. Les écrans de Juboo y sont refaits en HTML, avec un
  vrai carnet derrière : on tape ce qu'on veut, on appuie où l'on veut, et on peut se tromper
  comme dans l'application. Le guide juge ce que le carnet contient, pas les appuis.
- `assets/simulateur.js` et `assets/simulateur.css` : le téléphone, ses écrans (Cahier, Tontines,
  Prêts), et la logique du guide reprise de l'application (bulle, fiche, « Indice »,
  « Recommencer », bouton qui bat, aide après 25 secondes).
- `lecons/lecons.json` : les trois leçons du site.
- `lecons/<id>.js` : une leçon — ce que dit le guide, la fiche de la situation, et comment chaque
  étape juge le carnet. Les répliques et les jugements sont ceux de l'application, mot pour mot
  (`TutorialScenario.kt`, `TontineScenarios.kt`, `PretScenarios.kt`) ; seuls l'accueil du
  visiteur et la fin (« ce n'était qu'un aperçu ») sont propres au site.
- `assets/guide/` : les sept humeurs du guide, reprises de l'application.
- `assets/whatsapp.js` : la fenêtre de confirmation avant WhatsApp (version 1, offre de
  lancement), partagée par l'accueil et la fin des leçons.

Le téléphone est dessiné à 360 points de large, la largeur de l'application sur le Tecno, avec
les mesures et les couleurs relevées sur ses captures ; il est ensuite agrandi pour remplir
l'écran.

C'est un site statique, sans cookie ni mesure d'audience. Il est hébergé sur GitHub Pages.
Ce dépôt ne contient **aucun code de l'application**.
