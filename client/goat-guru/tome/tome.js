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
	var tomeUsernameId = parseInt(ctx.params.id);
	var friendName = ctx.params.friend;
	var friend_ids = Meteor.user().friends;
	var tomeId = null;

	//XXX unsubscribe
	Meteor.subscribe('deckByName', tomeUsername, tomeUsernameId, function() {
		var tome = getTome()
		tomeId = tome._id;
		Meteor.subscribe('userDecks', friend_ids, tomeId);
		Meteor.subscribe('cards', tome.cards);
	});



	function getTome() {
		var tome =  tomeId 
			? Decks.findOne(tomeId) 
			: Decks.findOne({creatorName: tomeUsername, id: tomeUsernameId});
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
			route('/tome/' + tomeUsername + '/' + tomeUsernameId + '/' + name);

		}
	});

	Template.tome_info.helpers({
		scrollsInTome: function() {
			var deck = getTome();
			console.log(deck.cards);
			if(deck.cards)
				return u.print(Cards.find(deck.cards, {sort: {title: 1}}));
		}
	})

	Template.scroll_info_view.helpers({
		points: function() {
			return Math.round(Stats.points(Stats.regrade(this._id)));
		},
		hasPlays: function() {
			return this.plays || 0;
		}
	})

	Template.scroll_info_view.events({
		'click .scroll-info-view': function(e){
			routeSession.set('review-scroll', this);
			ui.get($('#scroll-preview .dialog')).closable().overlay().center().show();
		}
	});


	Template.solution_dialog.rendered = function() {
		var p = $('#problem');
		p.css({'margin-top': -p.height()/2});
	}

	Template.solution_dialog.helpers({
		html: function(ctx) { 
			var s = routeSession.get('review-scroll');
			curZebra = new Zebra(s.zebra);
			console.log(curZebra);
			return curZebra.render(s.assignment);
		},
		solution: function(ctx) {
			var s = routeSession.get('review-scroll');
			if(! curZebra.showSolution(s.solution))
				return s.solution;
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
		myMastery: function() {
			var info = UserDeck.findOne({
				deck: getTome()._id, 
				user: Meteor.user()._id
			});
			return info && info.mastery ? info.mastery.rank : '';
		},
		isConnected: function() {
			return this.connected ? 'connected' : 'disconnected';
		}
	});

	Template.tome_buddies.events({
		'click .buddy': function(evt) {
			$(evt.currentTarget).attr('id') === 'buddy-goat'
				? route('/tome/' + tomeUsername + '/' + tomeUsernameId + '/stats/')
				: route('/tome/' + tomeUsername + '/' + tomeUsernameId + '/stats/' + this.username);	
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

route('/tome/:username/:id', function(ctx) {
	route.redirect('/tome/' + ctx.params.username + '/' + ctx.params.id + '/info');
});

route('/tome/:username/:id/info', 
	tomeViewSetup,
	function(ctx) {

	var myDeckInfo = UserDeck.find({deck: this._id, user: Meteor.user()._id}).fetch();

	tome.render('tome_info');

});


route('/tome/:username/:id/discussion', 
	tomeViewSetup,
	function(ctx) {

	tome.render('tome_discussion');

});

route('/tome/:username/:id/stats', 
	tomeViewSetup,
	function(ctx) {

	var tomeUsername = ctx.params.username;
	var tomeUsernameId = parseInt(ctx.params.id);
	var tomeId = null;

	function getTome() {
		var tome = tomeId 
			? Decks.findOne(tomeId) 
			: Decks.findOne({creatorName: tomeUsername, id: tomeUsernameId});
		return tome || {};
	}
	
	Template.tome_buddies.helpers({
		active: function() {
			return (!this._id) ? 'active' : '';
		}
	});

	Template.tome_stats.events({
		'click .challenge-button': function() {
			Game.route(getTome()._id);
		}
	});
	
	tome.render('tome_stats');

});

route('/tome/:username/:id/stats/:friend', 
	tomeViewSetup,
	function(ctx) {

	var tomeUsername = ctx.params.username;
	var tomeUsernameId = parseInt(ctx.params.id);
	var friendName = ctx.params.friend;
	var tomeId = null;

	function getTome() {
		var tome =  tomeId 
			? Decks.findOne(tomeId) 
			: Decks.findOne({creatorName: tomeUsername, id: tomeUsernameId});
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