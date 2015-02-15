var User = require('./../models/user'),
    Message = require('./../models/message'),
    _ = require('underscore');

var users = {},
    sockets = {},
    socket_ids = {};

module.exports = function(socket) {
    return {
        authenticate: function(token) {
            User.find({token: token}).limit(1).exec(function(err, result) {
                if(result[0] && !socket_ids[result[0]._id]) {
                    Message.last_n(10, new Date(), result[0]._id, function(err, messages) {
                        var user = result[0].sanitize();
                        users[socket.id] = user;
                        sockets[socket.id] = socket;
                        socket_ids[user._id] = socket.id;

                        var sanitized_messages = _.chain(messages)
                                .map(function(msg) { return msg.sanitize();})
                                .reverse().value();

                        socket.emit('initialize', { self_id:  user._id,
                                                    users:    _.values(users),
                                                    messages: sanitized_messages });

                        socket.broadcast.emit('update:users', _.values(users));
                    });
                }
                else {
                    socket.disconnect();
                }
            });
        },

        message: function(text) {
            var author = users[socket.id];

            var message = new Message({text:      text,
                                       user_id:   author._id,
                                       user:      { name: author.name, avatar_id: author.avatar_id },
                                       liked_by:  [],
                                       not_for:   users[socket.id].blocked_by,
                                       timestamp: (new Date())          });

            var not_interested_users_ids = _.map(users[socket.id].blocked_by,
                                                 function(obj_id) {
                                                     return obj_id.toString();
                                                 });

            message.save(function(err, message) {
                if(!err){
                    _.values(sockets).forEach(function(s) {
                        if(!(_.contains(not_interested_users_ids, users[s.id]._id.toString()))) {
                            s.emit('message', message.sanitize());
                        }
                    });
                }
            });
        },

        disconnect: function() {
            if(users[socket.id]) {
                delete socket_ids[users[socket.id]._id];
                delete users[socket.id];
                delete sockets[socket.id];
                socket.broadcast.emit('update:users', _.values(users));
            }
        },

        block: function(user_id) {
            User.findOneAndUpdate({ _id: user_id }, { $push: { blocked_by: users[socket.id]._id }}, function(err, user) {
                if(!err) {
                    var socket_id = socket_ids[user._id];
                    users[socket_id] = user.sanitize();
                    socket.emit('update:users', _.values(users));
                }
            });
        },

        unblock: function(user_id) {
            User.findOneAndUpdate({ _id: user_id }, { $pull: { blocked_by: users[socket.id]._id }}, function(err, user) {
                if(!err) {
                    var socket_id = socket_ids[user._id];
                    users[socket_id] = user.sanitize();
                    socket.emit('update:users', _.values(users));
                }
            });
        },

        history: function(timestamp_string) {
            var user_id = users[socket.id]._id;
            var timestamp = new Date(Date.parse(timestamp_string));

            Message.last_n(10, timestamp, user_id, function(err, messages) {
                var sanitized_messages = _.chain(messages)
                        .map(function(msg) { return msg.sanitize();})
                        .reverse().value();

                socket.emit('history', sanitized_messages);
            });
        },

        like: function(msg_id, author_id) {
            var user = users[socket.id];

            if(author_id != user._id){
                Message.findOneAndUpdate({ _id: msg_id }, { $addToSet: { liked_by: users[socket.id]._id }}, function(err, message) {
                    if(!err) {
                        _.values(sockets).forEach(function(s) {
                            s.emit('update:message', message.sanitize());
                        });
                    }
                });
            }
        },

        unlike: function(msg_id, author_id) {
            var user = users[socket.id];

            if(author_id != user._id){
                Message.findOneAndUpdate({ _id: msg_id }, { $pull: { liked_by: users[socket.id]._id }}, function(err, message) {
                    if(!err) {
                        _.values(sockets).forEach(function(s) {
                            s.emit('update:message', message.sanitize());
                        });
                    }
                });
            }
        }
    };
};
