var tomeRenderer = view.renderer('tomeRender');
var tome = {};

tome.render = function(name) {
	dojo.render('tome_view');
	tomeRenderer.render(name);
}

var tomeSubRenderer = view.renderer('tomeSubTab');
var subTome = {};

subTome.render = function(name) {
	tomeSubRenderer.render(name);
}


function tomeSetup(ctx, next) {
	ctx.tome = Decks.findOne({ creatorName: ctx.params.creatorName, id: ctx.params.id }) || {};
	Meteor.subscribe('userDecks', Meteor.user()._id, ctx.tome._id);
	Meteor.subscribe('cards', ctx.tome.cards);

	setupProblemPreview();

	ctx.user_deck = UserDeck.findOne({ user: Meteor.user()._id, deck: ctx.tome._id });

	Template.tome_view.helpers({
		tome: function() {
			var curTome = {Decks: ctx.tome};
			if (ctx.tome) {
				curTome.UserDeck = UserDeck.findOne({
					deck: curTome.Decks._id, 
					user: Meteor.user()._id
				});
			}
			return curTome;	
		},
		CPG: function() {
			return this.Decks && this.Decks.cardsPerGame && this.Decks.cardsPerGame * 2 || '';
		},
		mastery: function() {
			return ctx.user_deck && ctx.user_deck.mastery && ctx.user_deck.mastery.rank;
		}
	});

	Template.tome_view.events({
		'click .train-button': function() {
			var d = ui.get('#tome-view .dialog').overlay().center().show();
		}
	})

	Template.difficulty_dialog.events({
		'click .difficulty-buttons div': function(evt) {
			var d = $(evt.currentTarget).attr('rel');
			Game.route(ctx.tome._id, Guru.goat(), {rank: parseInt(d, 10)});
		}
	})	

	Template.tome_nav.created = function() {
		this.curPage = tomeRenderer.rendered();
	}

	Template.tome_nav.helpers({
		isActive: function(name) {
			// var cur = Meteor.template.curPage;
			// if(cur === 'tome_stats' && ctx.params.statUsername !== Meteor.user().username)
			// 	cur = 'tome_friends';
			return Meteor.template.curPage === 'tome_' + name ? 'active' : '';
		},
		editable: function() {
			return this.Decks && this.Decks.creator === Meteor.user()._id;
		}
	});

	Template.tome_nav.events({
		'click .tome-nav li': function(evt) {
			var name = $(evt.currentTarget).attr('id');
			route('/tome/' + ctx.params.creatorName + '/' + ctx.params.id + '/' + name);
		}
	});

	next();
}

/**
 * Require tome info for all tome view routes
 */

route('/tome/:creatorName/:id/*', 
	//XXX unsubscribe
	route.requireSubscription(
		'deckByName',
		function(ctx) {
			return ctx.params.creatorName;
		},
		function(ctx) {
			ctx.params.id = parseInt(ctx.params.id,10);
			return ctx.params.id;
		}),
		setupBuddyList,
		tomeSetup,
		route.requireSubscription('userDecks', 
		function(ctx) {
			return Meteor.user()._id;
		},
		function(ctx) {
			return ctx.tome._id
		})
);

route('/tome/:creatorName/:id', function(ctx) {
	route.redirect('/tome/' + ctx.params.creatorName+ '/' + ctx.params.id + '/friends');
});

/**
 * Tome Scrolls
 */

route('/tome/:creatorName/:id/info', function(ctx) {
	Template.tome_info.helpers({
		scrollsInTome: function() {
			return ctx.tome.cards ? Cards.find(ctx.tome.cards, {sort: {title: 1}}) : {};
		}
	});

	Template.scroll_info_view.events({
		'click .scroll-info-view': function(e){
			previewDialog(this._id)
		}
	});

	Template.scroll_info_view.helpers({
		points: function() {
			return Math.round(Stats.points(Stats.regrade(this._id)));
		},
		hasPlays: function() {
			return this.plays || 0;
		}
	})

	tome.render('tome_info');
});

/**
 * Tome Friends List
 */

