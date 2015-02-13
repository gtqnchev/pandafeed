var express = require("express"),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    dd = require('./dummy_data'),
    port = 3000,
    bp = require('body-parser'),
    cp = require('cookie-parser'),
    User = require('./models/user'),
    _ = require('underscore'),
    cookie_age = 365 * 24 * 60 * 60 * 1000;

app.use(express.static(__dirname + '/public'));
app.use(bp.urlencoded({extended: true}));
app.use(cp());

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get("/", function(req, res){
    res.render("index");
});

app.get("/chat", function(req, res){
    var token = req.cookies.pandafeed_token;
    User.find({token: token}).limit(1).exec(function(err, result) {
        if(result.length === 1) {
            res.render("chat", { token: token });
        }
        else {
            res.redirect("/login");
        }
    });
});

app.post("/register", function(req, res){
    if(req.body.username && req.body.password) {
        User.find({name: req.body.username})
            .limit(1).exec(function(err, result){
                if(result.length === 0){
                    var user = new User({name: req.body.username, password: req.body.password});
                    user.generateToken();

                    user.save(function(err, user){
                    if(err){
                        res.send(err);
                    }
                    else {
                        res.cookie('pandafeed_token', user.token, { maxAge: cookie_age, httpOnly: true });
                        res.redirect("/chat");
                    }});
                }
                else {
                    res.render("register", {errors: {userExists: true}});
                }
            });

    }
    else {
        res.render("register", {errors: {userExists: false}});
    }
});

app.get("/register", function(req, res){
    res.render("register", {errors: {}});
});

app.post("/login", function(req, res){
    if(req.body.username && req.body.password) {
        User.find({name: req.body.username, password: req.body.password}).limit(1)
            .exec(function(err, result) {
                if(result.length != 0){
                    res.cookie('pandafeed_token', result[0].token, { maxAge: cookie_age, httpOnly: true });
                    res.redirect("/chat");
                }
                else {
                    res.render("login", {errors: {loginFailed: true}});
                }
            });
    }
    else {
        res.render("login", {errors: {loginFailed: true}});
    }
});

app.get("/login", function(req, res){
    res.render("login", {errors: {}});
});

server.listen(port);

var users = {},
    sockets = {};

io.on('connection', function (socket) {
    socket.emit('request_authentication');

    socket.on('authenticate', function(token) {
        User.find({token: token}).limit(1).exec(function(err, result) {
            users[socket.id] = result[0];
            sockets[socket.id] = socket;

            socket.emit('init', { messages: [],
                                  users: _.values(users)});

            socket.broadcast.emit('users', _.values(users));
        });
    });

    socket.on('message', function(message) {
        var name = users[socket.id].name;

        _.values(sockets).forEach(function(s) {
            s.emit('message', { text: message.text,
                                user: {name: name }});
        });
    });

    socket.on('disconnect', function() {
        delete users[socket.id];
        delete sockets[socket.id];
        socket.broadcast.emit('users', _.values(users));
    });
});

console.log("Listening on port " + port);
