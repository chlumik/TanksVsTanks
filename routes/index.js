var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Vítejte' });
});

router.get('/game', function (req, res, next) {
  res.render('game', {title: 'Tanks vs Tanks'})
})

module.exports = router;
