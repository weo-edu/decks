Template.tome.events({
	'click': function() {
		route('/tome/' + this._id);
	}
});

Template.tome_view.preserve(['#tome-view']);

route('/tome/:id', function(ctx) {

	Meteor.subscribe('UserDeckInfo', friend_ids, tomeId);

	var tomeId = ctx.params.id;
	var curTome = Decks.findOne(tomeId);
	var friend_ids = _.map(User.friends().fetch(), function(friend) {
			return friend._id;
		});

	if (!Session.get('currentPage') || Session.get('currentPage') == 'empty_dojo' || ! view.rendered()) {
		view.render('empty_dojo');
	}
		

	Session.set('show_tome', true);
	// Session.set('animate_tome', true);

	Template.tome_view.helpers({
		'show': function() {
			return Session.get('show_tome');
		},
		'tome': function() {
			return curTome;
		}
	});

	Template.inner_tome.events({
		'click .practice': function() {
			Game.route(tomeId);
		}
	});


	Template.tome_more.rendered = function() {
		// console.log('rendered', Session.get('currentPage'));
		// if( Session.get('show_tome') && Session.get('animate_tome')) {
		// 	$('#tome-view').css('top', '-100%');	
		// 	$('#tome-view').animate({'top': 0}, 500, 'linear');
		// }
			
	}

	Template.tome_more.destroyed = function() {
		
	}

	Template.buddies.friends = function() {
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

});