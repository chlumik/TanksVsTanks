RemotePlayer = function (id, game, startX, startY) {

    var x = startX;
    var y = startY;

    this.game = game;
    this.health = health;
    this.alive = true;
    this.id = id;
    this.player = game.add.sprite(x, y, 'tank');
    this.player.turret = game.add.sprite(x, y, 'turret');
    this.player.turret.anchor.set(0.5, 0.5);
    this.player.anchor.setTo(0.5, 0.5);
    game.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.width = this.player.width / 1.4;
    this.player.height = this.player.height / 1.4;
    this.player.turret.width = this.player.turret.width / 1.4;
    this.player.turret.height = this.player.turret.height / 1.4;

    this.player.angle = game.rnd.angle();
    this.player.body.immuvable = false;
    this.player.body.collideWorldBounds = true;
    this.player.body.bounce.setTo(1, 1);

    this.player.body.collideWorldBounds = true;
    this.bullets = game.add.group();
    this.bullets.enableBody = true;
    this.bullets.createMultiple(20, 'bullet', 0, false);
    this.bullets.setAll('anchor.x', -1);
    this.bullets.setAll('anchor.y', 0.5);
    game.physics.enable(this.bullets, Phaser.Physics.ARCADE);

};

var game = new Phaser.Game(32 * 16, 22 * 16, Phaser.AUTO);

var GameState = {
    preload: function () {
        game.load.tilemap('map', '../images/assets/mapa_tanky.json', null, Phaser.Tilemap.TILED_JSON);
        game.load.image('tiles', '../images/assets/tiles.png');
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL; // resize hry na celou plochu se zachovanim pomeru stran
        game.load.image('tank', '../images/assets/tankBase.png');
        game.load.image('bullet', '../images/assets/bullet_0.png');
        game.load.image('turret', '../images/assets/tankTurret.png');
        game.load.image('playAgainButton', '../images/assets/playAgain.png');
        game.load.image('join', '../images/assets/join.png');

    },

    create: function () {
         // Set socket io

        //socket = io();
        socket = io('http://localhost:3000');

        game.physics.startSystem(Phaser.Physics.ARCADE);
        // sestavení mapy z dlaždic
        map = game.add.tilemap('map');
        map.addTilesetImage('tiles', 'tiles');

        layer[0] = map.createLayer('travnik a jezero');
        layer[0].resizeWorld();
        layer[1] = map.createLayer('baraky prizemi');
        //layer[1].debug = true;
        map.setCollisionBetween(1, 1000, true, layer[1]);
        layer[1].resizeWorld();
        layer[2] = map.createLayer('baraky');//nazvy vrstem odpovidaji nazvum v mapa_tanky.json
        //layer[2].debug = true;
        layer[2].enableBody = true;
        map.setCollisionBetween(1, 1000, true, layer[2]);
        layer[2].resizeWorld();


        var x = game.world.randomX;
        var y = game.world.randomY;

        player = new RemotePlayer(0, game, x, y);


        game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
        cursors = game.input.keyboard.createCursorKeys();

        enemies = [];
        // Set handler
        setEventHandlers();

        statusText = game.add.text(0,0, "", {font: "12px", fill: "#FFF"});
        statusText.alpha = 0.8;
        updateStatusText();

        playAgainButton = game.add.button(game.world.centerX - 75, game.world.centerY - 17, 'playAgainButton', playAgain, this, 2, 1, 0);
        playAgainButton.visible = false;
    },

    update: function () {

        game.physics.arcade.collide(layer[1], player.bullets, killBullet);


        for (var i = 0; i < enemies.length; i++) {
            hitedPlayerID = enemies[i].id;
            game.physics.arcade.overlap(enemies[i].player, player.bullets, killEnemy);
            game.physics.arcade.overlap(enemies[i].bullets, player.player, killEnemyBullet);
            game.physics.arcade.collide(enemies[i].bullets, layer[1], killBullet);
            game.physics.arcade.collide(enemies[i].bullets, layer[2], killBullet);
        }
        game.physics.arcade.collide(player.player, layer[2]);
        game.physics.arcade.collide(player.player, layer[1]);

        player.player.body.velocity.set(0);
        player.player.body.velocity.x = 0;
        player.player.body.velocity.y = 0;
        player.player.body.angularVelocity = 0;

        if (cursors.left.isDown) {
            player.player.angle -= 4;
        }
        else if (cursors.right.isDown) {
            player.player.angle += 4;
        }

        if (cursors.up.isDown) {
            currentSpeed = 100;
        } else if (currentSpeed > 0) {
            currentSpeed = -10;
        }

        if (currentSpeed > 0) {
            game.physics.arcade.velocityFromAngle(player.player.angle, currentSpeed, player.player.body.velocity);
        }

        if (game.input.activePointer.isDown) {
            fireBullet();
        }

        player.player.turret.x = player.player.x;

        player.player.turret.y = player.player.y;

        player.player.turret.rotation = game.physics.arcade.angleToPointer(player.player.turret) + 3.14 / 2;
        socket.emit("player move", {
            x: player.player.x,
            y: player.player.y,
            rotation: player.player.rotation,
            turretRotation: player.player.turret.rotation,
            id: socket.id
        });

    }
};

var hitedPlayerID = 0;

function killBullet(bullet) {
    bullet.kill();
}
function killEnemyBullet(me, bullet){
    bullet.kill();
}
function killEnemy(enemy, bullet) {
    bullet.kill();
    var hitedPlayer = playerById(hitedPlayerID);
    socket.emit('hitPlayer', {playerHit: socket.id, playerGetHit: hitedPlayerID });
}

