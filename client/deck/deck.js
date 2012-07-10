var containerWidth = 0;
var deckWidth = 0;
var decksPerRow = 0;
var gutter = 0;
var transformPrefix = domToCss(Modernizr.prefixed('transform'));

route('/deck/browse',function() {
	
	Template.deck_browse.decks = function() {
		var decks;

		Meteor.defer(function(){
			if(decks.count()){
				containerWidth = $('#deck-grid').width();
				deckWidth = $('#deck-grid .deck').width();
				decksPerRow = Math.floor(containerWidth / deckWidth);
				gutter = ((containerWidth - decksPerRow * deckWidth) / (decksPerRow - 1));

				$('#deck-grid').height((deckWidth + gutter) * (Math.ceil(decks.count()/decksPerRow)));

				deal($('#deck-grid'), 600);

			}

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
	  		e.preventDefault();
	  		e.stopPropagation();
	  		var el = $(e.target).closest('.deck-container');
	  		var that = this;
	  		el.addClass('close').css(transformPrefix, 'translate3d(0, 0, 0)').find('.front').css(transformPrefix, 'rotateY(0)').end().find('.back').css(transformPrefix, 'rotateY(180deg)');
	  		$('.deck-container').not(el).css('opacity', 0);
  			setTimeout(function(){
  				console.log($(e.target).attr('href'));
  				route($(e.target).attr('href'));
  			}, 800);
	  	}
	}

  	renderView('deck_browse');

});


route('/deck/play/:name', function(ctx){

	// Template.deck_play.cards = function() {
	// 	var cards;
	// 	var play_session = new _Session();
	// 	var name = ctx.params.name;

	// 	cards = Decks.findOne({name: name}).cards;
	// 	console.log('cards:', cards);
	//   	return cards;
 //  	}
 	var total_cards;
	var num_cards;
	var working_card = 0;
	var problems = [];
	var results = [];
	var count = 0;

 	Template.deck_play.deck = function() {
 		var deck;
 		
		var play_session = new _Session();
		var name = ctx.params.name;
		

		deck = Decks.findOne({name: name});
		total_cards = deck.cards.length;

		for(var i = 0; i < total_cards; i++) {
			var cur_card = deck.cards[i];
			problems[i] = problemize(deck.cards[i].problem);
			cur_card.question = problems[i].html;
		}

		console.log(problems);
		// console.log('length:', deck.cards.length);
		// console.log(problemize(deck.cards[0].problem).html);
		// console.log('deck:', deck);

		Meteor.defer(function(){
			deal($('#deck-dock'), 0);
			deal($('#unanswered'), 100);
			$("#playground").slideDown(1000);
		});


	  	return deck;

  	}


  	Template.deck_play.events = {
  		'click .card': function(e) {
  			if($(e.target).attr('class') != 'solution' )
  			{
  				$('.card-container').removeClass('current');
		  		var el = $(e.target).closest('.card-container').addClass('current');
		  		working_card = el.parent().children(el).index(el);
		  		MathJax.Hub.Queue(["Typeset", MathJax.Hub, el.find('.question').get(0)]);
		  		$('#playground').html(el.find('.back').html());
		  		// el.toggleClass('view-more');//.css(transformPrefix, 'translate3d(0, ' + (-($(window).height() - el.height() - 40)) + 'px, 0)');
		  	}
	  	},
	  	'click .deck-container': function(e){
	  	// 	var el = $(e.currentTarget).parent();

	  	// 	if(el.hasClass('collapsed'))
	  	// 		deal(el.removeClass('collapsed'), 0);
	  	// 	else
				// deal(el.addClass('collapsed'), 0, 'collapse');
	  	},
	  	'mouseleave #deck-dock': function(e){
	  		// deal($(e.target), 0, 'collapse');
	  	},
	  	'keypress .solution': function(e){
	  		if(e.which === 13)
	  		{
	  			el = $('#unanswered .card-container').eq(working_card);
	  			$('#answered').prepend(el);
	  			el.removeClass('correct wrong');
	  			var result = e.target.value == problems[working_card].solution;

	  			results.push(result);
	  			problems.splice(working_card, 1);

	  			if(result)
	  				el.addClass('correct');	  				
	  			else
	  				el.addClass('wrong');


	  			deal($('#unanswered'), 0);
	  			deal($('#answered'), 0, 'collapse');

	  			$('#unanswered .card').eq(0).click();
	  			$('#playground .solution').focus();

	  			if(problems.length <= 0) {
	  				for(var i = 0; i < results.length;  i++) {
	  					if(results[i] == true)
	  						count++;

	  				}

  					renderView('deck_results');
	  			}
	  		}	
	  	}
  	}

	
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

  	Template.deck_results.correct = function(){
	  return count;
	}

  	Template.deck_results.total = function(){ 
	  return total_cards;
	};
	
	renderView('deck_play');
});

function getTranslation(el, type) {


	type = typeof type !== 'undefined' ? type : 'grid';

	var idx = el.parent().children(el).index(el);

	switch(type)
	{
		case 'grid':
		{	
			var cur_x = (deckWidth + gutter) * (idx%decksPerRow);
			var cur_y = (deckWidth + gutter) * (Math.floor(idx/decksPerRow));

			var rot = {x: cur_x, y: cur_y, z: 0};
			break;
		}
		case 'collapse':
		{
			var rot = {x: (4 * idx), y: 0, z: (20 * idx)};
			break;
		}
	}

	
	return rot;
}

function deal(container, dur, type) {

	var idx = 0;
	var num_cards = container.children().length;
				
	var dealInterval = setInterval(function(){
		
		var el = container.children().eq(idx);
		var rot = getTranslation(el, type);
		el.css(transformPrefix, 'translate3d(' + rot.x + 'px,'+ rot.y +'px,' + rot.z +'px)');
		el.css('z-index', 1);
		idx++;
		
		if(idx > num_cards)
			clearInterval(dealInterval);

	}, (dur / num_cards));
}