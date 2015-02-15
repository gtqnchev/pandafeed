module.exports = function(User) {
    return {
        identifyUser: function(token) {
            return User.findOne({token: token}).exec();
        }
    };
};
