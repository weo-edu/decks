//	Use modernizer to get proper 
//	vendor prefixes
////////////////////////////////////////

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


//  Initialize Sounds
////////////////////////////////////////

var a = document.createElement('audio');
var ext = !!(a.canPlayType && a.canPlayType('audio/mpeg;')) ? '.mp3' : '.ogg';

var click = new Audio("/app!common/sounds/click" + ext);
var shortShuffle = new Audio("/app!common/sounds/shuffling-cards-5.wav");
var longShuffle = new Audio("/app!common/sounds/shuffling-cards-3.wav");
var wrong = new Audio("/app!common/sounds/wrong" + ext);
var right = new Audio("/app!common/sounds/right" + ext);
var playSound = new Audio("/app!common/sounds/switch" + ext);

route('/deck/browse',function() {
	
	Template.deck_browse.decks = function() {
		var decks;

		Meteor.defer(function(){
			if(decks.count()) {
				deal($('#deck-grid'), 600);
				longShuffle.play();
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
		  	click.play();
	  	},
	  	'click .play': function(e) {
	  		playSound.play();
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

 	var totalCards;
	var working_card = 0;
	var problems = [];
	var results = [];
	var count = 0;

 	Template.deck_play.deck = function() {
 		var deck;
		var name = ctx.params.name;
		
		deck = Decks.findOne({name: name});
		totalCards = deck.cards.length;

		for(var i = 0; i < totalCards; i++) {
			var curCard = deck.cards[i];
			problems[i] = problemize(deck.cards[i].problem);
			curCard.question = problems[i].html;
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
			shortShuffle.play();
			featureCard(unanswered.children().eq(0), 0);
			
			$("#playground").slideDown(1000, function(){
					$('#unanswered .card').eq(0).click();
					$('#playground .solution').focus();
			});
  		},
  		'click #unanswered .card': function(e) {
  			click.play();
	  		var el = $(e.target).closest('.card-container');
	  		working_card = (el.attr('data') - 1);
	  		MathJax.Hub.Queue(["Typeset", MathJax.Hub, el.find('.question').get(0)]);

	  		var curCard = $('#playground .card-container');

	  		if(curCard.index() != -1) {
		  		if(el.index() == el.parent().children().length - 1) 
		  			curCard.animateInsert('prepend', $('#unanswered')).removeClass('current');
	  			else {
	  				var skipCoords = returnCardTo($('#unanswered .card-container:last-child'));
	  				curCard.animateInsert('append', $('#unanswered'), function(){}, skipCoords).removeClass('current');
	  			}
			}

  			curCard.removeClass('current');
  					
	  		el.animateInsert('prepend', $('#playground'), function(newEl){
	  			newEl.addClass('current');
  				$('#playground .card-container.current .solution').focus();
	  		});
	  		$('#play-area').html(el.find('.back-content').html());
	  		el.addClass('current');
	  		
	  		featureCard($('#unanswered .card-container').eq(0));

	  		function returnCardTo(el) {
	  			var values = el.css(transformPrefix).split('(')[1].split(')')[0].split(',');
	  			var skipCoords = [];
	  			skipCoords.top = el.offset().top;
	  			skipCoords.left = el.offset().left;
	  			skipCoords.y = -Math.round(Math.asin(values[2]) * (180/Math.PI));

	  			return skipCoords;
	  		}
	  	},
	  	'mouseenter #unanswered .card-container': function(e) {
	  		var el = $(e.currentTarget);
	  		featureCard(el);
	  	},
	  	'mouseleave #unanswered': function(e) {
	  		featureCard($(e.currentTarget).find('.current'));
	  	},
	  	'keydown #playground .solution': function(e){
	  		if(e.which === 13)
	  		{
	  			el = $('#playground .card-container');
	  			el.animateInsert('prepend', $('#answered'), checkResults).removeClass('current');
	  			el.removeClass('current');

	  			var result = parseInt(e.target.value, 10) === parseInt(problems[working_card].solution, 10);	
	  			results.push(result);
	  			if(!result) {
	  				$('#bar, #bar .fill').stop(true, false).effect('highlight', {color: '#E54429'});
	  				wrong.play();
	  			}
	  			else {
	  				right.play();
	  			}
	  			problems[working_card].answered = 1;

  				$('#unanswered .card').eq(0).click();
	  			$('#playground .solution').focus();
	  			deal($('#answered'), 100, 'collapse');

  				count = updateMeta();

	  		}
	  		else if(e.which === 37)
	  			$('#unanswered .card-container:last-child .card').click();
	  		else if(e.which === 39)
	  			$('#unanswered .card-container .card').eq(0).click();

	  		$('#playground .solution').focus();	

	  		function checkResults(){
				if(results.length == totalCards) 
					renderView('deck_results');	
			}
	  	}
  	}

  	Template.deck_results.correct = function(){
	  return count;
	}

  	Template.deck_results.total = function(){ 
	  return totalCards;
	};

	function updateMeta() {
		var thisCount = 0;
		  		
		for(var i = 0; i < results.length;  i++) {
			if(results[i] == true)
				thisCount++;
		}

		if(thisCount != 0)
			$('#bar .fill').animate({'height': (thisCount / totalCards * 100)  + '%' }, 600, 'easeOutBounce');

		return thisCount;
	}
	

	renderView('deck_play');
});