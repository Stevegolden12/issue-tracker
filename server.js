'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var expect = require('chai').expect;
const helmet = require('helmet');
const db = require('mongodb')
const mongoose = require('mongoose');
var cors = require('cors');

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

app.use(helmet.xssFilter())
app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' })); //For FCC testing purposes only


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.route('/api/issues/issueTracker')
  .get(function (req, res) {
    console.log("testing")
    res.send("Testing")
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
