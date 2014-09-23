var express = require('express');
var router = express.Router();
var chalk = require('chalk');

var content = 'Loading, please try again in a bit.';
var contentDefined = false;

/* GET home page. */
router.get('/', function(req, res) {
  if (!contentDefined) {
    req.app.wrapper.getFeed(function (err, data) {
      if (err !== null) {
        console.log(chalk.red('Error getting example content: ' + err));
      } else {
        content = data;
        contentDefined = true;
        res.render('index', {
          title: 'Express',
          content: JSON.stringify(content)
        });
      }
    });
  }
  if (contentDefined) {
    res.render('index', {
      title: 'Express',
      content: JSON.stringify(content)
    });
  }
});

module.exports = router;
