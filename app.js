var express = require("express"),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    port = 3000,
    bp = require('body-parser'),
    cp = require('cookie-parser'),
    _ = require('underscore'),
    cookie_age = 365 * 24 * 60 * 60 * 1000,
    bcrypt = require('bcryptjs'),
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId,
    User = require('./models/user')(mongoose),
    Message = require('./models/message')(mongoose);

mongoose.connect('mongodb://localhost:27017/pandafeed');

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

io.on('connection', function (socket) {
    socket.emit('request_authentication');

    socket.on('authenticate', function(token) {
        User.find({token: token}).limit(1).exec(function(err, result) {
            if(result[0] && !socket_ids[result[0]._id]) {
                Message.last_n(10, new Date(), result[0]._id, function(err, messages) {
                    var user = result[0].sanitize();
                    users[socket.id] = user;
                    sockets[socket.id] = socket;
                    socket_ids[user._id] = socket.id;

                    var sanitized_messages = _.chain(messages)
                            .map(function(msg) { return msg.sanitize();})
                            .reverse().value();

                    socket.emit('initialize', { self_id:  user._id,
                                                users:    _.values(users),
                                                messages: sanitized_messages });

                    socket.broadcast.emit('update:users', _.values(users));
                });
            }
            else {
                socket.disconnect();
            }
        });
    });

    socket.on('message', function(text) {
        var author = users[socket.id];

        var message = new Message({text:      text,
                                   user_id:   author._id,
                                   user:      { name: author.name },
                                   liked_by:  [],
                                   not_for:   users[socket.id].blocked_by,
                                   timestamp: (new Date())          });

        var not_interested_users_ids = _.map(users[socket.id].blocked_by,
                                             function(obj_id) {
                                                 return obj_id.toString();
                                             });

        message.save(function(err, message) {
            if(!err){
                _.values(sockets).forEach(function(s) {
                    if(!(_.contains(not_interested_users_ids, users[s.id]._id.toString()))) {
                        s.emit('message', message.sanitize());
                    }
                });
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
                users[socket_id] = user.sanitize();
                socket.emit('update:users', _.values(users));
            }
        });
    });

    socket.on('unblock', function(user_id) {
        User.findOneAndUpdate({ _id: user_id }, { $pull: { blocked_by: users[socket.id]._id }}, function(err, user) {
            if(!err) {
                var socket_id = socket_ids[user._id];
                users[socket_id] = user.sanitize();
                socket.emit('update:users', _.values(users));
            }
        });
    });

    socket.on('history', function(timestamp_string) {
        var user_id = users[socket.id]._id;
        var timestamp = new Date(Date.parse(timestamp_string));

        Message.last_n(10, timestamp, user_id, function(err, messages) {
            var sanitized_messages = _.chain(messages)
                    .map(function(msg) { return msg.sanitize();})
                    .reverse().value();

            socket.emit('history', sanitized_messages);
        });
    });

    socket.on('like', function(msg_id, author_id) {
        var user = users[socket.id];

        if(author_id != user._id){
            Message.findOneAndUpdate({ _id: msg_id }, { $addToSet: { liked_by: users[socket.id]._id }}, function(err, message) {
                if(!err) {
                    _.values(sockets).forEach(function(s) {
                        s.emit('like', message.sanitize());
                    });
                }
            });
        }
    });
});

console.log("Listening on port " + port);
