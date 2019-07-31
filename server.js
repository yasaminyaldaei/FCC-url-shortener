'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var cors = require('cors');

const dns = require('dns');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
const DB_URI = process.env.DB

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({'extended': true}))

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", function (req, res) {
  
  var url = req.body.url
  var regex = /(https?:\/\/www\.{1})?\w+\.{1}[a-z]+((\/\w+)+)?/gi
  if (regex.test(url)) {
    dns.lookup(url.match(/(www\.{1})?\w+\.{1}[a-z]+((\/\w+)+)?/gi).toString(), (err, address) => {
      if (err) {
        res.send({'error' : "invalid URL"})
      } else {
          mongo.connect(DB_URI, { useNewUrlParser: true }, (err, client) => {
          var collection = client.db('url-shortener').collection('urls')
          collection.findOne({ original_url: url}, (err, result) => {
            if (result) {
              res.send(result)
            } else {
              collection.countDocuments().then(count => {
              var urlObject = {
                original_url: url,
                short_url: count + 1
              }
              collection.insertOne(urlObject, (err, doc) => {
                res.send(urlObject)
              })
            })
            }
          })
        })
      }

    })
  } else {
    res.send({'error': "invalid URL"})
  }
  
  
});

app.get("/api/shorturl/:shurl", (req, res) => {
  mongo.connect(DB_URI, { useNewUrlParser: true}, (err, client) => {
    var collection = client.db('url-shortener').collection('urls')
    collection.findOne({'short_url' : parseInt(req.params.shurl, 10)}, (err, result) => {
      if (result) {
        res.redirect(result['original_url'])
      }
    })
  })
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});

