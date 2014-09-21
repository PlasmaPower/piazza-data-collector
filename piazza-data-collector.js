var request = require('request').defaults(
    {
      jar: true
    }
  );
var chalk = require('chalk');
var fs = require('fs');

fs.readFile('config.json', 'utf8', function (err,data) {
  if (err) {
    console.log(chalk.red('Could not read config: ' + err));
    process.exit(1);
  }
  var json;
  try {
    json = JSON.parse(data);
  } catch (e) {
    console.log(chalk.red('Failed to parse config: ' + e));
    process.exit(2);
  }
  var email = json.email;
  var password = json.password;
  if (!email || !password) {
    console.log(chalk.red('Email or password not defined in config.'));
    process.exit(3);
  }
  request.post(
    {
      url: 'https://www.piazza.com/logic/api',
      form: JSON.stringify({
        method: 'user.login',
        "params": {
          email: email,
          pass: password
        }
      }),
      qs: {
        method: 'user.login'
      }
    },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body);
        } else {
          console.log(error);
          console.log(response.statusCode);
        }
    }
  );
});
