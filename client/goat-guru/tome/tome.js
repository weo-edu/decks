var tomeRenderer = view.renderer('tomeRender');
var tome = {};

tome.render = function(name) {
	dojo.render('tome_view');
	tomeRenderer.render(name);
}

Template.tome_view.helpers({
	'show': function() {
		return Session.get('show_tome');
	}
});

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

	var friend_ids = _.map(User.friends().fetch(), function(friend) {
			return friend._id;
	});

	Meteor.subscribe('UserDeckInfo', friend_ids, tomeId);

	Template.tome_view.helpers({
		'tome': function() {
			var curTome = Decks.findOne(tomeId);
			
			_.extend(curTome, UserDeckInfo.findOne({deck: tomeId, user: Meteor.user()._id}));

			return numberizeStats(curTome);
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

	Template.tome_buddies.helpers({
		friends: function() {
			var user_decks = UserDeckInfo.find({
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
			var info = UserDeckInfo.findOne({
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

	Template.tome_stats.created = function() {
		if(username)
			this.friendStats = function(name) {
				var info = UserDeckInfo.findOne({deck: tomeId, user: Meteor.users.findOne({username: username})._id}, {fields: [name]});
				return LocalCollection._getField(info, name);
			}
	}

	Template.tome_stats.helpers({
		friendName: function() {
			return username && username + "'s Stats" || '';
		},
		friendStats: function(name) {
			return username ? Meteor.template.friendStats(name) || 0 : '';
		},
		friendLastPlayed: function() {
			return username ? Meteor.template.friendStats('last_played') : '';
		}
	});

	function numberizeStats(stats) {
		var numStats = {
			mastery : { rank : stats.mastery && stats.mastery.rank || 0 },
			attempts : stats.attempts || 0,
			wins : stats.wins || 0,
			losses : stats.losses || 0,
			multiAttempts : stats.multiAttempts || 0,
			multiWins : stats.multiWins || 0,
			multiLosses : stats.multiLosses || 0,
			singleAttempts : (stats.attempts - stats.multiAttempts) || 0,
			singleWins : (stats.wins - stats.multiWins) || 0,
			singleLosses : (stats.losses - stats.multiLosses) || 0 
		}

		return _.extend(stats, numStats);
	}

	next();
}

route('/tome/:id', 
	route.requireUser(), 
	route.requireSubscription('userList'), 
	tomeViewSetup,
	function(ctx) {

	var myDeckInfo = UserDeckInfo.find({deck: this._id, user: Meteor.user()._id}).fetch();

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
		}
	});

	Template.tome_buddies.helpers({
		active: function() {
			return this._id === friendId ? 'active' : '';
		}
	});
	

	tome.render('friend_tome_stats');

});