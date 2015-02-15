var mongoose = require('mongoose'),
    AuthService = require('./../services/auth_service'),
    Q = require('q');

var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
var userSchema = new Schema({ name:       String,
                              password:   String,
                              token:      String,
                              blocked_by: [Schema.Types.ObjectId],
                              avatar_id:  Schema.Types.ObjectId   });

var User = mongoose.model('User', userSchema);

User.prototype.sanitize = function() {
    return { _id:        this._id,
             name:       this.name,
             avatar_id:  this.avatar_id,
             blocked_by: this.blocked_by };
};

User.findByToken = function(token) {
    return User.findOne({token: token}).exec();
},

User.users_blocks = function() {
    return this.aggregate()
        .project({_id: 1, blockedCount: { $size: "$blocked_by" }});
};

User.create = function(name, password) {
    var deferred = Q.defer();
    var token = AuthService.generateToken();

    User.findOne({name: name}).exec()
        .then(function(user){
            if(!user){
                return AuthService.hashPassword(password);
            }
            else {
                deferred.reject();
                return Q.reject();
            }})
        .then(function(hash) {
            var avatar_id = ObjectId();
            var user = new this({name: name, password: hash,
                                 token: token, blocked_by: [],
                                 avatar_id: avatar_id });

            user.save(function(err, user) {
                if(err) {
                    deferred.reject();
                }
                else {
                    deferred.resolve(user);
                }
            });
        }.bind(this));

    return deferred.promise;
};

User.authenticate = function(name, password) {
    var deferred = Q.defer();

    User.findOne({name: name}).exec(function(err, user) {
        if(user){
            AuthService.compare(password, user.password, function(err, match) {
                if(match) {
                    deferred.resolve(user);
                }
                else {
                    deferred.reject();
                }
            });
        }
        else {
            deferred.reject();
        }
    });

    return deferred.promise;
};

module.exports = User;
