
route('/', function(ctx, next) {
  route.redirect('/deck/browse');
});

Meteor.startup(function() {
	route.start('decks');
});


function renderView(template) {
	$('#content').html(function(){
		return Meteor.ui.render(function(){
			//	Force all templates to be wrapped in an blank div
			//	This fixes a bug(?) in Meteor's liverange code
			return '<div>' + Template[template]() + '</div>';
		});
	});
}



