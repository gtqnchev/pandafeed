var crypto = require('crypto'),
    bcrypt = require('bcryptjs');

module.exports = function(mongoose) {
    var Schema = mongoose.Schema;

    var userSchema = new Schema({ name:       String,
                                  password:   String,
                                  token:      String,
                                  blocked:    [Schema.Types.ObjectId],
                                  blocked_by: [Schema.Types.ObjectId] });

    var User = mongoose.model('User', userSchema);

    User.prototype.generateToken = function() {
        var date = (new Date()).valueOf().toString(),
            number = Math.random().toString();

        this.token = crypto.createHash('md5').update(date + number).digest('hex');
    };

    User.prototype.sanitize = function() {
        return { _id:        this._id,
                 name:       this.name,
                 avatar_id:  this.avatar_id,
                 blocked_by: this.blocked_by };
    };

    User.hashPassword = function(password, cb){
        bcrypt.genSalt(10, function(err, salt){
            bcrypt.hash(password, salt, cb);
        });
    };

    return User;
};
