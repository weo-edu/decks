var transitionEndEvents = {
		'WebkitTransition' : 'webkitTransitionEnd',
		'MozTransition'    : 'transitionend',
		'OTransition'      : 'oTransitionEnd',
		'msTransition'     : 'MSTransitionEnd',
		'transition'       : 'transitionend'
	};
var domTransitionProperty = Modernizr.prefixed('transition');
var transformPrefix = domToCss(Modernizr.prefixed('transform'));
var transitionPrefix = domToCss(domTransitionProperty);
var transitionEndEvent = transitionEndEvents[domTransitionProperty];

route('/deck/browse',function() {
	
	Template.deck_browse.decks = function() {
		var decks;

		Meteor.defer(function(){
			if(decks.count())
				deal($('#deck-grid'), 600);
		});

	  decks = Decks.find({});
	  return decks;
	};

	Template.deck_browse.events = {

	 	'click .deck': function(e) {
	  	var el = $(e.target).closest('.deck-container');
	  	$('.deck-container').not(el).removeClass('view-more');
	  	el.toggleClass('view-more');
	  	},
	  	'click .play': function(e) {
	  		e.stopPropagation();
	  		var el = $(e.target).closest('.deck-container');
	  		el.addClass('close').css(transformPrefix, 'translate3d(0, 0, 0)').find('.front').css(transformPrefix, 'rotateY(0)').end().find('.back').css(transformPrefix, 'rotateY(180deg)');
	  		$('.deck-container').not(el).css('opacity', 0);

  			setTimeout(function(){
  				route($(e.target).attr('rel'));
  			}, 800);
	  	}

	}

  	renderView('deck_browse');

});


