const uuid = require('uuid/v4');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const settings = require('./settings');

// Instanciation du serveur web, de Express et de Socket.io
const app = express();
const server = http.Server(app);
const io = socketio(server);

// Run HTTP server
server.listen(settings.port, () => {
  console.log('Listening on port ' + settings.port);
});

// Contenu du dossier public accessible sur le web
app.use('/', express.static(__dirname + '/public'));

// Liste des connectés
const users = [];

// Connexion des clients socket.io
io.on('connection', (socket) => {
  console.log('User (' + socket.id + ') vient de se connecter');

  // Ajout d'un connecté
  const user = {
    id: socket.id,
    // Nom au hasard dans la liste des noms par défaut
    nickname: 'Anonymous',
    icon: settings.defaultIcons[Math.floor(Math.random() * settings.defaultIcons.length)],
    // Position initiale du user à l'écran
    position: {
      x: Math.random() * 100,
      y: Math.random() * 100
    }
  };
  users.push(user);

  // Diffusion de la liste de connectés à tout le monde
  io.emit('users', users);

  // Déconnexion de l'utilisateur
  socket.on('disconnect', () => {
    console.log('User (' + socket.id + ') vient de se déconnecter');
    // Suppression du user de la liste
    users.splice(users.indexOf(user), 1);
    // Diffusion de la liste de connectés à tout le monde
    io.emit('users', users);
  });

  // Réception d'un nouveau message
  socket.on('msg', (txt) => {
    // Nouvel objet message avec un id et une date
    const message = {
      id: uuid(),
      userId: user.id,
      date: new Date().getTime(),
      txt
    };
    // Diffusion du message auprès de tous les connectés
    io.emit('msg', message);
  });

  // Réception d'un event "nick"
  // pour changer de pseudo
  socket.on('nick', (nickname) => {
    user.nickname = nickname;
    io.emit('users', users);
  });

  // Réception d'un event "move"
  // pour changer de position
  socket.on('move', (position) => {
    user.position = position;
    io.emit('users', users);
  });

});
