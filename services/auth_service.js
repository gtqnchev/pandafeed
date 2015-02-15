var bcrypt = require('bcryptjs'),
    crypto = require('crypto'),
    Q = require('q');

module.exports = {
    hashPassword: function(password, cb){
        var deferred = Q.defer();

        bcrypt.genSalt(10, function(err, salt){
            bcrypt.hash(password, salt, function(err, hash) {
                if(!err) {
                    deferred.resolve(hash);
                }
                else {
                    deferred.reject();
                }
            });
        });

        return deferred.promise;
    },

    generateToken: function() {
        var date = (new Date()).valueOf().toString(),
            number = Math.random().toString();

        return crypto.createHash('md5').update(date + number).digest('hex');
    },

    compare: bcrypt.compare
};
