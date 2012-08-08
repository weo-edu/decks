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


	var freshDeck = {
		id: Meteor.user(),
		name: '',
		categories: [''],
		description: '',
		graphic:null,
		background_color: '',
		secondary_color: '',
		display_title: false,
		grade_level: ''
	};

	var deck = new Reactive.Store('deck', freshDeck);


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
		    		$('#file').attr('img', data.result.path);
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

		if(elem.hasClass('error'))
			validate();

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
			if(validate())
				switchPages(tar);
		},
		'focusOut .instant_update' :function(event){
			// validate();
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
				deck.set('display_title', false);
			else
				deck.set('display_title', true);
		},
		'click #upload' : function(event){
			event.preventDefault();
			$('#file').click();
		},
		'click #insert' : function(){
			if(validate())
			{
				Decks.insert(deck.all(), function(err, id){
					if(!err){
						alert('Succesful Insert');
						switchPages($(event.target).closest('.input-area'));
						reset(deck);
					}
				});
			}
		}
	}


	Template.deck_info.deck = function(){
		var d = deck.all();
		return d;
	}
	
	view.render('deck_create');

});