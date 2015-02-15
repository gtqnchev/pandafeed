var User = require('./../models/user'),
    Message = require('./../models/message'),
    RatingService = require('./../services/user_rating_service'),
    _ = require('underscore'),
    config = require('./../config');

module.exports = {
    serveRoot: function(req, res){
        res.render("index");
    },

    serveChat: function(req, res){
        var token = req.cookies.pandafeed_token;

        User.findByToken(token).then(function(user) {
            if(user){
                res.render("chat", { token: token });
            }
            else {
                res.redirect("/login");
            }
        });
    },

    serveRegister: function(req, res){
        res.render("register", {errors: {}});
    },

    registerUser: function(req, res){
        if(req.body.username && req.body.password) {
            User.create(req.body.username, req.body.password)
                .then(function(user) {
                    console.log("user:", user);
                    res.cookie('pandafeed_token', user.token, { maxAge: config.cookieAge, httpOnly: true });
                    res.redirect("/chat");
                }, function(err){
                    console.log("NO USER");
                    res.render("register", {errors: {userExists: true}});
                });
        }
        else {
            res.render("register", {errors: {userExists: false}});
        }
    },

    serveLogin: function(req, res){
        res.render("login", {errors: {}});
    },

    loginUser: function(req, res){
        console.log("trying to login");
        if(req.body.username && req.body.password) {
            console.log("there is username and password");
            User.authenticate(req.body.username, req.body.password)
                .then(function(user){
                    console.log("user:", user);
                    res.cookie('pandafeed_token', user.token, { maxAge: config.cookieAge, httpOnly: true });
                    res.redirect("/chat");
                }, function() {
                    console.log("NO USER");
                    res.render("login", {errors: {loginFailed: true}});
                });
        }
        else {
            res.render("login", {errors: {loginFailed: true}});
        }
    },

    logoutUser: function(req, res){
        res.clearCookie("pandafeed_token");
        res.render("login", {errors: {}});
    },

    serveRanklist: function(req, res){
        RatingService.sortedNamedRanklist().then(function(result) {
            res.render('ranklist', {ranklist: result});
        });
    }
};
