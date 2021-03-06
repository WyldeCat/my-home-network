var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var secure = require('./routes/secure');
var users = require('./routes/users');

var app = express();

// for web server
var http = require('http').Server(app);
var io = require('socket.io')(http);

http.listen(4000);

io.on('connection',function(socket) {
  console.log('client connected..!');
});

// for udp server
var port = 4001;
var host = '127.0.0.1';
var dgram = require('dgram');
var udp = dgram.createSocket('udp4');

udp.on('listening',function() {
  var addr = udp.address();
  console.log('UDP Server listening on..');
});
udp.on('message',function(message, remote) {
  // send to all web browser
  io.sockets.emit('update',String(message));
});

udp.bind(port,host);


// checking Authentication every time
function checkAuth(req,res,next) {
  console.log('checkAuth' + req.url);

  // if url is /secure.. authentication need to be checked
  if( (req.url == '/secure') && (!req.session || !req.session.authenticated)) {
    //render error message
    res.send('<h1>Not authenticated</h1>');
  }
  next();
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
 secret : 'abc123',
 authenticated : false
}));
// set checkAuth function for ...
app.use(checkAuth);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/secure', secure);
app.use('/users', users);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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

module.exports = app;
