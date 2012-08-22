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

	Meteor.startup(function(){
		Games.allow({
			insert: function(uid, doc){
				doc.modified = doc.created = (new Date()).getTime();
				return true;
			},
			update: function(uid, docs, fields, modifier){
				var self = this;
				if(! ~fields.indexOf('created') && ! ~fields.indexOf('modified')){
					var res = true;
					_.each(docs, function(doc){
						res = res && !!~doc.users.indexOf(uid);
						doc.modified = (new Date()).getTime();
					});
					res || console.log('update access denied');
					return res;
				}
			}
		});
	});
})();