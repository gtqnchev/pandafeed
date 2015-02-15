var User = require('./../models/user'),
    Message = require('./../models/message'),
    RatingService = require('./../services/user_rating_service'),
    _ = require('underscore'),
    config = require('./../config');

function setCookie(res, value) {
    res.cookie('pandafeed_token', value, { maxAge: config.cookieAge, httpOnly: true });
};

module.exports = {
    serveRegister: function(req, res){
        res.render("register", {errors: {}});
    },

    registerUser: function(req, res){
        if(req.body.username && req.body.password) {
            User.create(req.body.username, req.body.password)
                .then(function(user) {
                    setCookie(res, user.token);
                    res.redirect("/");
                }, function(err){
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
        if(req.body.username && req.body.password) {
            User.authenticate(req.body.username, req.body.password)
                .then(function(user){
                    setCookie(res, user.token);
                    res.redirect("/");
                }, function() {
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

    authMiddleware: function(req, res, next) {
        var token = req.cookies.pandafeed_token;

        User.findByToken(token).then(function(user) {
            if(user){
                return next();
            }
            else {
                return res.redirect("/login");
            }
        });
    },

    serveChat: function(req, res){
        var token = req.cookies.pandafeed_token;
        res.render("chat", { token: token });
    },

    serveRanklist: function(req, res){
        RatingService.sortedNamedRanklist().then(function(result) {
            res.render('ranklist', {ranklist: result});
        });
    }
};
