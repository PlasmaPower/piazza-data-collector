// Handles the wrapper and config

var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var XMLHttpRequest = require('xmlhttprequest-cookie').XMLHttpRequest;
var chalk = require('chalk');

var config = new EventEmitter();

fs.readFile(__dirname + '/config.json', 'utf8', function (err,data) {
  if (err) {
    console.log(chalk.red('Could not read config: ' + err));
    process.exit(1);
  }
  config.raw = data;
  try {
    config.json = JSON.parse(data);
  } catch (e) {
    console.log(chalk.red('Failed to parse config: ' + e));
    process.exit(2);
  }
  config.emit('load');
});


var wrapper = new EventEmitter();
wrapper.api = function (method, params, callback) {
  //TODO: Figure out why this works but the request library doesn't
  var x = new XMLHttpRequest();
  x.onreadystatechange = function () {
    if (x.readyState === 4) {
      if (x.status !== 200) {
        callback('Response code' + x.status, null);
        return;
      }
      var json;
      try {
        json = JSON.parse(x.responseText);
      } catch (err) {
        callback('Failed to parse JSON: ' + err, null);
        return;
      }
      if (!!json.error) {
        callback('Server error: ' + json.error, null);
        return;
      }
      callback(null, json.result);
    }
  };
  x.open("POST","https://piazza.com/logic/api?method=" + encodeURI(method),true);
  x.setRequestHeader("Content-type","application/x-www-form-urlencoded");
  x.send(JSON.stringify({
    method: method,
    params: params
  }));
};

wrapper.auth = function (email, password, callback) {
  this.api('user.login', {
    email: email,
    pass: password
  }, function (err, data) {
    if (!err && data === 'OK') {
      wrapper.emit('authed');
    }
    callback(err, data);
  });
};

wrapper.classLoad = function (email, password, callback) {
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
};

wrapper.getContent = function (cid, nid, callback) {
  this.api('content.get', {
    cid: '' + cid,
    nid: nid
  }, callback);
};

wrapper.getFeed = function (nid, callback) {
  this.api('network.get_my_feed', {
    nid: nid,
    offset: 0,
    limit: 150,
    sort: 'updated'
  }, callback);
};

wrapper.getNumUsers = function (nid, uid, callback) { // Seems to initiate the networking protocall
  this.api('network.get_online_users', {
    nid: nid,
    uid: uid
  }, callback);
};

wrapper.getUsersInfo = function (ids, nid, callback) {
  var single = false;
  if (!(ids instanceof Array)) {
    single = true;
    ids = [ids];
  }
  this.api('network.get_users', {
    ids: ids,
    nid: nid
  }, function (err, data) {
    callback(err, single ? data[0] : data);
  });
}

wrapper.nameTable = {};
wrapper.nameCoord = {};

wrapper.getName = function (uid, callback) {
  if (wrapper.nameTable[uid] === undefined) {
    if (wrapper.nameCoord[uid] === undefined) {
      wrapper.nameCoord[uid] = [];
      wrapper.getUsersInfo(uid, config.json.nid, function (err, data) {
        if (err !== null || data === null || data === undefined) {
          console.log(chalk.yellow('Error getting user info for uid: ' + curr.uid));
          return;
        }
        callback(data.name);
        wrapper.nameTable[uid] = data.name;
        for (var i = 0; i < wrapper.nameCoord[uid].length; i++) {
          wrapper.nameCoord[uid][i](data.name);
        }
      });
    } else {
      wrapper.nameCoord[uid][wrapper.nameCoord[uid].length] = callback;
    }
  } else {
    callback(wrapper.nameTable[uid]);
  }
};

var stats;

wrapper.getStats = function () {
  return stats;
};

wrapper.on('authed', function () {
  wrapper.getFeed(config.json.nid, function (err, data) {
    if (err !== null) {
      console.log(chalk.yellow('Error getting feed: ' + err));
      return;
    }
    var feed = data.feed;
    stats = {};
    for (var i = 0; i < feed.length; i++) {
      wrapper.getContent(
        feed[i].id, config.json.nid, function (err, data) {
          if (err !== null) {
            console.log(chalk.yellow('Error getting content for id: ' + id));
            return;
          }
          var incStat = function (stats, name, type) {
            if (name.indexOf(' ') !== -1) {
              name = name.substring(0, name.indexOf(' ')) +
                name.substring(name.indexOf(' '), name.indexOf(' ') + 2);
            }
            if (stats[name] === undefined) {
              stats[name] = {};
            }
            if (stats[name][type] === undefined) {
              stats[name][type] = 0;
            }
            stats[name][type]++;
          };
          var parse = function (obj) {
            if (obj === undefined) {
              return;
            }
            var mainType = obj.type;
            for (var i = 0; i < ((obj.history === undefined) ? 1 : obj.history.length); i++) {
              var curr = (obj.history === undefined) ? obj : obj.history[i];
              if (curr.anon !== "no") {
                if (i === 0) {
                  incStat(stats, 'Anonymous', mainType);
                } else {
                  incStat(stats, 'Anonymous', mainType + '_edit');
                }
              } else {
                var tmp = i;
                wrapper.getName(curr.uid, function (name) {
                  if (tmp === 0) {
                    incStat(stats, name, mainType);
                  } else {
                    incStat(stats, name, mainType + '_edit');
                  }
                });
              }
            }
            for (var i = 0; i < obj.children.length; i++) {
              parse(obj.children[i]);
            }
          };
          parse(data);
      });
    }
    console.log(chalk.green('Finished synchronous parsing'));
  });
});

module.exports = {
  wrapper: wrapper,
  config: config
};
