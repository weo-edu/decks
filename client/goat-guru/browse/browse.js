function setupBuddyList(ctx, next) {
	var user = Meteor.users.findOne({username: ctx.params.username}) || {};

	Template.buddies.helpers({
		'friends': function() {
			return User.friends();
		},
	 	'active': function() {
	 		return this._id === user._id ? 'active' : '';
	 	},
	 	'isConnected': function() {
	 		return this.connected ? 'connected' : 'disconnected';
	 	}
	});
	next();
}

route('/browse', setupBuddyList, function() { 
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
			route('/tome/' + this.creatorName + '/' + this.id);
		}
	});

	dojo.render('goat_browse');
});



route('/user/:username?', 
	route.requireSubscription('userByName', function(ctx) {
		return ctx.params.username;
	}),
	setupBuddyList,
	function(ctx) { 

	setupProblemPreview();

	var myName = Meteor.user().username;
	var username = ctx.params.username || myName;
	var isMe = myName === username;
	var user = Meteor.users.findOne({username: username}) || {};
	
	Meteor.subscribe('playedDecks', user._id);
	Meteor.subscribe('created', user._id);

	var decks = join({
		cursor: [
			UserDeck.find({user: user._id}),
			Decks.find({})
		],
		on: ['Decks._id', 'UserDeck.deck']
	});

	var	created = union(
		Decks.find({creator: user._id}),
		Cards.find({creator: user._id})
	);

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

	Template.tome.events({
		'click': function() {
			route('/tome/' + this.Decks.creatorName + '/' + this.Decks.id);
		}
	});

	Template.tome_detailed.events({
		'click': function() {
			routeSession.equals('toggle', 'draft') && this.creator === Meteor.user()._id
				? route('/tome/' + username + '/' + this.id + '/edit' )
				: route('/tome/' + this.creatorName + '/' + this.id);
		}
	});


	Template.scroll_detailed.events({
		'click': function() {
			routeSession.equals('toggle', 'draft') && this.creator === Meteor.user()._id
				? route('/scroll/' + username + '/' + this.id + '/edit' )
				: previewDialog(Cards.findOne(this._id));
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
			return toggle.deckFilter(routeSession, decks, user._id);
		}
	});

	Template.browse_created.helpers({
		items: function() {
			return toggle.deckFilter(routeSession, created, user._id);
		},
		tome: function() {
			return this.type === 'deck';
		}
	});

	Template.opponent_decks.helpers({
		'user': function() {
			return user._id && user;
		},
		isMe: function() {
			return isMe;
		}
	});

	Template.opponent_decks.events({
		'click #create-tome': function() {
			Meteor.users.update(Meteor.user()._id, {$inc: {deck_counter: 1}});

			//XXX this only works if users are limited to one session
			var deck_id = Meteor.user().deck_counter;
			Decks.insert(
				{	creator: Meteor.user()._id, 
					type: 'deck', 
					status: 'draft',
					creatorName: Meteor.user().username,
					id: deck_id
				}
			); 
			route('/tome/' + Meteor.user().username + '/' + deck_id + '/edit');
		},
		'click #create-scroll': function() {
			Meteor.users.update(Meteor.user()._id, {$inc: {card_counter: 1}});

			var card_id = Meteor.user().card_counter;
			Cards.insert(
				{ creator: Meteor.user()._id, 
					type: 'card', 
					status: 'draft',
					creatorName: Meteor.user().username,
					id: card_id
				}
			); 
			
			route('/scroll/' + Meteor.user().username + '/' + card_id + '/edit');
		}
	})

	Template.browse_filters.helpers(toggle.helpers(routeSession));

	Template.browse_filters.events(toggle.events(routeSession));

	routeSession.set('toggle', 'collected');
	routeSession.set('filter', '');

	dojo.render('friends_browse');
});
