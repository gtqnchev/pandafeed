var express = require("express");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var dd = require('./dummy_data');
var port = 3000;

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get("/", function(req, res){
    res.render("index");
});

app.get("/chat", function(req, res){
    res.render("chat");
});

server.listen(port);

io.on('connection', function (socket) {
    socket.emit('welcome', { messages: dd.messages,
                             users: dd.users });

    socket.broadcast.emit('info', "User connected.");

    socket.on('message', function(msg) {
        socket.broadcast.emit('message', msg);
    });
});

console.log("Listening on port " + port);