route('/tome/:creatorName/:id/friends', function(ctx) { 

	var friend_ids = Meteor.user().friends;
	Meteor.subscribe('userDecks', friend_ids, ctx.tome._id);

	Template.tome_friends.helpers({
		friends: function() {
			var user_decks = UserDeck.find({
				user: {$in: friend_ids}, 
				deck: ctx.tome._id
			}).fetch();
			
			return Meteor.users.find({
				_id: {
					$in: _.map(user_decks, function(user_deck) {
						return user_deck.user;
					})
				}
			}, {sort: {status: -1, username: 1}});
		},
		myMastery : function() {
			return ctx.user_deck && ctx.user_deck.mastery && ctx.user_deck.mastery.rank;
		},
		friendMastery: function() {
			var info = UserDeck.findOne({
				deck: ctx.tome._id, 
				user: this._id
			});
			return info.mastery ? info.mastery.rank : '';
		},
		isConnected: function() {
			return User.statusToString(this.status);
		}
	});

	Template.tome_friends.events({
		'click .buddy': function(evt) {
			$(evt.currentTarget).attr('id') === 'buddy-me'
				? route('/tome/' + ctx.params.creatorName + '/' + ctx.params.id + '/stats/')
				: route('/tome/' + ctx.params.creatorName + '/' + ctx.params.id + '/stats/' + this.username);	
		}
	});

	tome.render('tome_friends');
});

/**
 * Tome Stats
 */

route('/tome/:creatorName/:id/stats/:statUsername?/:subNav?',
	route.requireSubscription('userDecks', 
		function(ctx) {
			ctx.params.statUsername = ctx.params.statUsername || Meteor.user().username;
			ctx.statUID = Meteor.users.findOne({username: ctx.params.statUsername})._id;
			return ctx.statUID;
		},
		function(ctx) {
			return ctx.tome._id
		}),
	function(ctx) { 

	//XXX should unsubscribe at some point
  Meteor.subscribe('userCards', ctx.statUID, ctx.tome.cards);
	
	var user_deck = UserDeck.findOne({ user: ctx.statUID, deck: ctx.tome._id });

	Template.tome_stats.created = function() {
		this.curPage = tomeSubRenderer.rendered();
	}	

	Template.tome_stats.events({
		'click .tome-sub-nav li': function(evt) {
			var name = $(evt.currentTarget).attr('id');
			route('/tome/' + ctx.params.creatorName + '/' + ctx.params.id + '/stats/' + ctx.params.statUsername + '/' + name);
		}
	});

	Template.tome_stats.helpers({
		isActive: function(name) {
			return Meteor.template.curPage === 'tome_' + name ? 'active' : '';
		},
		user: function() {
			return Meteor.users.findOne({username: ctx.params.statUsername});
		},
		userDeck: function() {
			return user_deck;
		},
		isChallengable: function() {
			return ctx.params.statUsername !== Meteor.user().username
				&& Meteor.users.findOne(ctx.statUID).status === User.STATUS.CONNECTED;
		}
	});

	Template.tome_stats.events({
		'click .challenge-button': function() {
			Game.route(ctx.tome._id, ctx.statUID);
		}
	})

	Template.tome_overview.helpers({
		number: function(opts) {
			return opts || 0;
		}
	})

	Template.tome_history.helpers({
		opponentName: function() {
			return Meteor.users.findOne(this.opponent).username;
		},
		pastGames: function() {
			return _.clone((user_deck && user_deck.history) || []).reverse();;
		}
	})

	Template.tome_scroll_stats.helpers({
		scrollsInTome: function() {
			return ctx.tome.cards ? Cards.find(ctx.tome.cards, {sort: {title: 1}}) : {};
		}
	})

	Template.tome_scroll_stats.events({
		'click .scroll-info-view': function() {
			previewDialog(this._id);
		}
	});

	Template.scroll_info_stat_view.helpers({
		stats: function() {
			var cardId = this._id;
      var stat = Stats.userCard(ctx.statUID, cardId);
      var stats = {
        accuracy: { name: 'accuracy', val:  stat.accuracy},
        speed:  { name: 'speed', val: stat.speed },
        points: { name: 'points', val: Math.round(Stats.points(Stats.regrade(cardId))) },
        retention: { name: 'retention', val: stat.retention },
        time: {name: 'time', vals: stat.time_mu}
      };
      return stats;
    }
	})

	Template.scroll_stat.helpers({
			height: function() {
				return (this.val * 100) + '%';
			},
			backgroundColor: function() {
				var p = (this.val * 100);
				var color = '#D31F2C';
				if ( p > 95)
					color = 'rgb(64, 202, 49)';		
				else if (p > 75)
					color = '#29ABE2';
				else if (p > 40)
					color = 'rgb(241, 205, 12)';

				return color;
			}
		});


	if(!ctx.params.subNav)
		ctx.params.subNav = 'overview';
	
	tome.render('tome_stats');
	subTome.render('tome_' + ctx.params.subNav)

});

