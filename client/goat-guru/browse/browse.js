route('/goat',function() { 

	view.render('goat_browse');
	Meteor.defer(hideTome);

	Template.goat_inner.categories = function() {
		return Decks.homeFeeds;
	}

	Template.goat_browse.init_dojo = function() {
		return {page: Template.goat_inner()}
	}

	Template.category.tomes = function() {
		var feed = Decks.feed(this, Meteor.user()._id);
		return feed.fetch();
	}

});

route('/friends',function() { 

	view.render('friends_browse');
	Meteor.defer(hideTome);

	Template.friends_browse.init_dojo = function() {
		return {page: Template.friends_inner()}
	}


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
});

