var express      = require("express"),
    app          = express(),
    server       = require('http').Server(app),
    io           = require('socket.io')(server),
    config       = require('./config'),
    bodyParser   = require('body-parser'),
    cookieParser = require('cookie-parser'),
    multer       = require('multer'),
    mongoose     = require('mongoose');

mongoose.connect(config.DBparams);

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(multer());

require('./routes.js')(app, io);

server.listen(config.port);
console.log("Listening on port " + config.port);
