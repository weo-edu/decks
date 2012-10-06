route('/goat',function() { 

	Template.goat_browse.categories = function() {
		return Decks.homeFeeds;
	}

	Template.category.tomes = function() {
		var feed = Decks.feed(this, Meteor.user()._id);
		return feed.fetch();
	}

	dojo.render('goat_browse');

});

route('/friends',function() { 
	Template.buddies.events({
		'click .buddy': function(e) {
			Session.set('active', this);
		},
	});

	Template.buddies.preserve({
		'.buddy[id]': function(node) {
			return node.id;
		}
	});

	Template.buddies.friends = function() {
		return User.friends();
	}

	Template.buddies.helpers({
	 	'active': function() {
	 		var active = Session.get('active');
	 		if(active)
	 			return this._id == active._id ? 'active' : '';
	 		else
	 			return '';
	 	}
	});

	Template.opponent_decks.helpers({
		'decks': function() {
			var active = Session.get('active');
			if(active) {
				Meteor.subscribe('UserDeckInfo', active._id);

				var deckInfos = UserDeckInfo.find({user: active._id}).fetch();
				_.each(deckInfos, function(i) {
					_.extend(i, Decks.findOne(i.deck)); 
				});
				return deckInfos;
			}
		},
		'user': function() {
			var active = Session.get('active');
			return active ? active.username : 'Pick a Friend';
		}
	});

	dojo.render('friends_browse');
});

