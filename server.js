'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var expect = require('chai').expect;
const helmet = require('helmet');
const db = require('mongodb')
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var cors = require('cors');
const multer = require('multer');
const upload = multer();

var apiRoutes = require('./routes/api.js');
var fccTestingRoutes = require('./routes/fcctesting.js');
var runner = require('./test-runner');

var app = express();

mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost:27017/IssueTracker', { useNewUrlParser: true }, (err) => {
  if (!err) {
    console.log("Database connection successful")
  } else {
    console.log("Database is not connected: " + err)
  }
})

var issueSchema = new Schema({
  title: String,
  comments: String, 
  user: String,
  assigned: String,
  status: String
});

var issue = mongoose.model('issue', issueSchema)

app.use(helmet.xssFilter())
app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' })); //For FCC testing purposes only


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.route('/api/issues/issueTracker/')
  .post(upload.array(), function (req, res, next) {

    if (req.body.hasOwnProperty("create_issue_title")) {
      console.log("create issue")
      var newIssue = new issue({
        title: req.body.create_issue_title,
        comments: req.body.issue_text,
        user: req.body.created_by,
        assigned: req.body.assigned_to,
        status: req.body.status_text,
      })

      newIssue.save(newIssue, function (err, issue) {
        console.log("User when saving is: " + issue._id);
        if (err) { return console.error(err) }
        else {
          res.send('Your userId to access the tracker is: ' + issue._id);
        }
      })
    } else if (req.body.hasOwnProperty("update_id")) {
      console.log("update issue")
    } else if (req.body.hasOwnProperty("delete_id")) {
      console.log("delete issue")
    }
   
    //console.log("create issue")
    //res.send("create issue")
      res.json(req.body)
  })

//Sample front-end
app.route('/:project/')
  .get(function (req, res) { 
     res.sendFile(process.cwd() + '/views/issue.html');
  });

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
     res.sendFile(process.cwd() + '/views/index.html');    
  });

//Database route


//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);

//404 Not Found Middleware
app.use(function (req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
//process.env.PORT ||
app.listen(3000, function () {
  console.log("Listening on port " + 3000 /*process.env.PORT*/);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (e) {
        var error = e;
        console.log('Tests are not valid:');
        console.log(error);
      }
    }, 3500);
  }
});

module.exports = app; //for testing
