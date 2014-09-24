var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var chalk = require('chalk');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var XMLHttpRequest = require('xmlhttprequest-cookie').XMLHttpRequest;

var app = module.exports = express();

var api = require('./api.js');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
/*app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});*/

api.config.on('load', function () {
  api.wrapper.auth(api.config.json.email, api.config.json.password, function (err, body) {
    if (err !== null) {
      console.log(chalk.red('Error sending authentication: ' + err));
      process.exit(20);
    }
    api.wrapper.getNumUsers(api.config.json.nid, api.config.json.uid, function (err, result) {
      if (err !== null) {
        console.log(chalk.red('Error getting online users: ' + err));
        process.exit(21);
      }
      if (result === null) {
        console.log(chalk.yellow('Null response recieved for test network request'));
      } else {
        console.log(chalk.green('Successfully sent test network request'));
      }
      console.log(chalk.green('Starting up server...'));
      app.server = app.listen(api.config.json.port, function() {
          console.log(chalk.green('Listening on port %d'), app.server.address().port);
      });
    });
  });
});

setInterval(function () {
  api.wrapper.auth(api.config.json.email, api.config.json.password, function (err, body) {
    if (err !== null) {
      console.log(chalk.yellow('Error sending authentication: ' + err));
    } else {
      console.log(chalk.green('Refreshed authentication and data'));
    }
  });
}, 3600000); // One hour
