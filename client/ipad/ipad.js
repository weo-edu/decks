route('/deck/create', function() {
	Template.deck_spin.create_spin = function() {
		Meteor.defer(function(){
			mytrackball = new Traqball({
				stage: 'viewport',
				axis: [0.026380300466991417, -0.9983525904391329, -0.05095277137452092],
				angle: -7.160481569315857
			});
		return '';
		});
	}
	view.render('deck_create');
});