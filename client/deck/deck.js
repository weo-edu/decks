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

		if(deck)
			Meteor.defer(initDecks);

	  	return deck;
  	}

  	var initDecks = _.once(function() {
  		var answered = $('#answered');
		var unanswered = $('#unanswered');

		answered.width(answered.children().width());
		unanswered.width(unanswered.parent().width() - answered.width() - 20);

		deal($('#deck-dock'), 0);
		featureCard(unanswered.children().eq(0), 0);
		
		$("#playground").slideDown(1000, function(){
				$('#playground .solution').focus();
				// $('#unanswered .card').eq(0).click();
		});
  	});




  	Template.deck_play.events = {

  		'click #unanswered .card': function(e) {
			$('.card-container').removeClass('current');
	  		var el = $(e.target).closest('.card-container').addClass('current');
	  		working_card = (el.attr('data') - 1);
	  		MathJax.Hub.Queue(["Typeset", MathJax.Hub, el.find('.question').get(0)]);
	  		// $('#play-card').html(el.find('.back').html());
	  		if($('#playground .card-container').index() != -1)
  				$('#playground .card-container').animateInsert('append', $('#unanswered'));

	  		el.animateInsert('prepend', $('#playground'), function(){
	  			$('#playground .current .solution').focus();
	  		});

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
	  		var cur_idx = $('#unanswered .card-container.current').index();

	  		if(e.which === 13)
	  		{
	  			el = $('#playground .card-container');

	  			el.animateInsert('prepend', $('#answered'));
	  			el.removeClass('correct wrong');

	  			var result = e.target.value == problems[working_card].solution;	

	  			// console.log(e.target.value, problems[working_card].solution);
	  			results.push(result);
	  			// problems.splice(working_card, 1);
	  			problems[working_card].answered = 1;

	  			if(result)
	  				el.addClass('correct');	  				
	  			else
	  				el.addClass('wrong');


	  			// deal($('#unanswered'), 0, 'fit', function(){
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
	  		else if(e.which === 37 && cur_idx != 0)
	  			$('#unanswered .card-container .card').eq(cur_idx - 1).click();
	  		else if(e.which === 39)
	  			$('#unanswered .card-container .card').eq(cur_idx + 1).click();

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
	    animateInsert: function(type, container, callback){
	    	callback = callback || function(){};
			var offset = this.offset();

			offset.left -= parseInt(matrixToArray(this.css(transformPrefix))[4], 10);
			offset.top -= parseInt(matrixToArray(this.css(transformPrefix))[5], 10);

			// console.log(matrix);


			var stage = $('<div id="stage" style="position: absolute; height: 100%; width: 100%; z-index: 9999;"></div>');

	    	$('body').prepend(stage);

	    	if(type == 'prepend')
	    		var new_el = this.clone().css('visibility', 'hidden').prependTo(container);
	    	else if(type == 'append')
	    		var new_el = this.clone().css('visibility', 'hidden').appendTo(container);

	    	// this.css(transformPrefix, matrix);
	    	this.prependTo(stage).css({'position': 'absolute', 'top': offset.top, 'left': offset.left});

	    	// console.log('origin', offset);


	    	var new_offset = new_el.offset();


	    	
	    	var new_matrix = new_el.css(transformPrefix);
	    	
	    	var that = this;
    		setTimeout(function(){
    			that.css(transformPrefix, new_matrix);
    			that.css({'top': new_offset.top, 'left': new_offset.left});
    			console.log(new_offset);
    		}, 0);

    		this.get(0).addEventListener( 
		     	transitionEndEvent, 
		     	function() { 
		    		new_el.css('visibility', 'visible');
    				stage.remove();
    				callback(); 		
	     		}, false);

	    	function matrixToArray(matrix) {
			    return matrix.substr(7, matrix.length - 8).split(', ');
			}
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