/**
 * Tome Discussion
 */

route('/tome/:username/:id/discussion', function(ctx) {

	tome.render('tome_discussion');
});


// Template.tome_view.preserve(['#tome-view']);

// function tomeViewSetup(ctx, next) {
// 	var tomeUsername = ctx.params.username;
// 	var tomeUsernameId = parseInt(ctx.params.id);
// 	var friendName = ctx.params.friend;
// 	var friend_ids = Meteor.user().friends;
// 	var tomeId = null;

// 	//XXX unsubscribe
// 	Meteor.subscribe('deckByName', tomeUsername, tomeUsernameId, function() {
// 		var tome = getTome()
// 		tomeId = tome._id;
// 		Meteor.subscribe('userDecks', friend_ids, tomeId);
// 		Meteor.subscribe('cards', tome.cards);
// 	});



// 	function getTome() {
// 		var tome =  tomeId 
// 			? Decks.findOne(tomeId) 
// 			: Decks.findOne({creatorName: tomeUsername, id: tomeUsernameId});
// 		return tome || {};
// 	}

// 	Meteor.subscribe('userByName', friendName);
// 	function friendId() {
// 		var friend = Meteor.users.findOne({username: friendName});
// 		return friend && friend._id;
// 	}

// 	Template.tome_view.helpers({
// 		'tome': function() {
// 			var curTome = {};
// 			curTome.Decks = getTome();
// 			if (curTome.Decks) {
// 				curTome.UserDeck = UserDeck.findOne({
// 					deck: tomeId, 
// 					user: friendId() || Meteor.user()._id
// 				});
// 			}
// 			return curTome;	
// 		}
// 	});

// 	Template.tome_nav.created = function() {
// 		this.curPage = tomeRenderer.rendered();
// 	}

// 	Template.tome_nav.helpers({
// 		isInfo: function(ctx) {
// 			return ctx.template.curPage === 'tome_info' ? 'active' : '';
// 		},
// 		isStats: function(ctx) {
// 			return ctx.template.curPage === 'tome_stats' ? 'active' : '';
// 		}, 
// 		isDiscussion: function(ctx) {
// 			return ctx.template.curPage === 'tome_discussion' ? 'active' : '';
// 		}, 
// 		editable: function() {
// 			return this.Decks && this.Decks.creator === Meteor.user()._id;
// 		}
// 	})

// 	Template.tome_nav.events({
// 		'click .tome-nav li': function(evt) {
// 			var name = $(evt.currentTarget).attr('id');
// 			route('/tome/' + tomeUsername + '/' + tomeUsernameId + '/' + name);

// 		}
// 	});

// 	Template.tome_info.helpers({
// 		scrollsInTome: function() {
// 			var deck = getTome();
// 			if(deck.cards)
// 				return Cards.find(deck.cards, {sort: {title: 1}});
// 		}
// 	})

// 	Template.scroll_info_view.helpers({
// 		points: function() {
// 			return Math.round(Stats.points(Stats.regrade(this._id)));
// 		},
// 		hasPlays: function() {
// 			return this.plays || 0;
// 		}
// 	})

// 	// Template.inner_tome.helpers({
// 	// 	isPublished: function() {
// 	// 		var tome = getTome();
// 	// 		return tome && tome.status === 'published';
// 	// 	}
// 	// })
// 	Template.scroll_info_view.events({
// 	'click .scroll-info-view': function(e){
// 			previewDialog(this)
// 		}
// 	});

// 	Template.tome_buddies.helpers({
// 		friends: function() {
// 			var user_decks = UserDeck.find({
// 				user: {$in: friend_ids}, 
// 				deck: getTome()._id
// 			}).fetch();
			
