const DEFAULT_LANGUAGE = 'fr';

// Firebase
var admin = require("firebase-admin");

if(process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    var serviceAccount = {
        "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    };

} else {
    var serviceAccount = require("./fibbage-tribute-questions-firebase-adminsdk.json");
}
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fibbage-tribute-questions.firebaseio.com"
});

// Get a reference to the database service
var database = admin.database();

// Express
var express = require('express');

var app = express();

app.use(express.static(__dirname + '/public'));

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var randomProperty = function (obj) {
    var keys = Object.keys(obj)
    return obj[keys[ keys.length * Math.random() << 0]];
};

function getRandomSubset(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        n = len;
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

app.get('/', function(req, res) {
    res.render('index.ejs', {status: req.query.status});
});

app.get('/question/random', function(req, res) {
    var language = req.query.lan || DEFAULT_LANGUAGE;
    database.ref('questions/' + language).once('value').then(function(snapshot) {
        res.json(randomProperty(snapshot.val()));
    });
});

app.get('/question/random/:nb', function(req, res) {
    var language = req.query.lan || DEFAULT_LANGUAGE;
    database.ref('questions/' + language).once('value').then(function(snapshot) {
        var subsetKeys = getRandomSubset(Object.keys(snapshot.val()), req.params.nb);
        var subset = subsetKeys.map(key => res[key] = snapshot.val()[key]);
        res.json(subset);
    });
});

app.get('/question/:id', function(req, res) {
    var language = req.query.lan || DEFAULT_LANGUAGE;
    database.ref('questions/' + language + '/' + req.params.id).once('value').then(function(snapshot) {
        res.json(snapshot.val());
    });
});

app.post('/question/add', function(req, res) {
    var language = req.body.language || DEFAULT_LANGUAGE;
    database.ref('questions/' + language).push({
        question: req.body.question,
        solution: req.body.solution
    });
    res.redirect('/?status=success');
});

app.post('/question/edit', function(req, res) {
    var language = req.body.language || DEFAULT_LANGUAGE;
    database.ref('questions/' + language + '/' + req.body.id).set({
        question: req.body.question,
        solution: req.body.solution
    });
    res.redirect('/');
});

var port = process.env.PORT || 3000;

app.listen(port);

console.log('RESTful API server started on: ' + port);
