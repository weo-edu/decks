route('/goat',function() { 
	//XXX unsubscribe
	Meteor.subscribe('homeDecks');
	Template.goat_browse.categories = function() {
		return Decks.homeFeeds;
	}

	Template.category.tomes = function() {
		var feed = Decks.feed(this, Meteor.user()._id);
		return feed.fetch();
	}

	Template.tome_general.events({
		'click': function() {
			route('/tome/' + this._id);
		}
	});

	dojo.render('goat_browse');
});

var toggle = {};
toggle.deckFilter = function(routeSession, collection, userId) {
	var filter = routeSession.get('filter');
	var query = {};
	
	//XXX too much repeat code
	if (routeSession.get('toggle') === 'collected') {
		query['UserDeck.user'] = userId;
		query['UserDeck.mastery.rank'] = {$gt: 0};
		if (filter)
			query['Decks.search.keywords'] = filter;
		return collection.find(query, {sort: {'UserDeck.last_played': -1}});
	} else if (routeSession.get('toggle') === 'played') {
		query['UserDeck.user'] = userId;
		if (filter)
			query['Decks.search.keywords'] = filter;
		return collection.find(query, {sort: {'UserDeck.last_played': -1}});
	} else if (routeSession.get('toggle') === 'created') {
		query['creator'] = userId;
		query['status'] = 'published';
		if (filter)
			query['search.keywords'] = filter;
		return collection.find(query, {sort: {updated: -1}});
	} else if (routeSession.get('toggle') === 'draft') {
		query['creator'] = userId;
		query['status'] = 'draft';
		if (filter)
			query['search.keywords'] = filter;
		return collection.find(query, {sort: {updated: -1}});
	}
}

toggle.helpers = function(routeSession) {
	return {
		collectedToggle: function() {
			return routeSession.equals('toggle', 'collected') ? 'active' : '';
		},
		createdToggle: function() {
			return routeSession.equals('toggle', 'created') ? 'active' : '';
		},
		playedToggle: function() {
			return routeSession.equals('toggle', 'played') ? 'active' : '';
		},
		draftToggle: function() {
			return routeSession.equals('toggle', 'draft') ? 'active' : '';
		}
	}
}

toggle.events = function(routeSession) {
	return {
		'click #collected-toggle': function() {
			routeSession.set('toggle', 'collected');
		},
		'click #created-toggle': function() {
			routeSession.set('toggle', 'created');
		},
		'click #played-toggle': function() {
			routeSession.set('toggle', 'played');
		},
		'click #draft-toggle': function() {
			routeSession.set('toggle', 'draft');
		},
		'keyup .browse-filter': function(evt) {
			routeSession.set('filter', $(evt.target).val());
		}
	}
}

route('/friends',function() { 
	var decks = null;
	var created = null;

	function setupCollections(user) {
		Meteor.subscribe('playedDecks', user._id);
		Meteor.subscribe('created', user._id);

		decks = join({
			cursor: [
				UserDeck.find({user: user._id}),
				Decks.find({})
			],
			on: ['Decks._id', 'UserDeck.deck']
		});

		created = union(
			Decks.find({creator: user._id}),
			Cards.find({creator: user._id})
		);
	}
	

	Template.tome.events({
		'click': function() {
			var friendName = Session.get('active').username;
			route('/tome/' + friendName + '/' + this.Decks._id);
		}
	});

	Template.buddies.events({
		'click .buddy': function(e) {
			setupCollections(this);
			Session.set('active', this);
			routeSession.set('toggle', 'collected');
		},
	});

	Template.buddies.preserve({
		'.buddy[id]': function(node) {
			return node.id;
		}
	});

	Template.buddies.helpers({
		'friends': function() {
			return User.friends();
		},
	 	'active': function() {
	 		var active = Session.get('active');
	 		if(active)
	 			return this._id == active._id ? 'active' : '';
	 		else
	 			return '';
	 	},
	 	'isConnected': function() {
	 		return this.connected ? 'connected' : 'disconnected';
	 	}
	});

	Template.opponent_decks.helpers({
		'user': function() {
			var active = Session.get('active');
			return active ? active : false;
		}
	});

	Template.browse_tomes.helpers({
		played: function() {
			var toggle = routeSession.get('toggle');
			if (toggle === 'collected' || toggle === 'played') {
				return true
			}
		}
	});

	Template.browse_tomes_played.helpers({
		tomes: function() {
			var active = Session.get('active');
			if(active) {
				if (!decks)
					setupCollections(active);
				return toggle.deckFilter(routeSession, decks, active._id);
			}
		}
	});

	Template.browse_created.helpers({
		items: function() {
			var active = Session.get('active');
			if(active) {
				if (!created)
					setupCollections(active)
				return toggle.deckFilter(routeSession, created, active._id);
			}
		},
		tome: function() {
			return this.type === 'deck';
		}
	});

	Template.browse_filters.helpers(toggle.helpers(routeSession));

	Template.browse_filters.events(toggle.events(routeSession));

	routeSession.set('toggle', 'collected');
	routeSession.set('filter', '');

	dojo.render('friends_browse');
});


created = null
route('/inventory', function() {

	//XXX remember to unsubscribe
	Meteor.subscribe('playedDecks', Meteor.user()._id);
	Meteor.subscribe('created', Meteor.user()._id);


	var decks = join({
		cursor: [
			UserDeck.find({user: Meteor.user()._id}),
			Decks.find({})
		],
		on: ['Decks._id', 'UserDeck.deck']
	});

	created = union(
		Decks.find({creator: Meteor.user()._id}),
		Cards.find({creator: Meteor.user()._id})
	);

	Template.tome_detailed.events({
		'click': function() {
			route('/create/tome/' + this._id);
		}
	});

	Template.tome.events({
		click: function() {
			console.log('click');
			route('/tome/' + this.Decks._id);
		}
	});

	Template.scroll_detailed.events({
		'click': function() {
			var path = null;
			if(routeSession.equals('toggle', 'draft'))
				path = '/create/scroll/'
			else
				path = '/scroll/'

			route(path + this._id);
		}
	});

	Template.browse_tomes.helpers({
		played: function() {
			var toggle = routeSession.get('toggle');
			if (toggle === 'collected' || toggle === 'played') {
				return true
			}
		}
	});

	Template.browse_tomes_played.helpers({
		tomes: function() {
			return toggle.deckFilter(routeSession, decks, Meteor.user()._id);
		}
	});

	Template.browse_created.helpers({
		items: function() {
			return toggle.deckFilter(routeSession, created, Meteor.user()._id);
		},
		tome: function() {
			return this.type === 'deck';
		}
	});

	Template.my_collection.events({
		'click #create-tome': function() {
			Decks.insert(
				{	creator: Meteor.user()._id, 
					type: 'deck', 
					status: 'draft',
					creatorName: Meteor.user().username
				}, 
				function(err,_id) {
				if (err) throw err;
				route('/create/tome/' + _id);
			});
		},
		'click #create-scroll': function() {
			Cards.insert(
				{ creator: Meteor.user()._id, 
					type: 'card', 
					status: 'draft',
					creatorName: Meteor.user().username
				}, 
					function(err,_id) {
				if (err) throw err;
				route('/create/scroll/' + _id);
			});
		}
	})

	Template.browse_filters.helpers(toggle.helpers(routeSession));

	Template.browse_filters.events(toggle.events(routeSession));

	routeSession.set('toggle', 'collected');
	routeSession.set('filter', '');

	dojo.render('my_collection');

});
