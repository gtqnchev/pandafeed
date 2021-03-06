var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var messageSchema = new Schema({ user_id:    Schema.Types.ObjectId,
                                 user:       { name: String, avatar_id: Schema.Types.ObjectId },
                                 text:       String,
                                 liked_by:   [Schema.Types.ObjectId],
                                 not_for:    [Schema.Types.ObjectId],
                                 timestamp: Date                    });

messageSchema.index({ timestamp: -1 });

var Message = mongoose.model('Message', messageSchema);

Message.prototype.sanitize = function() {
    return { _id:       this._id,
             user_id:   this.user_id,
             user:      this.user,
             text:      this.text,
             liked_by:  this.liked_by,
             timestamp: this.timestamp };
};

Message.last_n = function(n, timestamp, user_id, cb) {
    this.find({not_for: { $ne: user_id }, timestamp: { $lt: timestamp }})
        .sort({timestamp: -1}).limit(n).exec(cb);
};

Message.users_likes = function() {
    return this.aggregate()
        .group({_id: "$user_id", likesCount: { $sum: { $size :"$liked_by" }}})
        .project({_id: 1, likesCount: 1 });
};

module.exports = Message;
