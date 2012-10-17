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


toggle.deckFilter = function(routeSession, userId) {
	if (routeSession.get('toggle') === 'collected') {
		var query = {user: userId};
		query['mastery.rank'] = {$gt: 0};
		var deckInfos = UserDeckInfo.find(query, {sort: {last_played: -1}}).fetch();
		_.each(deckInfos, function(deckInfo) {
			_.extend(deckInfo, Decks.findOne(deckInfo.deck)); 
		});
	} else if (routeSession.get('toggle') === 'played') {
		var query = {user: userId};
		var deckInfos = UserDeckInfo.find(query, {sort: {last_played: -1}}).fetch();
		_.each(deckInfos, function(deckInfo) {
			_.extend(deckInfo, Decks.findOne(deckInfo.deck)); 
		});
	} else if (routeSession.get('toggle') === 'created') {
		var deckInfos = Decks.find({creator: userId}).fetch();
		_.each(deckInfos, function(deckInfo) {
			_.extend(deckInfo, UserDeckInfo.findOne(deckInfo._id));
		});
	}


	//XXX this should return a cursor

	return deckInfos;
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
		}
	}
}

route('/friends',function() { 
	/*console.log('user', Session.get('active'));
	var decks = join({
		cursor: [
			UserDeckInfo.find({user: {$in: Meteor.user().friends}}),
			Decks.find({})
		],
		on: ['decks._id', 'UserDeckInfo.deck']
	});

	console.log('decks',decks.find({}).fetch())*/

	Template.tome.events({
		'click': function() {
			console.log(this);
			var friendName = Session.get('active').username;
			route('/tome/' + friendName + '/' + this._id);
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
				Meteor.subscribe('UserDeckInfo', active._id);
				return toggle.deckFilter(routeSession, active._id);
			}
		}
	});

	Template.browse_filters.helpers(toggle.helpers(routeSession));

	Template.browse_filters.events(toggle.events(routeSession));

	routeSession.set('toggle', 'collected');

	dojo.render('friends_browse');
});


route('/inventory', function() {

	Template.tome.events({
		'click': function() {
			console.log(this._id);
			route('/tome/' + this._id);
		}
	});

	Template.browse_tomes.helpers({
		tomes: function() {
			return toggle.deckFilter(routeSession, Meteor.user()._id);
		}
	});

	Template.browse_filters.helpers(toggle.helpers(routeSession));

	Template.browse_filters.events(toggle.events(routeSession));

	routeSession.set('toggle', 'collected');

	dojo.render('my_collection');

});
