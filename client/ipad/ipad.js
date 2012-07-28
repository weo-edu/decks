route('/deck/create', function() {

	var transEndEventNames = {
    'WebkitTransition' : 'webkitTransitionEnd',
    'MozTransition'    : 'transitionend',
    'OTransition'      : 'oTransitionEnd',
    'msTransition'     : 'MSTransitionEnd',
    'transition'       : 'transitionend'
};

var transEndEventName = transEndEventNames[Modernizr.prefixed('transition')];
var domTransitionProperty = Modernizr.prefixed('transition');
var transformPrefix = domToCss(Modernizr.prefixed('transform'));
var transitionPrefix = domToCss(domTransitionProperty);

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
var a = Meteor.setInterval(function(){
		
	}, 1000);


	// function setView(el, event)
	// {
	// 	var exp1 = /-view/;
	// 	var box = $('#box');
	// 	var view = el.attr('id');
	// 	var config_obj = {
	// 		stage : 'viewport'
	// 	};
	// 	box.addClass('transition');
	// 	box.bind(transEndEventName,	function() {
	// 			//alert('finished transition');
	// 			$(this)	.removeClass('transition');
	// 		});
	// 	mytrackball.disable();
	// 	view = view.replace(exp1, '');
	// 	switch(view)
	// 	{
	// 		case 'front':
	// 			config_obj.axis = [0.1,1,0];
	// 			config_obj.angle = 0.3;
	// 			break;
	// 		case 'top':
	// 			config_obj.axis = [1,0,0]
	// 			config_obj.angle = -1.77;
	// 		break;
	// 		case 'back':
	// 			config_obj.axis=[0,1,0.01];
	// 			config_obj.angle = 2.74;
	// 		break;
	// 		case 'side':
	// 			config_obj.axis = [0,1,0]
	// 			config_obj.angle = 1.77
	// 		break;
	// 	}
	// 	updateTraqBall(config_obj);
	// }

	function updateTraqBall(config_obj)
	{
		mytrackball.setup(config_obj);
	}


function floatingDeck(dist, time, ease){
	Meteor.setInterval(function(){
		var box = $('#box');
		var shadow = $('.drop-shadow');
		box.animate({top:'-'+dist}, time, ease, function(){
			$(this).animate({top:dist}, time, ease);
		});
		shadow.animate({height:'-='+dist, width:'-='+dist}, time, ease, function(){
			$(this).animate({height:'+='+dist, width:'+='+dist}, time, ease);
		});
	},time*2)
}

// Meteor.setInterval(function(){
// 	var box = $('#box');
// 	var shadow = $('.drop-shadow');
// 	var top = box.css('top');
// 	var newtop = top-10;
// 	box.css('top', '-6px');
// 	box.bind(transEndEventName, function(){
// 		var box = $('#box');
// 		box.css('top', '6px');
// 	})
// },1600)

	Template.deck_spin.create_spin = function() {
		Meteor.defer(function(){
			var box = $('#box');
			floatingDeck('13px', 1200, 'easeInOutSine');
			box.css(transformPrefix,'rotate3d(1,0,0,-20deg)');
			// mytrackball = new Traqball({
			// 	stage: 'viewport',
			// 	axis: [1, 0, 0],
			// 	angle: -0.5,
			// 	perspective: 'none'
			// });
		});
		return '';
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

	Template.deck_spin.events = {
		'mousedown #viewport' : function(event)
		{
			var el = $(event.target);
			var tar = el.closest('#viewport');
			var status = tar.css('-webkit-animation-play-state');
			//status == 'running' ? tar.css('-webkit-animation-play-state', 'paused') : tar.css('-webkit-animation-play-state', 'running');
		},
		'click .spin-button' : function(event)
		{
			var tar = $('#viewport');
			var shad = $('.drop-shadow');
			var anim = 'infinite-spinning 1600s linear';
			var state = '-webkit-animation-play-state';
			var status = tar.css(state);
			status == 'running' ? tar.css(state, 'paused') : tar.css(state, 'running');
			tar.css('-webkit-animation', anim);
			//shad.css('-webkit-animation', anim);
			console.log(status);
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