route('/deck/play/:name', function(ctx){

 	var total_cards;
	var working_card = 0;
	var problems = [];
	var results = [];
	var count = 0;

 	Template.deck_play.deck = function() {
 		var deck;
		var name = ctx.params.name;
		
		deck = Decks.findOne({name: name});
		total_cards = deck.cards.length;

		for(var i = 0; i < total_cards; i++) {
			var cur_card = deck.cards[i];
			problems[i] = problemize(deck.cards[i].problem);
			cur_card.question = problems[i].html;
		}

	  	return deck;
  	}




  	Template.deck_play.events = {
  		'render': function() {
  			var answered = $('#answered');
			var unanswered = $('#unanswered');

			answered.width(answered.children().width());
			unanswered.width(unanswered.parent().width() - answered.width() - 20);

			deal($('#deck-dock'), 0);
			featureCard(unanswered.children().eq(0), 0);
			
			$("#playground").slideDown(1000, function(){
					$('#playground .solution').focus();
					$('#unanswered .card').eq(0).click();
			});
  		},
  		'click #unanswered .card': function(e) {
			$('.card-container').removeClass('current');
	  		var el = $(e.target).closest('.card-container');
	  		working_card = (el.attr('data') - 1);
	  		MathJax.Hub.Queue(["Typeset", MathJax.Hub, el.find('.question').get(0)]);
	  		// $('#play-card').html(el.find('.back').html());


	  		var lastChild = $('#unanswered .card-container:last-child');
	  		var values = lastChild.css(transformPrefix).split('(')[1].split(')')[0].split(',');
	  		var skipCoords = {};
	  		skipCoords.top = lastChild.offset().top;
	  		skipCoords.left = lastChild.offset().left;
	  		skipCoords.y = -Math.round(Math.asin(values[2]) * (180/Math.PI));	  		 

	  		if($('#playground .card-container').index() != -1)
  				$('#playground .card-container').animateInsert('append', $('#unanswered'), function(){}, skipCoords);
  					
	  		el.animateInsert('prepend', $('#playground'), function(){
	  			$('#playground .current .solution').focus();
	  		}).addClass('current');
	  		
	  		el.addClass('current');

	  		featureCard($('#unanswered .card-container').eq(0));
	  	},
	  	'mouseenter #unanswered .card-container': function(e) {
	  		var el = $(e.currentTarget);
	  		featureCard(el);
	  	},
	  	'mouseleave #unanswered': function(e) {
	  		featureCard($(e.currentTarget).find('.current'));
	  	},
	  	'keydown #playground .solution': function(e){
	  		// var cur_idx = $('#unanswered .card-container.current').index();

	  		if(e.which === 13)
	  		{
	  			el = $('#playground .card-container');

	  			el.animateInsert('prepend', $('#answered'));
	  			// el.removeClass('correct wrong');

	  			var result = e.target.value == problems[working_card].solution;	
	  			results.push(result);
	  			problems[working_card].answered = 1;

	  			// if(result)
	  			// 	el.addClass('correct');	  				
	  			// else
	  			// 	el.addClass('wrong');

  				$('#unanswered .card').eq(0).click();
	  			$('#playground .solution').focus();
	  			deal($('#answered'), 100, 'collapse');

		  		if(results.length == total_cards) {
		  				for(var i = 0; i < results.length;  i++) {
		  					if(results[i] == true)
		  						count++;

		  				}
	  					renderView('deck_results');	
						
		  		}
	  			
	  		}
	  		else if(e.which === 37)
	  			$('#unanswered .card-container:last-child .card').click();
	  		else if(e.which === 39)
	  			$('#unanswered .card-container .card').eq(0).click();

	  		$('#playground .solution').focus();	
	  	}
  	}

  	Template.deck_results.correct = function(){
	  return count;
	}

  	Template.deck_results.total = function(){ 
	  return total_cards;
	};
	
	renderView('deck_play');

	$.fn.extend({
	    animateInsert: function(type, container, callback, endCoords){
	    	callback = callback || function(){};
			var offset = this.offset();

			var stage = $('<div class="stage" style="position: absolute; height: 100%; width: 100%; z-index: 9999;"></div>');

	    	$('body').prepend(stage);

	    	var new_el = this.clone().css(transformPrefix, 'translate3d(0,0,0)').css('visibility', 'hidden');
	    	(container)[type](new_el);

	    	this.css({'position': 'absolute'}).css(transformPrefix, 'translate3d(' + offset.left + 'px, ' + offset.top + 'px, 0)').prependTo(stage);

	    	var new_offset = new_el.offset();	    	
	    	
	    	var that = this;
    		setTimeout(function(){    			
    			if(endCoords)
    				new_offset = endCoords;

    			var rotateY = new_offset.y ? new_offset.y : 0;

    			console.log(rotateY);

				that.css(transformPrefix, 'translate3d(' + new_offset.left + 'px, ' + new_offset.top + 'px, 0) rotateY('+ rotateY + 'deg)');
    		}, 0);

    		this.get(0).addEventListener( 
		     	transitionEndEvent, 
		     	function() { 
		    		new_el.css('visibility', 'visible');
    				stage.remove();
    				callback(); 		
	     		}, false);

    		return new_el;
	    }
	});
});







//Josh's Game
  	// Template.deck_play.cards = function() {
	// 	var cards;
	// 	var play_session = new _Session();
	// 	var name = ctx.params.name;

	// 	cards = Decks.findOne({name: name}).cards;
	// 	console.log('cards:', cards);
	//   	return cards;
 	//  	}
	
	// var game;

	 //  Meteor.deps.await(
	 //    function() {
	 //      var deck = Decks.findOne({name: name});
	 //      return  deck !== undefined;
	 //    },
	 //    function() {
	 //      game = new Game(Decks.findOne({name: name}), 3);
	 //      // play_session.set('card', game.nextCard());
	 //      play_session.set('card', game.getCards());
	 //    }
	 //  );

	 //  Template.deck_play.card = function(){
	 //  	Meteor.defer(function(){
	 //  		MathJax.Hub.Queue(["Typeset", MathJax.Hub, $('.card').get(0)]);
	 //  	});

	 //  	return play_session.get('card');
		// }

		// var events = {};
		// events[util.okcancel_events('#solution')] = util.make_okcancel_handler({
	 //   	ok: function (value,evt) {
	 //  	  game.recordResult(game.isSolution(parseInt(value)));
	 //   	  var next_card = game.nextCard();
	 //   	  if (next_card) {
	 //   	    play_session.set('card',next_card);
	 //   	    evt.target.value = "";
	 //   	  }
	 //   	  else{
	 //   	  	evt.stopPropagation();

	 //   	  	Meteor.defer(function(){ 
	 //   	  		renderView('deck_results');
	 //   	  	});
	 //   	  }
	 //   	}
		// });

		// Template.deck_play.events = events;