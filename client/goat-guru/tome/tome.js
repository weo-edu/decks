Template.tome.events({
	'click': function() {
		route('/tome/' + this._id);
	}
});

Template.tome_view.helpers({
	'show': function() {
		return Session.get('show_tome');
	}
});

Template.tome_view.preserve(['#tome-view']);

route('/tome/:id', 
	route.requireUser(), 
	route.requireSubscription('userList'), 
	function(ctx) {

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

	dojo.render('tome_view');

});