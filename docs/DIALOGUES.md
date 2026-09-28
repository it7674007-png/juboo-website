# Les dialogues du site

Sur le site, le visiteur **ne connaît pas Juboo**. Il vient de toucher un bouton pour qu'on lui
présente l'application. Le guide commence donc par se présenter, dit où l'on est, puis met le
visiteur en situation. Le vocabulaire est sérieux, les phrases sont courtes, et il n'y a qu'une
idée par bulle, comme dans l'application.

Les situations, les noms et les montants restent **ceux de l'application**. Seules les phrases
changent : elles sont adaptées à quelqu'un qui découvre Juboo.

- `Suivant` : le visiteur passe à la phrase suivante.
- `[toucher]` : il touche la zone qui clignote.
- `[saisir]` : il écrit une valeur dans le champ.

---

## Prêts entre proches — « Prêter ou emprunter »

La leçon est jouable ; le texte exact se trouve dans `lecons/pret_deux_sens.json`.

**Accueil**
1. Bonjour, et bienvenue sur Juboo.
2. Je suis le guide de l'application. Vous avez choisi de découvrir l'espace « Prêts entre proches ».
3. Il sert à noter l'argent que vous prêtez à vos proches, et celui qu'ils vous prêtent.
4. Plutôt qu'une longue explication, mettons-nous en situation.
5. L'écran que vous voyez est celui de l'application. Touchez simplement là où je vous l'indique. `Commencer`

**Étape 1 sur 2**, avec la fiche « Ce que Malick demande »
- Votre cousin Malick passe vous voir.
- Il a besoin de 20 000 F pour un imprévu, et promet de vous rembourser à la fin du mois.
- C'est vous qui prêtez. Touchez « Noter un prêt ». `[toucher]`
- Voici le formulaire du prêt. Les renseignements de Malick restent sur la fiche.
- Touchez le premier champ, et écrivez son nom. `[saisir] Malick Diagne`
- Son numéro de téléphone, maintenant. `[saisir] 77 666 55 44`
- Enfin, la somme prêtée. `[saisir] 20 000`
- Le motif et la date de remboursement sont remplis.
- Touchez « Ajouter » pour enregistrer le prêt. `[toucher]`
- Voilà. Malick vous doit 20 000 F, avec une date de remboursement.
- Si la date passe sans remboursement, Juboo vous le rappellera.

**Étape 2 sur 2**, avec la fiche « Ce que Serigne vous prête »
- Le même jour, en fin d'après-midi.
- Votre voisin Serigne vous prête 5 000 F pour la boutique.
- Cette fois, c'est vous qui devez.
- Dans Juboo, les deux côtés ne se mélangent jamais. Touchez l'onglet « Je dois ». `[toucher]`
- Voici ce que vous devez. Pour l'instant, rien.
- Touchez « Noter un emprunt ». `[toucher]`
- Le même formulaire, mais du côté de ce que vous devez.
- Écrivez le nom de Serigne. `[saisir] Serigne Mbaye`
- Son numéro de téléphone. `[saisir] 77 888 77 66`
- Et la somme empruntée. `[saisir] 5 000`
- Tout est rempli. Touchez « Ajouter ». `[toucher]`
- Parfait. On vous doit 20 000 F, et vous devez 5 000 F.
- Votre solde est de 15 000 F, et il est juste.

**Fin**
- La démonstration est terminée.
- D'un côté ce qu'on vous doit, de l'autre ce que vous devez : personne n'a plus besoin de s'en souvenir.
- Dans l'application, je vous accompagne dans 17 autres leçons.
- Et vos comptes restent sur votre téléphone, même sans internet. `Terminer`

---

## Ma boutique (Cahier) — « Noter une dette »

Il faut les captures de cette leçon pour qu'elle soit jouable.

**Accueil**
1. Bonjour, et bienvenue sur Juboo.
2. Je suis le guide de l'application. Vous avez choisi de découvrir le Cahier Digital.
3. C'est le carnet de crédit de votre boutique : ce que vos clients vous doivent, et ce qu'ils vous ont déjà payé.
4. Plutôt qu'une longue explication, mettons-nous en situation.
5. Imaginons que vous teniez une boutique au marché Sandaga. Touchez l'écran là où je vous l'indique. `Commencer`

