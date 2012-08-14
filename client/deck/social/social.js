route('/deck/friends', function(ctx) {

	view.render('social');

	Template.social.events = {
		'click .buddy': function(e) {
			var el = $(e.currentTarget)

			$('.buddy.active').removeClass('active');
			el.addClass('active');
		}
	}
});