/*
// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let waitingPlayers = []; // Liste des joueurs en attente
console.log(waitingPlayers, waitingPlayers.length);
io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');

    // Écoutez l'événement de recherche de partie
    socket.on('joinGame', () => {
        // Vérifiez si le joueur est déjà dans la liste d'attente
        if (waitingPlayers.includes(socket)) {
            console.log('Le joueur essaie de rejoindre une partie alors qu\'il est déjà en attente.');
            return; // Ne rien faire si le joueur est déjà en attente
        }

        waitingPlayers.push(socket);
        console.log('Un joueur a rejoint la recherche de partie. Nombre de joueurs en attente:', waitingPlayers.length);

        // Si un autre joueur est en attente, créez une partie
        if (waitingPlayers.length >= 2) {
            const player1 = waitingPlayers.shift(); // Retirer le premier joueur
            const player2 = waitingPlayers.shift(); // Retirer le deuxième joueur

            console.log('Création d\'une partie entre:', player1.id, 'et', player2.id);
            player1.emit('gameFound', { opponentId: player2.id });
            player2.emit('gameFound', { opponentId: player1.id });
        }
    });

    socket.on('cancelSearch', () => {
        waitingPlayers = waitingPlayers.filter(player => player.id !== socket.id);
        console.log('Un joueur a annulé la recherche de partie. Nombre de joueurs en attente:', waitingPlayers.length);
    });

    socket.on('playerAction', (action) => {
        // Gérer l'action du joueur
        console.log('Action du joueur:', action);
        // Émettre l'action à l'autre joueur
        socket.broadcast.emit('opponentAction', action);
    });

    socket.on('winner', (winner) => {
        // Gérer la fin du jeu
        io.emit('gameOver', winner);
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur est déconnecté');
        // Retirer le joueur de la liste d'attente s'il est présent
        waitingPlayers = waitingPlayers.filter(player => player.id !== socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Serveur WebSocket en cours d'exécution sur http://localhost:${PORT}`);
});
*/