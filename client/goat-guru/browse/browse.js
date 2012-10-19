route('/goat',function() { 

	Template.goat_browse.categories = function() {
		return Decks.homeFeeds;
	}

	Template.category.tomes = function() {
		var feed = Decks.feed(this, Meteor.user()._id);
		return feed.fetch();
	}

	Template.tome.events({
		'click': function() {
			console.log(this._id);
			route('/tome/' + this._id);
		}
	});

	dojo.render('goat_browse');

});

var toggle = {};


toggle.deckFilter = function(routeSession, decks, userId) {
	var filter = routeSession.get('filter');
	var query = {};
	if (filter)
		query['search.keywords'] = filter;

	if (routeSession.get('toggle') === 'collected') {
		query['UserDeck.user'] = userId;
		query['UserDeck.mastery.rank'] = {$gt: 0};
		console.log('decks', decks.find(query).fetch());
		return decks.find(query, {sort: {last_played: -1}});
	} else if (routeSession.get('toggle') === 'played') {
		query['UserDeck.user'] = userId;
		return decks.find(query, {sort: {last_played: -1}});
	} else if (routeSession.get('toggle') === 'created') {
		query['Deck.creator'] = userId;
		query['Decks.status'] = 'published';
		return decks.find(query);
	} else if (routeSession.get('toggle') === 'draft') {
		query['Deck.creator'] = userId;
		query['Decks.status'] = 'draft';
		return decks.find(query);
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
	var decks = join({
		cursor: [
			UserDeck.find({user: {$in: Meteor.user().friends}}),
			Decks.find({})
		],
		on: ['Decks._id', 'UserDeck.deck']
	});


	Template.tome.events({
		'click': function() {
			var friendName = Session.get('active').username;
			route('/tome/' + friendName + '/' + this.Decks._id);
		}
	});

	Template.buddies.events({
		'click .buddy': function(e) {
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
		'tomes': function() {
			var active = Session.get('active');
			if(active) {
				Meteor.subscribe('userDecks', active._id);
				return toggle.deckFilter(routeSession, decks, active._id);
			}
		}
	});

	Template.browse_filters.helpers(toggle.helpers(routeSession));

	Template.browse_filters.events(toggle.events(routeSession));

	routeSession.set('toggle', 'collected');
	routeSession.set('filter', '');

	dojo.render('friends_browse');
});


route('/inventory', function() {

	var decks = join({
		cursor: [
			UserDeck.find({user: Meteor.user()._id}),
			Decks.find({})
		],
		on: ['Decks._id', 'UserDeck.deck']
	});

	Template.tome.events({
		'click': function() {
			var path = '/tome/';
			if(routeSession.equals('toggle', 'draft'))
				path = '/create/tome/'

			route(path + this.Decks._id);
		}
	});

	Template.browse_tomes.helpers({
		tomes: function() {
			return toggle.deckFilter(routeSession, decks, Meteor.user()._id);
		}
	});

	Template.my_collection.events({
		'click #create-tome': function() {
			Decks.insert({creator: Meteor.user()._id, type: 'deck', status: 'draft'}, function(err,_id) {
				if (err) throw err;
				route('/create/tome/' + _id);
			});
		},
		'click #create-scroll': function() {
			Cards.insert({creator: Meteor.user()._id, type: 'card', status: 'draft'}, function(err,_id) {
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
