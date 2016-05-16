var Player = function (startX, startY, rotation, turretRotation, id) {
    var x = startX,
        y = startY,
        rotation = rotation,
        turretRotation = turretRotation,
        hit = 0,
        id = id


    return {
        x: x,
        y: y,
        rotation: rotation,
        turretRotation: turretRotation,
        hit: hit,
        id: id

    }
};

module.exports = Player;