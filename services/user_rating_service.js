var Q = require('q'),
    _ = require('underscore');

module.exports = function(User, Message){
	return {
		rate: function() {
			var block_count = Q.defer(),
				likes_count = Q.defer();
				result      = Q.defer();
			
			User.aggregate(
				{$project: {_id: 1, 
				            blockedCount: {$size :"$blocked_by"}}},
				function(err, res) {
					if(err) {
						block_count.reject("error");
					}
					else {
						console.log("blocks resolved");
						block_count.resolve(res);
					}
		        });

			Message.aggregate(
					{  $group: {_id: "$user_id",
								totalLikes: {$sum: {$size :"$liked_by"}}}
					},
					{  $project: {_id: 1,
								  totalLikes: 1}}, 
					function(err, res) {
						if(err){
							likes_count.reject("error");
						}
						else {
							console.log("likes resolved");
							likes_count.resolve(res);
						}
					});

			Q.all([block_count.promise, likes_count.promise])
				.then(function (results){
					console.log(results);
					result.resolve(_.map(results[0], function(user_blocks){
											var blocks_factor = user_blocks.blockedCount * user_blocks.blockedCount;
											
											var likes_factor = _.find(results[1], function(user_likes) {
												console.log('blocks', user_blocks, user_likes);
																				return user_likes._id.toString() == user_blocks._id.toString(); 
																}).totalLikes;
											console.log(likes_factor, blocks_factor);
											return { _id: user_blocks._id, rating: (likes_factor + 1)/(blocks_factor + 1) };
							}));
						},
						function () {
							result.reject("NO");
						}).catch(function(err) { console.log(err); result.reject("EXCEPTION");});

			return result.promise;
	}
};
};