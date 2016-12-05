var express = require('express'),
    MongoClient = require('mongodb').MongoClient,
    app = express(),
    mongoUrl = 'mongodb://localhost:27017/textmonkey';

var access = require('./access.js');
var bodyParser = require('body-parser');

// redis
var redisClient = require('redis').createClient;
var redis = redisClient(6379, 'localhost');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());


MongoClient.connect(mongoUrl, function (err, db) {
    if (err) throw 'Error connecting to database - ' + err;

    app.post('/book', function (req, res) {
        //console.log("test: req: "+JSON.stringify(req));
        console.log("test: body: title: "+JSON.stringify(req.body.title));
        if (!req.body.title || !req.body.author) res.status(400).send("Please send a title and an author for the book");
        else if (!req.body.text) res.status(400).send("Please send some text for the book");
        else {
            access.saveBook(db, req.body.title, req.body.author, req.body.text, function (err) {
                if (err) res.status(500).send("Server error");
                else res.status(201).send("Saved");
            });
        }
    });

    // app.get('/book/:title', function (req, res) {
    //     console.log("test: params: title: "+JSON.stringify(req.params.title));
    //     if (!req.params.title) res.status(400).send("Please send a proper title");
    //     else {
    //         access.findBookByTitle(db, req.params.title, function (bookText) {
    //             console.log("book: "+JSON.stringify(bookText));
    //             if (!bookText) res.status(500).send("Server error");
    //             else res.status(200).send(bookText);
    //         });
    //     }
    // });

    app.get('/book/:title', function (req, res) {
        if (!req.params.title) res.status(400).send("Please send a proper title");
        else {
            access.findBookByTitleCached(db, redis, req.params.title, function (bookText) {
                if (!bookText) res.status(500).send("Server error or data not found");
                else res.status(200).send(bookText);
            });
        }
    });

    app.listen(8000, function () {
        console.log('Listening on port 8000');
    });
});
