var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/pandafeed');
var Schema = mongoose.Schema;
var crypto = require('crypto');

var userSchema = new Schema({ name: String, password: String, token: String });
var User = mongoose.model('User', userSchema);

User.prototype.generateToken = function() {
    var date = (new Date()).valueOf().toString(),
        number = Math.random().toString();
    this.token = crypto.createHash('md5').update(date + number).digest('hex');
};

module.exports = User;