function updateStatusText() {
    var text = "Me: " + player.health + "\n";
    for (var i = 0; i < enemies.length; i++){
        text += "Player" + i + ": " + enemies[i].health + "\n";
    }
    statusText.setText(text);
}

function fireBullet() {
    if(!player.alive){ return ;}
   var bullet = player.bullets.getFirstDead();

    if (this.game.time.now > this.nextFire) {
        this.nextFire = this.game.time.now + this.fireRate;
        bullet.reset(player.player.x, player.player.y);
        bullet.rotation = game.physics.arcade.moveToPointer(bullet, 300);
        bullet.width = 10;
        bullet.height = 10;
        socket.emit('fire', {
            id: socket.id,
            pointerPositionX: game.input.mousePointer.x,
            pointerPositionY: game.input.mousePointer.y
        });
    }
}

// PlayAgain dodělat :-D
function playAgain() {
    player.health = health;
    player.player.reset(game.world.randomX, game.world.randomY);
    player.player.turret.reset();
    player.alive = true;
    playAgainButton.visible = false;
    socket.emit('playerAlive', {id: socket.id});
    updateStatusText();
}


// Helper objects
var socket;         // Socket connection
var map;
var player;
var enemies;
var fireRate = 400;
var nextFire = 100;
var currentSpeed = 0;
var cursors;
var layer = [];
var statusText = "";
var playAgainButton;
var health = 1;


game.state.add('GameState', GameState);
game.state.start('GameState');

var setEventHandlers = function () {
    // Socket connection successful
    socket.on("connect", onSocketConnected);

    // Socket disconnection
    socket.on("disconnect", onSocketDisconnect);

    // New player message received
    socket.on("new player", onNewPlayer);

    // Player move message received
    socket.on("player move", onMovePlayer);

    // Player removed message received
    socket.on("remove player", onRemovePlayer);

    //Player fire
    socket.on("fire", onPlayerFire);
    // PlayerHited
    socket.on("playerHited", playerHited);

    // PlayerDie
    socket.on('playerDied', playerDied);

    // Player Live
    socket.on('alive', playerAlive);
};

// Socket connected
function onSocketConnected() {
    console.log("Connected to socket server " + socket.id);
    // Send local player data to the game server
    socket.emit("new player", {
        x: player.player.x,
        y: player.player.y,
        rotation: player.player.rotation,
        turretRotation: player.player.turret.rotation,
        id: socket.id
    });
};

// Socket disconnected
function onSocketDisconnect() {
    socket.emit('disconnect', {id: socket.id});
    console.log("Disconnected from socket server");
};

// New player
function onNewPlayer(data) {

    for (var j = 0; j < data.length; j++) {
        if (!playerById(data[j].id)) {
            if ((data[j].id != socket.id)) {

                enemies.push(new RemotePlayer(data[j].id, game, data[j].x, data[j].y));
                updateStatusText();
            }
        }
    }
};

// Move player
function onMovePlayer(data) {
    var movePlayer = playerById(data.playerData.id);
    // Player not found
    if (!movePlayer) {
        if (data.id == socket.id) {
            return;
        }
        return;
    }
    ;

    // Update player position
    movePlayer.player.x = data.playerData.x;
    movePlayer.player.y = data.playerData.y;
    movePlayer.player.rotation = data.playerData.rotation;
    movePlayer.player.turret.x = data.playerData.x;
    movePlayer.player.turret.y = data.playerData.y;
    movePlayer.player.turret.rotation = data.playerData.turretRotation;

};

// Remove player
function onRemovePlayer(data) {
    var removePlayer = playerById(data.id);
    // Player not found
    if (!removePlayer) {
        console.log("Player not found: " + data.id);
        return;
    }
    ;
    removePlayer.player.kill();
    removePlayer.player.turret.kill();
    // Remove player from array
    enemies.splice(enemies.indexOf(removePlayer), 1);
    updateStatusText();
};

// Enemy fire
function onPlayerFire(data) {
    var playerFire = playerById(data.id);
    if (playerFire) {
        var bullet = playerFire.bullets.getFirstDead();
        bullet.reset(playerFire.player.x, playerFire.player.y);
        bullet.rotation = game.physics.arcade.moveToXY(bullet, data.pointerPositionX, data.pointerPositionY, 300);
        bullet.width = 10;
        bullet.height = 10;
    }
}

//PlayerHited
function playerHited(data) {
    var playerHit = playerById(data.playerHit);
    var playerGetHit = playerById(data.playerGetHit);
    if (!playerHit){player.health += 1;}
    if (!playerGetHit) {player.health -= 1;}
    playerHit.health += 1;
    playerGetHit.health -= 1;

    if (player.health < 1){
        socket.emit('died', {id: socket.id});
        player.player.kill();
        player.player.turret.kill();
        player.alive = false;
        playAgainButton.visible = true;
    }
    updateStatusText();
}

// PlayerDied
function playerDied(data) {
    var diedPlayer = playerById(data.id);
    diedPlayer.player.kill();
    diedPlayer.player.turret.kill();
    updateStatusText();

}

// Player alive
function playerAlive(data){
    var playerAlive = playerById(data.id);
    playerAlive.player.reset();
    playerAlive.player.turret.reset();
    playerAlive.health = health;
    updateStatusText();
}

// Find player by ID
function playerById(id) {
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].id == id)
            return enemies[i];
    }
    ;
    return false;
};