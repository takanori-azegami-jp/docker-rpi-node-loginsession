const createError = require('http-errors');
const local = require('passport-local');

const localAuthStrategy = new local.Strategy(
  (username, password, done) => {
    // 仮の認証ロジック。目的に合わせてデータベースに問い合わせたりする。
    if(username === 'hogehoge') {
      done(null, username);
    } else {
      done(createError(401, 'username: hogehogeさん以外はログインできません。'))
    }
  }
);

module.exports = localAuthStrategy;