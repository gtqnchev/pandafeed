var mongoose = require('mongoose');
	Schema = mongoose.Schema,
	crypto = require('crypto'),
	bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017');

var userSchema = new Schema({ name: String, password: String, token: String });
var User = mongoose.model('User', userSchema);

User.prototype.generateToken = function() {
	var date = (new Date()).valueOf().toString(),
		number = Math.random().toString();
	this.token = crypto.createHash('md5').update(date + number).digest('hex');
};

User.hashPassword = function(password, cb){
	bcrypt.genSalt(10, function(err, salt){
       	bcrypt.hash(password, salt, cb)
    });
};

module.exports = User;