var tomeRenderer = view.renderer('tomeRender');
var tome = {};

tome.render = function(name) {
	dojo.render('tome_view');
	tomeRenderer.render(name);
}

Template.tome_info.helpers({
	CPG: function() {
		return this.Decks && this.Decks.cardsPerGame && this.Decks.cardsPerGame * 2 || '';
	}
})

// Template.tome_view.preserve(['#tome-view']);

function tomeViewSetup(ctx, next) {
	var tomeUsername = ctx.params.username;
	var tomeTitle = ctx.params.title.replace(/-/g,' ');
	var friendName = ctx.params.friend;
	var friend_ids = Meteor.user().friends;
	var tomeId = null;

	//XXX unsubscribe
	Meteor.subscribe('deckByName', tomeUsername, tomeTitle, function() {
		var tome = getTome()
		tomeId = tome._id;
		Meteor.subscribe('userDecks', friend_ids, tomeId);
	});

	function getTome() {
		var tome =  tomeId 
			? Decks.findOne(tomeId) 
			: Decks.findOne({creatorName: tomeUsername, title: tomeTitle});
		return tome || {};
	}

	Meteor.subscribe('userByName', friendName);
	function friendId() {
		var friend = Meteor.users.findOne({username: friendName});
		return friend && friend._id;
	}

	Template.tome_view.helpers({
		'tome': function() {
			var curTome = {};
			curTome.Decks = getTome();
			if (curTome.Decks) {
				curTome.UserDeck = UserDeck.findOne({
					deck: tomeId, 
					user: friendId() || Meteor.user()._id
				});
			}
			console.log('curTome', curTome);
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
		}, 
		editable: function() {
			return this.Decks && this.Decks.creator === Meteor.user()._id;
		}
	})

	Template.tome_nav.events({
		'click .tome-nav li': function(evt) {
			var name = $(evt.currentTarget).attr('id');
			route('/' + tomeUsername + '/t/' + tomeTitle.replace(/ /g, '-') + '/' + name);
		}
	});

	Template.inner_tome.events({
		'click .practice': function() {
			Game.route(tomeId);
		}
	});

	Template.inner_tome.helpers({
		isPublished: function() {
			var tome = getTome();
			return tome && tome.status === 'published';
		}
	})

	Template.tome_buddies.helpers({
		friends: function() {
			var user_decks = UserDeck.find({
				user: {$in: friend_ids}, 
				deck: getTome()._id
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
				deck: getTome()._id, 
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
			route('/' + tomeUsername + '/t/' + tomeTitle.replace(/ /g, '-') + '/stats/' + this.username);	
		}
	});

	Template.tome_stats.helpers({
		opponentName: function() {
			return Meteor.users.findOne(this.opponent).username;
		},
		pastGames: function() {
			return _.clone((this.UserDeck && this.UserDeck.history) || []).reverse();
		},
		player: function() {
			return friendName ? friendName + "'s Stats" : Meteor.user().username + "'s Stats";
		},
		number: function(opts) {
			return opts || 0;
		}
	});

	next();
}

route('/:username/t/:title', function(ctx) {
	route.redirect('/' + ctx.params.username + '/t/' + ctx.params.title + '/info');
});

route('/:username/t/:title/info', 
	tomeViewSetup,
	function(ctx) {

	var myDeckInfo = UserDeck.find({deck: this._id, user: Meteor.user()._id}).fetch();

	tome.render('tome_info');

});

route('/:username/t/:title/stats', 
	tomeViewSetup,
	function(ctx) {
	
	tome.render('tome_stats');

});

route('/:username/t/:title/discussion', 
	tomeViewSetup,
	function(ctx) {

	tome.render('tome_discussion');

});

route('/:username/t/:title/stats/:friend', 
	tomeViewSetup,
	function(ctx) {

	var tomeUsername = ctx.params.username;
	var tomeTitle = ctx.params.title;
	var friendName = ctx.params.friend;
	var tomeId = null;

	function getTome() {
		var tome =  tomeId 
			? Decks.findOne(tomeId) 
			: Decks.findOne({creatorName: tomeUsername, title: tomeTitle});
		return tome || {};
	}

	function friendId() {
		var friend = Meteor.users.findOne({username: friendName});
		return friend && friend._id;
	}

	Template.friend_tome_stats.events({
		'click .challenge-button': function() {
			Game.route(getTome()._id, friendId());
		}
	});

	Template.friend_tome_stats.helpers({
		isConnected: function() {
			var friend = Meteor.users.findOne({username: friendName})
			return friend && friend.connected;
		},
		isPublished: function() {
			var tome = getTome();
			return tome && tome.status === 'published';
		}
	});

	Template.tome_buddies.helpers({
		active: function() {
			return this._id === friendId() ? 'active' : '';
		}
	});
	

	tome.render('friend_tome_stats');

});