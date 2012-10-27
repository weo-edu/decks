route('/', function(ctx, next) {

	Template.start.rendered = function() {
		animateBg();
	}
	view.render('start');

});