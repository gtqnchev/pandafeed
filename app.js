var express = require("express"),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    dd = require('./dummy_data'),
    port = 3000,
    bp = require('body-parser'),
    cp = require('cookie-parser'),
    User = require('./models/user');

app.use(express.static(__dirname + '/public'));
app.use(bp.urlencoded({extended: true}));
app.use(cp());

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get("/", function(req, res){
    res.render("index");
});

app.get("/chat", function(req, res){
    res.render("chat");
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
                        res.cookie('Token', user.token, { maxAge: 900000, httpOnly: true });
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
    	res.redirect("/chat");
    }
    else {
    	res.render("login", {errors: {loginFailed: true}});
    }
});

app.get("/login", function(req, res){
    res.render("login", {errors: {}});
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
