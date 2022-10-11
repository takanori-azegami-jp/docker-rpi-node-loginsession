const express = require('express');
const router = express.Router();

router.get('/login', (req, res, next) => {
  res.render('local', { title: 'local login', username: 'hogehoge'});
});

module.exports = router;