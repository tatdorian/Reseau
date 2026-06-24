# Quiz Réseau — Multijoueur (LAN)

Quiz réseau en temps réel facon Kahoot. Tout le monde voit la **meme question en meme temps**, chrono **30 s**, scoring a la vitesse + bonus de serie, classement live et podium final.

Supporte une **dizaine de joueurs** (voire plus) dans le meme lobby. Plus de **200 questions distinctes par theme** (generees a la volee : calculs de sous-reseaux, protocoles/ports/couches OSI, distances administratives, couts OSPF, plages VLAN/ACL...), donc tres peu de repetitions meme sur plusieurs parties.

Themes : VLAN, Routage (OSPF/RIP/statique), Adressage IP, Modele OSI, ACL.

## Ce qu'il faut
- **Toi (l'hote)** : Node.js installe + ces fichiers. C'est toi qui heberges.
- **Tes potes** : juste un navigateur, sur le **meme reseau WiFi** que toi. Rien a installer.

## Lancer (cote hote)
Dans le dossier des fichiers :

```
npm install
npm start
```

Le terminal affiche deux adresses, par exemple :

```
Toi       : http://localhost:3000
Tes potes : http://192.168.1.42:3000   (meme WiFi)
```

## Jouer
1. Toi : ouvre `http://localhost:3000`, choisis un pseudo.
2. Tes potes : ouvrent l'adresse `http://192.168.x.x:3000` affichee dans ton terminal, choisissent un pseudo.
3. L'**hote** (la machine qui heberge, ouverte sur `http://localhost`) choisit le theme, le **niveau** (Facile / Moyen / Difficile / Tous niveaux) et le nombre de questions (5/10/15), puis clique **Démarrer**. Tes potes ne peuvent rejoindre le lobby **que si l'hote y est present**.
4. A chaque question, 30 s pour repondre. Plus tu reponds vite et juste, plus tu marques. Le reveal arrive des que tout le monde a repondu (ou a la fin du chrono). Une **explication detaillee** + la bonne reponse s'affichent ; c'est l'**hote** qui clique **Question suivante** quand il veut faire passer (pas de minuteur automatique).
5. A la fin : podium + classement. L'hote peut **Rejouer** (nouvelles questions tirees au hasard).

## Notes
- Les scores sont en memoire le temps de la partie, rien n'est sauvegarde.
- Si un pote n'arrive pas a se connecter : verifiez que vous etes sur le meme WiFi, et que le pare-feu de ta machine autorise le port 3000 (Windows demande souvent l'autorisation au premier lancement, accepte les reseaux prives).
- Changer le port : `PORT=4000 npm start`.
- Voir la taille du pool de questions par theme : `node server.js count`.
- Reglage dans `server.js` en haut : `DUR` (duree par question, 30 s). Le passage a la question suivante est desormais declenche manuellement par l'hote.
- Niveaux de difficulte : les questions sont taggees Facile / Moyen / Difficile et filtrees selon le choix de l'hote. Le niveau Difficile ajoute un pool de questions type examen CCNA 200-301 (scenarios, depannage de config, VLSM, election DR/BDR, longest prefix match, EUI-64, ACL etendues, port-security...). L'ordre des reponses est melange a chaque tirage. Si un niveau a trop peu de questions pour le total demande, le pool est complete avec les autres niveaux.
- Anti-repetition : les questions du questionnaire precedent sont evitees au tirage suivant, donc ca change a chaque partie.
- Profil / Passe de combat : chaque joueur gagne de l'XP (= son score) a la fin de chaque partie, monte de niveau et debloque des recompenses. La progression est sauvegardee dans le navigateur (localStorage), sans compte. Bouton "Profil · Passe de combat" sur l'ecran d'accueil et dans le lobby. Recompenses :
  - Avatars (emoji) affiches a cote du pseudo, dans le classement et sur le podium ;
  - Titres affiches sous/a cote du pseudo (ex. "Maitre du subnetting", "Legende du CCNA") ;
  - Themes de couleur qui changent l'accent de l'interface (cosmetique locale).
