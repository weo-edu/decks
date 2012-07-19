route('/deck/create', function() {

	var transEndEventNames = {
    'WebkitTransition' : 'webkitTransitionEnd',
    'MozTransition'    : 'transitionend',
    'OTransition'      : 'oTransitionEnd',
    'msTransition'     : 'MSTransitionEnd',
    'transition'       : 'transitionend'
},
transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];

	function setView(el, event)
	{
		var exp1 = /-view/;
		var box = $('#box');
		var view = el.attr('id');
		var config_obj = {
			stage : 'viewport'
		};
		box.addClass('transition');
		box.bind(transEndEventName,	function() {
				//alert('finished transition');
				$(this)	.removeClass('transition');
			});
		mytrackball.disable();
		view = view.replace(exp1, '');
		switch(view)
		{
			case 'front':
				config_obj.axis = [0.1,1,0];
				config_obj.angle = 0.3;
				break;
			case 'top':
				config_obj.axis = [1,0,0]
				config_obj.angle = -1.77;
			break;
			case 'back':
				config_obj.axis=[0,1,0.01];
				config_obj.angle = 2.74;
			break;
			case 'side':
				config_obj.axis = [0,1,0]
				config_obj.angle = 1.77
			break;
		}
		updateTraqBall(config_obj);
	}

	function updateTraqBall(config_obj)
	{
		mytrackball.setup(config_obj);
	}

	Template.deck_spin.create_spin = function() {
		Meteor.defer(function(){
			mytrackball = new Traqball({
				stage: 'viewport',
				axis: [0, 1, 0],
				angle: 7.160481569315857
			});
		return '';
		});
	}
	Template.preset_buttons.events = {
		'click .quick-button' : function(event){
			var el = $(event.target)
			setView(el, event);
		}
	}
	view.render('deck_create');
});