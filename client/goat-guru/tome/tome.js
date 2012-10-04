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


	var curPage = Session.get('currentPage');
	if (!curPage || curPage == 'empty_dojo' || view.rendered())
		view.render('empty_dojo');
	// else
	// 	//XXX Shouldnt need to do this.  Breaks first time if not here though.
	// 	view.render(curPage);


	// Session.set('animate_tome', true);

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


	Template.tome_more.rendered = function() {
		// console.log('rendered', Session.get('currentPage'));
		// if( Session.get('show_tome') && Session.get('animate_tome')) {
		// 	$('#tome-view').css('top', '-100%');	
		// 	$('#tome-view').animate({'top': 0}, 500, 'linear');
		// }
			
	}

	Template.tome_more.destroyed = function() {
		
	}

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

	Session.set('show_tome', true);

});