# juboo-website

Le site de Juboo : une page d'accueil courte, et le tutoriel de l'application, jouable dans le
navigateur.

- `index.html` : l'accueil, avec les trois espaces, les prix, le téléchargement et WhatsApp.
- `jouer.html?lecon=<id>` : le lecteur. Il affiche les captures de l'application et dessine
  par-dessus le guide, sa bulle, la fiche de la situation et la zone à toucher.
- `lecons/lecons.json` : les trois leçons du site.
- `lecons/<id>.json` : une leçon, c'est-à-dire ses écrans, ses zones et son dialogue.
- `captures/<id>/` : les captures de la leçon, prises **sans** le guide.
- `assets/guide/` : les sept humeurs du guide, reprises de l'application.
- `docs/DIALOGUES.md` : les dialogues des trois leçons, adaptés au visiteur.

C'est un site statique, sans cookie ni mesure d'audience. Il est hébergé sur GitHub Pages.
Ce dépôt ne contient **aucun code de l'application**.

La leçon « Prêter ou emprunter » tourne pour l'instant sur des **écrans provisoires**, tirés
d'une vidéo. Ils seront remplacés par les vraies captures.