**Étape 1 sur 3**, avec la fiche « Ce que Moussa a pris »
- Il est neuf heures. Vous ouvrez la boutique.
- Moussa Diop, votre voisin, prend une bouteille d'huile, une bouteille d'eau, deux brioches et un jus.
- Le total est de 3 400 F, mais il ne vous donne que 1 400 F.
- Touchez « Nouvelle Entrée » pour noter cette vente. `[toucher]`
- Écrivez d'abord son nom. `[saisir] Moussa Diop`
- Puis son numéro. `[saisir] 77 123 45 67`
- Dans « Montant total », notez le prix de toute la vente, et non ce qui reste dû. `[saisir] 3 400`
- Dans « Déjà versé », notez ce qu'il vous a donné. `[saisir] 1 400`
- Touchez « Enregistrer ». `[toucher]`
- Très bien. Il vous doit encore 2 000 F, et vous avez vendu pour 3 400 F.
- Le Cahier garde les deux chiffres : la vente, et ce qui reste dû.

**Étape 2 sur 3**, avec la fiche « Ce qu'Awa a pris »
- La matinée continue.
- Awa Ndiaye prend pour 5 000 F de marchandise. Elle ne vous donne rien aujourd'hui.
- Elle passera payer demain.
- Notez la dette, et surtout la date à laquelle elle paiera. Touchez « Nouvelle Entrée ». `[toucher]`
- Son nom. `[saisir] Awa Ndiaye`
- Son numéro. `[saisir] 77 555 44 33`
- Le montant. `[saisir] 5 000`
- Pour la date de paiement, touchez « Demain ». `[toucher]`
- Touchez « Enregistrer ». `[toucher]`
- Parfait. Si elle n'a pas payé demain soir, Juboo vous le rappellera.
- Vous n'aurez pas à y penser.

**Étape 3 sur 3**
- Deux clients sont notés.
- Pour le troisième, vous n'aurez rien à faire.
- Regardez : Moussa vient de vous envoyer ses 2 000 F par Wave.
- Juboo a reconnu son numéro, et il a soldé sa dette tout seul.
- Chaque paiement Wave reconnu, c'est une saisie de moins pour vous.

**Fin**
- La démonstration est terminée.
- Vous avez noté une dette, l'acompte reçu et la date de paiement.
- Et vous avez vu Juboo enregistrer un paiement Wave sans que vous ne tapiez rien.
- Dans l'application, je vous accompagne dans 17 autres leçons. `Terminer`

---

## Mes tontines — « Créer une tontine »

Il faut les captures de cette leçon pour qu'elle soit jouable.

**Accueil**
1. Bonjour, et bienvenue sur Juboo.
2. Je suis le guide de l'application. Vous avez choisi de découvrir l'espace « Mes tontines ».
3. Une tontine se tient bien sur un cahier, tant que personne ne conteste.
4. Juboo en garde la mémoire : qui a cotisé, et qui a déjà reçu la cagnotte.
5. Plutôt qu'une longue explication, mettons-nous en situation. `Commencer`

**Étape unique**, avec la fiche « La tontine du marché »
- Cinq commerçantes du marché veulent créer une tontine avec vous.
- Vous serez six en tout, en vous comptant. Chaque membre verse 10 000 F par mois.
- Chaque mois, l'une d'entre vous reçoit toute la cagnotte : 60 000 F.
- Touchez « Créer ou reprendre une tontine ». `[toucher]`
- Cette tontine commence aujourd'hui. Touchez « Non, elle commence ». `[toucher]`
- Donnez-lui un nom. `[saisir] La tontine du marché`
- Attention : Juboo demande ce que chaque membre verse, et non le montant de la cagnotte. `[saisir] 10 000`
- Les membres cotisent chaque mois. Touchez « Mensuelle ». `[toucher]`
- Le nombre de mains fixe le nombre de tours : une main par personne. `[saisir] 6`
- Touchez « Créer ». `[toucher]`
- Parfait : 10 000 F par main, six mains et six tours.
- La cagnotte sera de 60 000 F, et Juboo la calcule tout seul.

**Fin**
- La démonstration est terminée.
- Juboo tient les comptes : qui a payé, qui a reçu, et combien de tours il reste.
- Dans l'application, je vous accompagne dans 17 autres leçons. `Terminer`
