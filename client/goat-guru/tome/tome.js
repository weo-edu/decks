var tomeRenderer = view.renderer('tomeRender');
var tome = {};

tome.render = function(name) {
	dojo.render('tome_view');
	tomeRenderer.render(name);
}

// Template.tome_view.helpers({
// 	'show': function() {
// 		return Session.get('show_tome');
// 	}
// });

Template.tome_info.helpers({
	CPG: function() {
		return this.cardsPerGame && this.cardsPerGame * 2 || '';
	}
})

// Template.tome_view.preserve(['#tome-view']);

function tomeViewSetup(ctx, next) {
	var tomeId = ctx.params.id;
	var curTome = Decks.findOne(tomeId);
	var username = ctx.params.username;
	var friendId = username && Meteor.users.findOne({username: username})._id;

	var friend_ids = _.map(User.friends().fetch(), function(friend) {
			return friend._id;
	});

	Meteor.subscribe('userDecks', friend_ids, tomeId);

	Template.tome_view.helpers({
		'tome': function() {
			var curTome = Decks.findOne(tomeId);

			_.extend(curTome, UserDeck.findOne({
				deck: tomeId, 
				user: friendId || Meteor.user()._id
			}));

			return curTome;	
		}
	});

	Template.tome_nav.created = function() {
		this.curPage = tomeRenderer.rendered();
	}

	Template.tome_nav.helpers({
		isInfo: function(ctx) {
			return ctx.template.curPage === 'tome_info' ? 'active' : '';
		},
		isStats: function(ctx) {
			return ctx.template.curPage === 'tome_stats' ? 'active' : '';
		}, 
		isDiscussion: function(ctx) {
			return ctx.template.curPage === 'tome_discussion' ? 'active' : '';
		}
	})

	Template.tome_nav.events({
		'click .tome-nav li': function(evt) {
			var name = $(evt.currentTarget).attr('id');
			route('/' + name + '/' + tomeId);
		}
	});

	Template.inner_tome.events({
		'click .practice': function() {
			Game.route(tomeId);
		}
	});

	Template.inner_tome.helpers({
		isPublished: function() {
			var tome = Decks.findOne(tomeId)
			return tome && tome.status === 'published';
		}
	})

	Template.tome_buddies.helpers({
		friends: function() {
			var user_decks = UserDeck.find({
				user: {$in: friend_ids}, 
				deck: tomeId
			}).fetch();
			
			return Meteor.users.find({
				_id: {
					$in: _.map(user_decks, function(user_deck) {
						return user_deck.user;
					})
				}
			}, {sort: {connected: -1, username: 1}});
		},
		friendMastery: function() {
			var info = UserDeck.findOne({
				deck: tomeId, 
				user: this._id
			});
			return info.mastery ? info.mastery.rank : '';
		},
		isConnected: function() {
			return this.connected ? 'connected' : 'disconnected';
		}
	});

	Template.tome_buddies.events({
		'click .buddy': function() {
			route('/tome/' + this.username + '/' + tomeId);	
		}
	});

	Template.tome_stats.helpers({
		opponentName: function() {
			return Meteor.users.findOne(this.opponent).username;
		},
		pastGames: function() {
			return _.clone(this.history || []).reverse();
		},
		player: function() {
			return username ? username + "'s Stats" : Meteor.user().username + "'s Stats";
		},
		number: function(opts) {
			return opts || 0;
		}
	});

	next();
}

route('/tome/:id', 
	route.requireUser(), 
	route.requireSubscription('userList'), 
	tomeViewSetup,
	function(ctx) {

	var myDeckInfo = UserDeck.find({deck: this._id, user: Meteor.user()._id}).fetch();

	tome.render('tome_info');

});

route('/stats/:id', 
	route.requireUser(), 
	route.requireSubscription('userList'), 
	tomeViewSetup,
	function(ctx) {
	
	tome.render('tome_stats');

});

route('/discussion/:id', 
	route.requireUser(), 
	route.requireSubscription('userList'), 
	tomeViewSetup,
	function(ctx) {

	tome.render('tome_discussion');

});

route('/tome/:username/:id', 
	route.requireUser(), 
	route.requireSubscription('userList'), 
	tomeViewSetup,
	function(ctx) {

	var tomeId = ctx.params.id;
	var friendName = ctx.params.username;
	var friendId = Meteor.users.findOne({username: friendName})._id;

	Template.friend_tome_stats.events({
		'click .challenge-button': function() {
			Game.route(tomeId, friendId);
		}
	});

	Template.friend_tome_stats.helpers({
		isConnected: function() {
			return Meteor.users.findOne({username: ctx.params.username}).connected;
		},
		isPublished: function() {
			console.log('tome id', tomeId);
			var tome = Decks.findOne(tomeId)
			return tome.status === 'published';
		}
	});

	Template.tome_buddies.helpers({
		active: function() {
			return this._id === friendId ? 'active' : '';
		}
	});
	

	tome.render('friend_tome_stats');

});