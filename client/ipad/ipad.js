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
		name: 'TITLE',
		categories: [''],
		description: 'EXAMPLE TEXT',
		graphic:null,
		background_color: '',
		secondary_color: '',
	});
	var display_title = new _Session({
		display: 'false'
	})

function darken(from, elem, amount){
	var color = from;
	var cur_color = $(elem).css('color');
	var per = 255 * (amount/100);
	var old_colors = [];
	if(color && cur_color)
	{
		cur_color = chopRGB(cur_color);
		var colors = chopRGB(color);
		old_colors = _.clone(colors);
		_.each(colors, function(el, id, key){
			if(checkBlack(old_colors))
				var new_color = 255;
			else
				var new_color = el - per;
			el =	new_color >= 0 ? new_color : 0;
			colors[id] = el;
		})
	
		var comp = compareColors(colors, old_colors);
			if(comp >= 25)
			{
				_.each(elem, function(elm, id){
					$(elm).css('color', 'rgba('+colors[0]+','+colors[1]+','+colors[2]+', 1)');
				});
			}
		// }
	}
}

function checkBlack(ele){
	var tot = 0;
	_.each(ele, function(el, id){
		tot += el;
	})
	if (tot <= 50)
		return true;
	else
		return false;
}

function compareColors(ele, comp){
	var tot = 0;
	_.each(ele, function(el, id){
		tot += Math.abs(el-comp[id]);
	})
	return tot;
}

function chopRGB(ele){
	if(ele){
		var elem = ele;
		elem = elem.split(',');
		var exp = /[a-z()]/g;
		_.each(elem, function(el, id){
			el = el.trim();
			el = el.replace(exp, '');
			el = parseInt(el);
			elem[id] = el;
		})
		return elem;
	}
}

function textColor(){
	var color = $('#box section').children('.deck-title').css('background-color');
	var h2 = $('#box section').children('h2');
	var p = $('#box section').children('p');
	darken(color, h2, 70);
}

function floatingObj(dist, time, ease){
	//textColor();
	var shadow_height = $('.drop-shadow').height();
	var shadow_width = $('.drop-shadow').width();
		var box = $('#box');
		var shadow = $('.drop-shadow');
		box.animate({top:'-'+dist}, time, ease, function(){
			$(this).animate({top:dist}, time, ease);
		});
		shadow.animate({height:'-='+dist, width:'-='+dist}, time, ease, function(){
			$(this).animate({height:'+='+dist, width:'+='+dist}, time, ease, function(){
			$(this).css({height:shadow_height, width:shadow_width});
			floatingObj(dist,time,ease);
			});
		});
}

function switchPages(tar){
	var move = $(tar).width();
	var move_in = $('.input-area').not(tar);
	$(tar).animate({left:-move}, 900, 'easeOutExpo', function(){
		$(move_in).animate({left:'0px'}, 1500, 'easeOutBounce');
		$(this).css('left', '-800px');
	})
}

function selectOptions(max){
	for(var i=2; i<=max; i++)
	{
		$('#grade_level').append('<option val='+i+'>'+i+'</option');
	}
}

	Template.deck_spin.create_spin = function() {
		Meteor.defer(function(){
			var box = $('#box');
			selectOptions(12);
			var view = $('#viewport');
			$('#file').fileupload({
		    	url: "/upload",
		    	type: "POST",
		    	dataType: 'json',
		    	multipart: true,
		    	done: function(e,data) {
		    		console.log('done');
		    		deck.set("graphic","upload/"+data.result.path);
			    }
		    });
			mytrackball = new Traqball({
				stage: 'deck-shadow',
				axis: [1, 0, 0],
				angle: 0,
				perspective: '700'
			});
			floatingObj('10px', 1500, 'easeInOutSine');
			//view.css(transformPrefix,'rotate3d(1, -.8, 0, -25deg)');
		});
		return '';
	}

	function inputData(event){
		var elem = $(event.target);
		var id = elem.attr('id');
		var val = elem.val();

		if (!deck.equals(id,val))
		{
			if(id == 'categories')
			{
				val = val.split(',');
				_.each(val, function(el, idx){
					val[idx] = el.trim();
				});
			}
			deck.set(id, val);
			if(id == 'primary_color')
				textColor(elem, id, val);
		}
	}

	Template.creator.events = {
		'keyup .instant_update' : function(event){
			inputData(event);
		},
		'mouseup select' : function(event){
			inputData(event);
		},
		'click .color' : function(event){
			var up = $(event.target).attr('name');
			//$('#colorpicker').farbtastic('#'+up);
		},
		'click #more-inputs' : function(event){
			var tar = $(event.target).closest('.input-area')
			switchPages(tar);
		}
	}

	Template.look_creator.events = {
		'keyup .instant_update' : function(event){
			inputData(event);
		},
		'click #prev-inputs' : function(event){
			var tar = $(event.target).closest('.input-area');
			switchPages(tar);
		},
		'click #display-title' : function(event){
			el = $(event.target);
			if($(el+':checked').length == 0)
				display_title.set('display', 'false');
			else
				display_title.set('display', 'true');
		},
		'click #upload' : function(event){
			event.preventDefault();
			$('#file').click();
		},
		'click #insert' : function(){
			Decks.insert(deck.all(), function(err, id){
				console.log(err);
				console.log(id);
			});
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
	Template.deck_info.display = function(){
		return display_title.equals('display', 'true') ? 'true' : '';
	}

	Template.preset_buttons.events = {
		'click .quick-button' : function(event){
			var el = $(event.target)
			setView(el, event);
		}
	}
	view.render('deck_create');

});