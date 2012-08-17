route('/deck/friends', function(ctx) {

	view.render('social');

	Template.buddies.friends = function() {
		return User.friends();
	}

	Template.social.events = {
		'click .buddy': function(e) {
			var el = $(e.currentTarget)

			$('.buddy.active').removeClass('active');
			el.addClass('active');
		},
		'click .play-button': function(e) {
			
		}
	}
});