var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require("mongoose");
var axios = require("axios");
var cors = require('cors');
require('dotenv').config();


const auth = require('./routes/v1/auth');
const user = require('./routes/v1/user');
const admin = require("./routes/v1/admin");

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/v1/auth', auth);
app.use('/v1/user', user);
app.use('/v1/admin', admin);
app.use('/', function(req, res) {
  res.send("Hello");
});

mongoose.set('strictQuery', false);
// useFindAndModify: false, useCreateIndex: true
mongoose.connect(process.env.mongoConnection, { useNewUrlParser: true, useUnifiedTopology: true}, function(err) {
  if(err) {console.log(err)}
  else {console.log("Connected to database")}
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  // console.log(err);
  res.status(err.status || 500);
  res.send({
    message: "error"
  });
});

module.exports = app;