// 			return Meteor.users.find({
// 				_id: {
// 					$in: _.map(user_decks, function(user_deck) {
// 						return user_deck.user;
// 					})
// 				}
// 			}, {sort: {connected: -1, username: 1}});
// 		},
// 		friendMastery: function() {
// 			var info = UserDeck.findOne({
// 				deck: getTome()._id, 
// 				user: this._id
// 			});
// 			return info.mastery ? info.mastery.rank : '';
// 		},
// 		myMastery: function() {
// 			var info = UserDeck.findOne({
// 				deck: getTome()._id, 
// 				user: Meteor.user()._id
// 			});
// 			return info && info.mastery ? info.mastery.rank : '';
// 		},
// 		isConnected: function() {
// 			return this.connected ? 'connected' : 'disconnected';
// 		}
// 	});

// 	Template.tome_buddies.events({
// 		'click .buddy': function(evt) {
// 			$(evt.currentTarget).attr('id') === 'buddy-goat'
// 				? route('/tome/' + tomeUsername + '/' + tomeUsernameId + '/stats/')
// 				: route('/tome/' + tomeUsername + '/' + tomeUsernameId + '/stats/' + this.username);	
// 		}
// 	});

// 	Template.tome_stats.helpers({
// 		opponentName: function() {
// 			return Meteor.users.findOne(this.opponent).username;
// 		},
// 		pastGames: function() {
// 			return _.clone((this.UserDeck && this.UserDeck.history) || []).reverse();
// 		},
// 		player: function() {
// 			return friendName ? friendName + "'s Stats" : Meteor.user().username + "'s Stats";
// 		},
// 		number: function(opts) {
// 			return opts || 0;
// 		},
// 		isGoat: function() {
// 			return false;
// 		}
// 	});

// 	next();
// }

// route('/tome/:username/:id', function(ctx) {
// 	route.redirect('/tome/' + ctx.params.username + '/' + ctx.params.id + '/info');
// });

// route('/tome/:username/:id/info', 
// 	tomeViewSetup,
// 	function(ctx) {

// 	var myDeckInfo = UserDeck.find({deck: this._id, user: Meteor.user()._id}).fetch();

// 	tome.render('tome_info');

// });


// route('/tome/:username/:id/discussion', 
// 	tomeViewSetup,
// 	function(ctx) {

// 	tome.render('tome_discussion');

// });

// route('/tome/:username/:id/stats', 
// 	tomeViewSetup,
// 	function(ctx) {

// 	var tomeUsername = ctx.params.username;
// 	var tomeUsernameId = parseInt(ctx.params.id);
// 	var tomeId = null;

// 	function getTome() {
// 		var tome = tomeId 
// 			? Decks.findOne(tomeId) 
// 			: Decks.findOne({creatorName: tomeUsername, id: tomeUsernameId});
// 		return tome || {};
// 	}
	
// 	Template.tome_buddies.helpers({
// 		active: function() {
// 			return (!this._id) ? 'active' : '';
// 		}
// 	});

// 	Template.tome_stats.events({
// 		'click .challenge-button': function() {
// 			Game.route(getTome()._id);
// 		}
// 	});

// 	Template.tome_stats.helpers({
// 		isGoat: function() {
// 			return true;
// 		}
// 	})
	
// 	tome.render('tome_stats');

// });

// route('/tome/:username/:id/stats/:friend', 
// 	tomeViewSetup,
// 	function(ctx) {

// 	var tomeUsername = ctx.params.username;
// 	var tomeUsernameId = parseInt(ctx.params.id);
// 	var friendName = ctx.params.friend;
// 	var tomeId = null;

// 	function getTome() {
// 		var tome =  tomeId 
// 			? Decks.findOne(tomeId) 
// 			: Decks.findOne({creatorName: tomeUsername, id: tomeUsernameId});
// 		return tome || {};
// 	}

// 	function friendId() {
// 		var friend = Meteor.users.findOne({username: friendName});
// 		return friend && friend._id;
// 	}

// 	Template.friend_tome_stats.events({
// 		'click .challenge-button': function() {
// 			Game.route(getTome()._id, friendId());
// 		}
// 	});

// 	Template.friend_tome_stats.helpers({
// 		isConnected: function() {
// 			var friend = Meteor.users.findOne({username: friendName})
// 			return friend && friend.connected;
// 		},
// 		isPublished: function() {
// 			var tome = getTome();
// 			return tome && tome.status === 'published';
// 		}
// 	});

// 	Template.tome_buddies.helpers({
// 		active: function() {
// 			return this._id === friendId() ? 'active' : '';
// 		}
// 	});
	

// 	tome.render('friend_tome_stats');

// });
