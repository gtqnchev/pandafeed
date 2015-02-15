var mongoose = require('mongoose'),
    User = require('./user'),
    Grid = require('gridfs-stream'),
    gfs = Grid(mongoose.connection.db, mongoose.mongo),
    fs = require('fs'),
    path = require('path'),
    Q = require('q');

var defaultAvatarPath = path.join(__dirname, '../public/images/70x70.gif');

module.exports = {
    getReadStream: function(file_id) {
        var deferred = Q.defer();

        gfs.exist({_id: file_id}, function (err, found) {
            if(found) {
                deferred.resolve(gfs.createReadStream({_id: file_id}));
            }
            else {
                deferred.resolve(fs.createReadStream(defaultAvatarPath));
            }
        });

        return deferred.promise;
    },

    saveAvatarFor: function(user_token, filename, filepath) {
        return User.findByToken(user_token)
            .then(function(user) {
                var properties = { _id: user.avatar_id,
                                   filename: filename,
                                   mode: 'w',
                                   metadata: { user_id: user._id }};

                var read_stream  = fs.createReadStream(filepath),
                    write_stream = gfs.createWriteStream(properties);

                return read_stream.pipe(write_stream);
            });
    }
};
