# juboo-website

Le site de Juboo : une page d'accueil courte, et le tutoriel de l'application, jouable dans le
navigateur.

- `index.html` : l'accueil, avec les trois espaces, les prix et l'installation par WhatsApp.
- `jouer.html?lecon=<id>` : le lecteur. Il affiche les captures de l'application et dessine
  par-dessus le guide, sa bulle, la fiche de la situation et la zone à toucher.
- `lecons/lecons.json` : les trois leçons du site.
- `lecons/<id>.json` : une leçon, c'est-à-dire ses écrans, ses zones et son dialogue (champ
  `dire`). C'est là qu'on modifie ce que dit le guide.
- `captures/<id>/` : les captures de la leçon, prises **sans** le guide.
- `assets/guide/` : les sept humeurs du guide, reprises de l'application.
- `assets/whatsapp.js` : la fenêtre de confirmation avant WhatsApp (version 1, offre de
  lancement), partagée par l'accueil et la fin des leçons.

C'est un site statique, sans cookie ni mesure d'audience. Il est hébergé sur GitHub Pages.
Ce dépôt ne contient **aucun code de l'application**.

Les captures sont de vrais écrans de l'application (Tecno, 720 px de large, barre d'état
retirée), prises le 28/09/2026 dans un carnet d'essai : aucune donnée réelle. Le paiement Wave
de la leçon « Noter une dette » est rejoué par le site, qui dessine la notification par-dessus
la capture.
