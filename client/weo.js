route('/', function(ctx, next) {
  route.redirect('/deck/browse');
});

Meteor.startup(function() {
	route.start();
});

function renderView(template) {
	$("#content").html(function() {
		return Meteor.ui.render(function() {
			return Template[template]();
		});
	})
}



