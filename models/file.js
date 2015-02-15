var mongoose = require('mongoose'),
    ObjectId = mongoose.Types.ObjectId,
    User = require('./user'),
    Grid = require('gridfs-stream'),
    gfs = Grid(mongoose.connection.db, mongoose.mongo);
    fs = require('fs');

function File(user_id, avatar_id, filename) {
    this.user_id = user_id;
    this.filename = filename;
    this.avatar_id = avatar_id;
};

File.readStream = function(id) {
    return gfs.createReadStream({_id: id});
};

File.prototype.save_from = function(path, callback) {
    var _id = this.avatar_id || (new ObjectId());
    var read_stream = fs.createReadStream(path);
    var write_stream = gfs.createWriteStream({ _id:      _id,
                                               filename: this.filename,
                                               metadata: { user_id: this.user_id },
                                               mode: 'w'});
    read_stream.pipe(write_stream);

    write_stream.on('close', function(file) {
        if(!this.avatar_id) {
            User.findOneAndUpdate({_id: this.user_id}, { avatar_id: file._id }, callback);
        }
        else
        {
            callback();
        }
    }.bind(this));
};

module.exports = File;
