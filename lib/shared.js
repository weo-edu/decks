_.extend(Decks, {
	homeFeeds: ['popular', 'featured'],
	feed: function(feed, uid) {
		var self = this;
		return self[feed] && self[feed].apply(self, _.toArray(arguments).slice(1));
	},
	popular: function(uid) {
		//	XXX Make this actuall generate a list of popular decks
		//	tailored to the user
		var self = this;
		return self.find({}, {limit: 5, sort: {plays: -1}});
	},
	featured: function(uid) {
		//	XXX Make this actually generate a list of featured decks
		//	tailored to the user
		var self = this;
		return self.find({}, {limit: 5, sort: {featured: -1}});
	},
	findUser: function(uid) {
		var self = this;
	  return self.find(_.pluck(UserDeck.findUser(uid, 1).fetch(), 'deck'));
	}
});

_.extend(UserDeck, {
	findUser: function(uid, minRank) {
		var self = this,
			query = { user: uid };

		if(_.isArray(uid)) 
			query['user'] = { $in: uid };

		if(minRank !== undefined) 
			query['mastery.rank'] = { $gte: minRank };

		return self.find(query);
	},
	findUserDeck: function(uid, did) {
		var self = this,
			query = {user: uid};

		if(_.isArray(uid)) 
			query = {user: {$in: uid}};

		query['deck'] = did;
		console.log(self.find(query).fetch());
		return self.find(query);
	}
});