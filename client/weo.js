route('/', function(ctx, next) {
  route.redirect('/deck/browse');
});

Meteor.startup(function() {
	route.start();
})

console.log('test')

function renderView(template) {
	console.log('template',template);
	console.log($('#content'))
	$("#content").html(function() {
		return Meteor.ui.render(function() {
			return Template[template]();
		});
	})
}



