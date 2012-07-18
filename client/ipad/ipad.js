route('/deck/create', function() {
	Template.deck_spin.create_spin = function() {
		Meteor.defer(function(){
			mytrackball = new Traqball({
				stage: 'viewport'
			});
		return '';
		});
	}
	view.render('deck_create');
});