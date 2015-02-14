var Q = require('q'),
    _ = require('underscore');

module.exports = function(User, Message){
    var calculateRating = function(blocks_count, likes_count) {
        var blocks_squared = blocks_count * blocks_count;
        return (likes_count + 1) / (blocks_squared + 1);
    };

    var getLikesCountForUser = function(users_likes, user_id) {
        var user_likes = _.find(users_likes, function(user_likes) {
            return user_likes._id.toString() === user_id.toString();
        });

        if(user_likes) {
            return user_likes.likesCount;
        }
        else {
            return 0;
        }
    };

    var handleBlocksAndLikes = function(blocks_and_likes) {
        var users_blocks = blocks_and_likes[0],
            users_likes  = blocks_and_likes[1];

        return _.map(users_blocks, function(user_blocks){
            var blocksCount = user_blocks.blockedCount;
            var likesCount = getLikesCountForUser(users_likes, user_blocks._id);

            return { _id:    user_blocks._id,
                     rating: calculateRating(blocksCount, likesCount)};
        });
    };

    return {
        rate: function() {
            var blocks = User.users_blocks().exec(),
                counts = Message.users_likes().exec();

            return Q.all([blocks, counts])
                .then(handleBlocksAndLikes);
        }
    };
};
