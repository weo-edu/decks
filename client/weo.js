//
route('/', function(ctx, next) {
<<<<<<< HEAD
  route.redirect('/deck/start');
=======

  route.redirect('/deck/browse');
>>>>>>> origin/ipad
});

Meteor.startup(function() {
	Meteor.subscribe('Decks');
	route.start();
});


function renderView(template) {
	/*if(!Template[template])
		throw new Error('Invalid template name');

	var tmpl = Template[template];
	Meteor.defer(function(){
		$('#content').html(function(){
			return Meteor.ui.render(function(){
				//	Force all templates to be wrapped in an blank div
				//	This fixes a bug(?) in Meteor's liverange code
				return '<div>' + tmpl() + '</div>';
			});
		});

		if(tmpl.events['render']){
			tmpl.events['render']();
		}
	});*/
	view.render(template);
}



