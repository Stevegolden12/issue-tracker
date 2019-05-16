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
const shortid = require('shortid');

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
  _id: {
    type: String,
    default: shortid.generate
  },
  title: String,
  comments: String, 
  user: String,
  assigned: String,
  status: String,
  closed: String
});

var issue = mongoose.model('issues', issueSchema)

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
        _id: shortid.generate(),
        title: req.body.create_issue_title,
        comments: req.body.issue_text,
        user: req.body.created_by,
        assigned: req.body.assigned_to,
        status: req.body.status_text,
        closed: false
      })

      newIssue.save(newIssue, function (err, issue) {
        console.log("ISSUE: " + issue._id)
        if (err) {
          res.send("Issue could not be created")
        }
        else {
          res.send("Issue successfully created. <br> Issue id number is: " + issue._id)
        }
      })


    } else if (req.body.hasOwnProperty("update_id")) {
      var close = 'true';
      console.log("req.body.open is: " + req.body.open)
      if (req.body.open === undefined) {
        close = 'false';
      } else if (req.body.open === false) {
        close = 'true';
      }


      issue.findById(req.body.update_id, { new: true }, function (err, iss) {
        if (iss) {
          issue.findOneAndUpdate(
            { _id: iss._id },
            {
              $set: {
                title: req.body.create_issue_title,
                comments: req.body.issue_text,
                user: req.body.created_by,
                assigned: req.body.assigned_to,
                status: req.body.status_text,
                closed: close
              }
            },
            { new: true },
            (err, docs) => {
              if (err) {
              } else {
                res.send("Successfully updated.")
              }

            });
        } else {
          res.send("Could not update id " + req.body.update_id)
        }
      })

    } else if (req.body.hasOwnProperty("delete_id")) {
      issue.findById(req.body.delete_id, { new: true }, function (err, iss) {
        if (iss !== null) {
          issue.findByIdAndDelete({ _id: req.body.delete_id }, function (err) {
            res.send("successful deletion")
          })
        } else {
          res.send("Could not delete id " + req.body.delete_id)
        }
      })
    } else if (req.body.hasOwnProperty("search_id")) {
      res.send("Searching in database")
      console.log("Searching body: " + JSON.stringify(req.body))
      console.log("Before req.body.idCheck: " + req.body.idCheck)
       
      function findChkBoolean(ChkObj) {
        let newArray = [];
        let ignoreVal;

        ChkObj.idCheck === undefined ? ignoreVal = false : newArray.push('_id');
        ChkObj.titleCheck === undefined ? ignoreVal = false : newArray.push('title');
        ChkObj.textCheck === undefined ? ignoreVal = false : newArray.push('comments');
        ChkObj.createdCheck === undefined ? ignoreVal = false : newArray.push('user');
        ChkObj.assignedCheck === undefined ? ignoreVal = false : newArray.push('assigned');
        ChkObj.statusCheck === undefined ? ignoreVal = false : newArray.push('status');
        ChkObj.openCheck === undefined ? ignoreVal = false : newArray.push('closed');

        return newArray
      }
      let chkObject = findChkBoolean(req.body)
      let showFields = findChkBoolean(req.body).join(' ');
      console.log("chkBool: " + showFields)

      //Going to go through the checkboxes and put in the '_id title' section below in find()
      issue.find({
        _id: req.body.search_id ? req.body.search_id : /./,
        title: req.body.issue_title ? req.body.issue_title : /./,
        comments: req.body.issue_text ? req.body.issue_text : /./,
        user: req.body.created_by ? req.body.created_by : /./,
        assigned: req.body.assigned_to ? req.body.assigned_to : /./,
        status: req.body.status_text ? req.body.status_text : /./,
        closed: req.body.open_issue ? req.body.open_issue : /./,
      },
        showFields, function (err, docs) {

          /*
           *
           * 
           * Make a function that checks all the fields if they are empty to if/else the response
           * 
           *   
           */
          console.log("DOCS in function: " + docs)
          console.log("DOCS return value: " + (docs === 'undefined'))
          console.log("check field: " )
          /*
           *
          if (docs) {
            res.json(docs);
          } else {
            res.send("There are no matching searches")
          }          
          */
        })
    }
    
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
