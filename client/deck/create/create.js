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
		$('#gradePrior').append('<option val='+i+'>'+i+'</option');
	}
}

Template.deck_spin.create_spin = function() {
	Meteor.defer(function(){
		var box = $('#box');
		selectOptions(12);
		var view = $('#viewport');
		$('#deck_load').fileupload({
	    	url: "/upload",
	    	type: "POST",
	    	dataType: 'json',
	    	multipart: true,
	    	done: function(e,data) {
	    		$('#file').attr('img', data.result.path);
	    		console.log('done');
	    		ui.get('deck_image').value("upload/"+data.result.path)
	    		//render.set('image',"upload/"+data.result.path);
	    		//deck.set('render', render.all());		    
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


Template.deck_create.events = {
	'click .button' : function(event){
		var tar = $(event.target).closest('.input-area')
		if(validate())
			switchPages(tar);
	}
}

Template.look_creator.events = {
	'click #prev-inputs' : function(event){
		var tar = $(event.target).closest('.input-area');
		switchPages(tar);
	},
	'click #displayTitle' : function(event){
		el = $(event.target);
		if($(el+':checked').length == 0)
			render.set('displayTitle', false);
		else
			render.set('displayTitle', true);
		deck.set('render', render.all());
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
					to_reset = [deck, render, colorscheme];
					reset(to_reset);
				}
			});
		}
	}
}

Template.deck_render.render = function() {
	return ui.get('render_input_info').getFields()
}

view.render('deck_create');

});

