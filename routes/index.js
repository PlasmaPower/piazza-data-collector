var express = require('express');
var router = express.Router();
var chalk = require('chalk');

var api = require('../api.js');

/* GET home page. */
router.get('/', function(req, res) {
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
    }
  });
});

module.exports = router;
