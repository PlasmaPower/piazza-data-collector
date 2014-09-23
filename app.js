var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var request = require('request')
var jar = request.jar();
request = request.defaults({jar: jar});
var chalk = require('chalk');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

var app = module.exports = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

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

app.config = new EventEmitter();

fs.readFile(__dirname + '/config.json', 'utf8', function (err,data) {
  if (err) {
    console.log(chalk.red('Could not read app.config: ' + err));
    process.exit(1);
  }
  app.config.raw = data;
  try {
    app.config.json = JSON.parse(data);
  } catch (e) {
    console.log(chalk.red('Failed to parse app.config: ' + e));
    process.exit(2);
  }
  app.config.emit('load');
});

app.wrapper = {
  api: function (method, params, callback) {
    request.post(
      {
        url: 'https://www.piazza.com/logic/api',
        form: JSON.stringify({
          method: method,
          params: params
        }),
        qs: {
          method: method
        }
      }, function (error, response, body) {
        if (callback !== null && callback !== undefined) {
          if (error !== null && error !== undefined) {
            callback(error, '');
          }
          var json;
          try {
            json = JSON.parse(body);
          } catch (err) {
            callback(chalk.red('Received invalid respsonse:') + '\n\r' +
              body + '\n\r' + chalk.red('JSON parse error: ' + err, ''));
          }
          if (!!json.error) {
            callback(json.error, json);
          }
          callback(null, json);
        }
      });
  },
  auth: function (email, password, callback) {
    this.api('user.login', {
      email: email,
      pass: password
    }, callback);
  },
  classLoad: function (email, password, callback) {
    request.post(
      {
        url: 'https://www.piazza.com/logic/api',
        form: JSON.stringify({
          from: '/signup',
          email: email,
          password: password,
          remember: 'off'
        })
      }, function (error, response, body) {
        if (callback !== null && callback !== undefined) {
          if (error !== null && error !== undefined) {
            callback(error, '');
          }
          callback();
        }
      });
  },
  getContent: function (cid, nid, callback) {
    this.api('content.get', {
      cid: '' + cid,
      nid: app.config.json.nid
    }, callback);
  },
  getFeed: function (callback) {
    this.api('network.get_my_feed', {
      nid: app.config.json.nid,
      offset: 20,
      limit: 150,
      sort: 'updated'
    }, callback);
  },
  getNumUsers: function (callback) { // Seems to initiate the networking protocall
    this.api('network.get_online_users', {
      nid: app.config.json.nid,
      uid: app.config.json.uid
    }, callback);
  }
};

app.config.on('load', function () {
  app.wrapper.auth(app.config.json.email, app.config.json.password, function (err, body) {
    if (err !== null) {
      console.log(chalk.red('Error sending authentication: ' + err));
      process.exit(20);
    }
    console.log(chalk.green('Successfully sent authentication'));
    console.log('Cookies: ' + jar.getCookieStringSync('https://www.piazza.com/logic/api'));
    app.wrapper.getNumUsers(function (err, body) {
      if (err !== null) {
        console.log(chalk.red('Error getting online users: ' + err));
        process.exit(21);
      }
      console.log(chalk.green('Successfully sent getNumUsers'));
      console.log(body);
      console.log(chalk.green('Starting up server...'));
      app.server = app.listen(3000, function() {
          console.log(chalk.green('Listening on port %d'), app.server.address().port);
      });
    });
  });
});
