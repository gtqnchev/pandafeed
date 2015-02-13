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
    cookie_age = 365 * 24 * 60 * 60 * 1000,
    bcrypt = require('bcryptjs');

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
                    User.hashPassword(req.body.password, function (err, hash) {
                        var user = new User({name: req.body.username, password: hash, blocked_by: []});
                        user.generateToken();

                        user.save(function(err, user){
                            if(err){
                                res.send(err);
                            }
                            else {
                                res.cookie('pandafeed_token', user.token, { maxAge: cookie_age, httpOnly: true });
                                res.redirect("/chat");
                            }});
                    });
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
        User.find({name: req.body.username}).limit(1)
            .exec(function(err, users) {
                if(users.length != 0){
                    bcrypt.compare(req.body.password, users[0].password, function(err, result){
                        if(result){
                            res.cookie('pandafeed_token', users[0].token, { maxAge: cookie_age, httpOnly: true });
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
    sockets = {},
    socket_ids = {};

function sanitizedUser(user) {
    return { _id:        user._id,
             name:       user.name,
             avatar_id:  user.avatar_id,
             blocked_by: user.blocked_by };
}

io.on('connection', function (socket) {
    socket.emit('request_authentication');

    socket.on('authenticate', function(token) {
        User.find({token: token}).limit(1).exec(function(err, result) {
            if(result[0]) {
                var user = sanitizedUser(result[0]);
                users[socket.id] = user;
                sockets[socket.id] = socket;
                socket_ids[user._id] = socket.id;

                socket.emit('initialize', { self_id:  user._id,
                                            users:    _.values(users),
                                            messages: [] });

                socket.broadcast.emit('update:users', _.values(users));
            }
            else {
                socket.disconnect();
            }
        });
    });

    socket.on('message', function(message) {
        var name = users[socket.id].name;
        var not_interested_users_ids = _.map(users[socket.id].blocked_by, function(obj_id) { return obj_id.toString();});

        _.values(sockets).forEach(function(s) {
            if(!(_.contains(not_interested_users_ids, users[s.id]._id.toString()))) {
                s.emit('message', { text: message.text,
                                    user: {name: name }});
            }
        });
    });

    socket.on('disconnect', function() {
        if(users[socket.id]) {
            delete socket_ids[users[socket.id]._id];
            delete users[socket.id];
            delete sockets[socket.id];
            socket.broadcast.emit('update:users', _.values(users));
        }
    });

    socket.on('block', function(user_id) {
        User.findOneAndUpdate({ _id: user_id }, { $push: { blocked_by: users[socket.id]._id }}, function(err, user) {
            if(!err) {
                var socket_id = socket_ids[user._id];
                users[socket_id] = sanitizedUser(user);
                socket.emit('update:users', _.values(users));
            }
        });
    });

    socket.on('unblock', function(user_id) {
        User.findOneAndUpdate({ _id: user_id }, { $pull: { blocked_by: users[socket.id]._id }}, function(err, user) {
            if(!err) {
                var socket_id = socket_ids[user._id];
                users[socket_id] = sanitizedUser(user);
                socket.emit('update:users', _.values(users));
            }
        });
    });
});

console.log("Listening on port " + port);
