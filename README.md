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
3. Le **premier connecte = l'hote** : tu choisis le theme + le nombre de questions (5/10/15) et tu cliques **Démarrer**.
4. A chaque question, 30 s pour repondre. Plus tu reponds vite et juste, plus tu marques. Le reveal arrive des que tout le monde a repondu (ou a la fin du chrono).
5. A la fin : podium + classement. L'hote peut **Rejouer** (nouvelles questions tirees au hasard).

## Notes
- Les scores sont en memoire le temps de la partie, rien n'est sauvegarde.
- Si un pote n'arrive pas a se connecter : verifiez que vous etes sur le meme WiFi, et que le pare-feu de ta machine autorise le port 3000 (Windows demande souvent l'autorisation au premier lancement, accepte les reseaux prives).
- Changer le port : `PORT=4000 npm start`.
- Voir la taille du pool de questions par theme : `node server.js count`.
- Reglages dans `server.js` en haut : `DUR` (duree par question, 30 s) et `PAUSE` (pause entre questions, 5 s).
