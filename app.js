var createError = require('http-errors');
var express = require('express');
require('dotenv').config();
require('./models/db');
var path = require('path');
var cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
var logger = require('morgan');

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
console.log(process.env.APP_NAME);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(logger('dev'));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));

app.use('/api', userRouter);
app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use((req, res, next) => {
  if (req.session) {
    res.locals.messages = req.session.messages;
    res.locals.userInfo = req.session.userInfo;
    req.session.messages = {};
  }
  next();
});

app.use('/admin', adminRouter);
//socket
const http = require("http").Server(app);

const io = require('socket.io')(http, { cors: { origin: '*' } });
global.io = io;
global.appRoot = path.resolve(__dirname);

app.use(cors({ origin: '*' }));
require('./controllers/socketController')(io);

app.get('/', (req, res) => {
  res.render('pages/welcome');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

http.listen(3000, () => {
  console.log('port is listening');
});
