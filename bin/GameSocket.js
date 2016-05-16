module.exports =
    (function (app, io) {

        var Player = require("../bin/Player"),
            players;

        players = [];

        io.on('connection', onConnection);

        function onConnection(socket) {
            socket.on("disconnect", function () {
                var disconnectPlayer;
                for (var i = 0; i < players.length; i++) {
                    if (players[i].id == socket.id) {
                        disconnectPlayer = players[i];
                        io.emit('remove player', disconnectPlayer);
                        players.splice(i, 1);
                        break;
                    }
                }

            });

            socket.on('new player', function (data) {
                var player = new Player(data.x, data.y,data.rotation,data.turretRotation, data.id);
                players.push(player);
                io.emit('new player', players);
            });

            socket.on('player move', function(data){
                var updatePlayer = playerById(data.id);
                updatePlayer.x = data.x;
                updatePlayer.y = data.y;
                updatePlayer.rotation = data.rotation;
                updatePlayer.turretRotation = data.turretRotation;
                socket.broadcast.emit('player move', {playerData: updatePlayer});
            });


            socket.on('fire', function (data) {
               socket.broadcast.emit('fire', data);
            });

            socket.on('hitPlayer', function(data){
               var playerHit = playerById(data.playerHit);
                var playerGetHit = playerById(data.playerGetHit);
                playerHit.hit += 1;
                playerGetHit.hit -=1;
                io.sockets.emit('playerHited', data);

            });


            socket.on('died', function (data) {
                socket.broadcast.emit('playerDied', data);
            });

            socket.on('playerAlive', function (data) {
                console.log(data);
                var player = playerById(data.id);
                player.hit = 3;
                socket.broadcast.emit('alive', player);
            });

        };

        function playerById(id) {
            for (var i = 0; i < players.length; i++) {
                if (players[i].id == id)
                    return players[i];
            }
            ;
            return false;
        };

    });