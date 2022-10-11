var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // 未ログイン状態の時には/loginにリダイレクトされる。
  // そうでなければnext()により次のコールバック関数が呼ばれ、index.hjsがrenderされる。
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
},(req, res, next) => {
  // 最終リクエストの10秒後にセッションが失効する
  req.session.cookie.expires = new Date(Date.now() + 10 * 1000);
  res.render('index', { title: 'Express', username: req.user});
});

module.exports = router;