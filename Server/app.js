var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api');
var app = express();
var server = app.listen(3000);
var io = module.exports.io=require('socket.io').listen(server);
// io.on("connection", () => {
//   console.log("Connected!");
// });
const SocketManager = require('./socket/socketManager')

io.on('connection', SocketManager)
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", 'http://localhost:3001');
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});
app.use('/', indexRouter);
app.use('/api', apiRouter);



// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
