route('/deck/create', function() {

	var transEndEventNames = {
    'WebkitTransition' : 'webkitTransitionEnd',
    'MozTransition'    : 'transitionend',
    'OTransition'      : 'oTransitionEnd',
    'msTransition'     : 'MSTransitionEnd',
    'transition'       : 'transitionend'
},
transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];
var transformPrefix = domToCss(Modernizr.prefixed('transform'));

	var session = new _Session();
	var deck = new _Session({
		id: Meteor.user(),
		name: 'Title',
		categories: ['Categories'],
		description: 'Description',
		primary_color: '#ccc',
		secondary_color: '#123456'
	});

var spin = 0;
	Meteor.setInterval(function(){
		var box = $('#box');
		var view = $('#viewport');
		spin += 360;
		//box.addClass('transition');
			// box.bind(transEndEventName, function(){
			// 	var newconfig_obj = {
			// 		stage: 'viewport',
			// 		axis:[1, 0, 0],
			// 		angle:-2
			// 	};
			// 	updateTraqBall(newconfig_obj);
			// })
			// var config_obj = {
			// 	stage : 'viewport',
			// 	axis:[0, 0 , 0],
			// 	angle:3.14
			// }
			//updateTraqBall(config_obj);
			view.css(transformPrefix, 'rotate3d(0,1,0,'+spin+'deg)');
		//box.animate(transformPrefix,'rotate3d(1,1,0,0.5rad)');
	}, 5000);


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
			var box = $('#box');
			box.css(transformPrefix,'rotate3d(1,0,0,-0.5rad)');
			// mytrackball = new Traqball({
			// 	stage: 'viewport',
			// 	axis: [1, 0, 0],
			// 	angle: -0.5
			// });
		return '';
		});
	}

	Template.creator.events = {
		'keyup .instant_update' : function(event){
			var el = $(event.target);
			var id = $(event.target).attr('id');
			var val = el.val();

			if (!deck.equals(id,val))
			{
				if(id == 'categories')
				{
					val = val.split(',');
					_.each(val, function(el, idx){
						val[idx] = val[idx].trim();
					});
				}
				deck.set(id, val);
			}
		},
		'click .color' : function(event){
			var up = $(event.target).attr('name');
			//$('#colorpicker').farbtastic('#'+up);
		}
	}

	Template.insert.events = {
		'click' : function(event)
		{
			var d = deck.all();
			Decks.insert(d, function(err, id){
				console.log(err);
				console.log(id);
				console.log('Inserted: ' + Decks.findOne({_id:id}));
			});
		}
	}

	Template.deck_info.deck = function(){
		var d = deck.all();
		return d;
	}

	Template.preset_buttons.events = {
		'click .quick-button' : function(event){
			var el = $(event.target)
			setView(el, event);
		}
	}
	view.render('deck_create');

});