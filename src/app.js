const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const fs = require('fs');

// 認証を示す文字列('saml'等)を環境変数に追加すると、環境によって認証方法を変えられる
const authEnv = process.env.AUTHENTICATION_STRATEGY || 'local';
const authStrategy = require(`./auth/strategies/${authEnv}`);

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const loginRouter = require(`./routes/${authEnv}`);

const session = require('express-session')

// セッション管理に使うsecretファイルをマウントする場合は、環境変数に追加する
// kubernetesでsecretリソースを使う時などに重宝する
const secretDir = process.env.SESSION_SECRET_DIR || './../session-secret';
const sessionSecret = (() => {
  try {
    fs.readFileSync(`${secretDir}/everest-session-secret`);
  } catch (e) {
    if (e.code === 'ENOENT') return 'secret for local';
    throw  e;
  }
})();

const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false // この状態だとHTTPSじゃなくてもセッションをやり取りしてしまう。本番投入時はtrueで。
  }
};

// SESSION_STORE='redis' を設定した時のredis設定
if (process.env.SESSION_STORE === 'redis') {
  const RedisStore = require('connect-redis')(session);
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = Number(process.env.REDIS_PORT) || 6379;
  sessionOptions.store = new RedisStore({
    host: redisHost,
    port: redisPort,
    prefix: 'express:'
  })
}

const app = express();

app.use(session(sessionOptions));

passport.use(authStrategy);
app.use(passport.initialize());
app.use(passport.session());

// 認証したタイミングで呼ばれる。コールバック関数のuserにはStrategy上で実行したdone()の第二引数が入る。
// コールバック関数上のdone()の第二引数の値が任意のエンドポイント上のreq.userで取れるようになる。
passport.serializeUser((user, done) => {
  done(null, user);
});

// セッションが有効であれば、任意のエンドポイント上にアクセスしたタイミングで呼ばれる。
passport.deserializeUser((user, done) => {
  done(null, user);
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', loginRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);

// どんな認証方法でもこのパスを通じて認証されるように設定する。それか、loginRouterに移動する。
app.post('/',
  passport.authenticate(authEnv, { successRedirect: '/' })
);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;