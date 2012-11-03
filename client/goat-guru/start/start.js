route('/', function(ctx, next) {

	Template.start.rendered = function() {
		var sun = document.getElementById('sun'),
			deg = 0;
		
		Meteor.defer(function(){
			sun.addEventListener(transitionEndEvent, rotateSun);	
			rotateSun();	
		})

		function rotateSun() {
			deg +=360;
			$(sun).css(transitionPrefix, 'all 200s linear');
			$(sun).css(transformPrefix, 'rotate(' + deg + 'deg)');
		}	
	}

	view.render('start');
});