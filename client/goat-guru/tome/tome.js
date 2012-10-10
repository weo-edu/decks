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

// Template.tome_view.preserve(['#tome-view']);

function tomeViewSetup(ctx, next) {
	var tomeId = ctx.params.id;
	var curTome = Decks.findOne(tomeId);

	var friend_ids = _.map(User.friends().fetch(), function(friend) {
			return friend._id;
	});

	Meteor.subscribe('UserDeckInfo', friend_ids, tomeId);

	Template.tome_view.helpers({
		'tome': function() {
			return Decks.findOne(tomeId);
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
			return ctx.template.curPage === 'my_tome_stats' ? 'active' : '';
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

	Template.tome_buddies.friends = function() {
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
		});
	}

	Template.tome_buddies.events({
		'click .buddy': function() {
			route('/tome/' + this.username + '/' + tomeId);	
		}
	});

	next();
}

route('/tome/:id', 
	route.requireUser(), 
	route.requireSubscription('userList'), 
	tomeViewSetup,
	function(ctx) {

	tome.render('tome_info');

});

route('/stats/:id', 
	route.requireUser(), 
	route.requireSubscription('userList'), 
	tomeViewSetup,
	function(ctx) {
	
	tome.render('my_tome_stats');

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
			console.log(tomeId, friendId);
			Game.route(tomeId, friendId);
		}
	});

	Template.tome_buddies.active = function() {
		return this._id === friendId ? 'active' : '';
	}

	tome.render('friend_tome_stats');

});