;(function(){
	Meteor.publish('games', function(){
		var d = new Date();
		d.setDate(d.getDate() - 1);

		//	Return games that satisfy the following conditions
		//		- The subscribing user is involved
		//		- The state of the game is not finished
		//		- The game record has been modified in the last 24 hours
		return Games.find({
			users: this.userId(),
			state: {$ne: 'finished'},
			modified: {$gte: d.getTime()}
		});
	});

	Meteor.publish('game', function(id) {
		return Games.find({_id: id});
	})

	Meteor.publish('userDeckInfo', function(users, deck) {
		users = _.without(users,1);

		//XXX index on user,deck
		return UserDeckInfo.find({user: {$in: users}, deck: deck});

	});

	Meteor.publish('gradeStats', function() {
		console.log('publish gradeStats');
		return StatsCollection.find({name: 'gradeStats'});
	});

	Meteor.publish('userCardStats', function (users, cards) {
		users = _.without(users,1);
		console.log('users', users, 'cards', cards);
		return UserCardStats.find({ uid: {$in: users}, cid: {$in: cards} });
	});

	Meteor.startup(function(){
		Games.allow({
			insert: function(uid, doc){
				doc.modified = doc.created = (new Date()).getTime();
				return true;
			},
			update: function(uid, docs, fields, modifier){
				var self = this;
				//XXX broken
				if(! ~fields.indexOf('created') && ! ~fields.indexOf('modified')){
					var res = true;
					fields.push('modified');
					modifier['$set'] = modifier['$set'] || {};
					_.each(docs, function(doc){
						res = res && !!~doc.users.indexOf(uid);
						doc.modified = (new Date()).getTime();
						modifier['$set']['modified'] = doc.modified;
					});

					res || console.log('update access denied');
					return res;
				} else
					console.log('update rejected');
			}
		});
	});
})();