# KILLSPY 🎯🔫

KILLSPY est un jeu inspiré du jeu classique **007**, adapté en version numérique jouable **en ligne** ou **contre des bots**. Il combine **stratégie**, **réflexes** et **tactique**, avec un gameplay dynamique inspiré des affrontements rapides du jeu original.

## 🎮 Fonctionnalités
- **Duel en ligne 1v1** 🕹️ : partie rapide ou classée, arbitrée par le serveur.
- **Mode contre l'IA** 🤖 : trois niveaux de difficulté, sans impact sur le classement.
- **Boutique & inventaire** 🛒 : cosmétiques par rareté, achetés avec les pièces gagnées en jeu.
- **Social** 👥 : amis, messages privés, guildes (QG), missions quotidiennes, classement.

## 🕹️ Comment jouer ?
À chaque tour, les deux joueurs choisissent une action en secret :
- **Recharger** 🔄 : gagne une munition (3 maximum).
- **Tirer** 🎯 : coûte une munition, retire une vie à l'adversaire s'il ne se protège pas.
- **Se protéger** 🛡️ : bloque un tir.

Le premier à faire tomber les 3 vies adverses gagne.

## 🧱 Structure du dépôt
| Dossier | Contenu |
|---|---|
| `api/` | API REST + serveur de jeu temps réel (Express, Prisma/PostgreSQL, socket.io) |
| `game/` | Application (Expo / React Native, iOS · Android · Web) |
| `design_handoff_killspy/` | Maquettes et spécifications du design system |

## 🚀 Démarrage

Prérequis : Node.js 22 et une base PostgreSQL.

### API
```bash
cd api
npm install
cp exemple_dotenv.txt .env      # puis renseigner DATABASE_URL, DIRECT_URL, JWT_SECRET
npx prisma migrate deploy
npm run seed                    # cosmétiques, offres de boutique, missions
npm start                       # http://localhost:4000 (rechargement auto)
```

### Application
```bash
cd game
npm install
cp exemple.env.txt .env         # EXPO_PUBLIC_API_URL=http://<ip-de-la-machine>:4000/api
npm start                       # puis a (Android), i (iOS) ou w (web)
```

### Vérifications
```bash
cd api  && npm run build && npm test
cd game && npm run typecheck && npm test
```

### Docker (API + version web)
```bash
docker compose up --build       # API sur :4000, web sur :3000
```

## 🏆 Roadmap
- Nouveaux modes de jeu (Original, Battle Royale…)
- Appariement classé par niveau et reconnexion en cours de partie
- Réinitialisation de mot de passe, demandes d'amis, blocage et signalement

## 📜 Licence
© 2025 MIMIR STUDIO. Tous droits réservés.

Ce logiciel est la propriété exclusive de MIMIR STUDIO. Toute utilisation, modification, reproduction ou distribution, en totalité ou en partie, sans autorisation écrite préalable est strictement interdite.
