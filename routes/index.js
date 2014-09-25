var express = require('express');
var router = express.Router();
var chalk = require('chalk');
var fs = require('fs');

var api = require('../api.js');

/* GET home page. */
router.get('/', function(req, res) {
  if (req.ip.indexOf('192.168') !== 0 && req.ip !== '127.0.0.1') {
    req.app.hits++;
    fs.writeFile(__dirname + '../hits', req.app.hits + '\n', function(err) {
      if(err) {
        console.log(chalk.yellow('Could not write to the hits file!'));
        return;
      }
    });
  }
  res.render('index', {
    title: 'Sums',
    description: 'The first page! Adds up various totals in a table.',
    stats: api.wrapper.getStats(),
    typesReadable: ['Question', 'Comment', 'Reply to Comment', 'Note', 'Student Answer', 'Instructor Answer',
      'Question Edit', 'Note Edit', 'Student Answer Edit', 'Instructor Answer Edit'],
    types: ['question', 'followup', 'feedback', 'note', 's_answer', 'i_answer',
      'question_edit', 'note_edit', 's_answer_edit', 'i_answer_edit'],
    getKeys: function (obj) {
      var keys = [];
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          keys.push(key);
        }
      }
      return keys;
    },
    hits: req.app.hits
  });
});

module.exports = router;
