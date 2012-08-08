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

var muted = false;

$('#mute-button').live('click', function(){
	muted = muted ? false : true;
	$(this).toggleClass('muted');
});

Meteor.startup(function() {
	Meteor.defer(function() {
		
	});
});

route('/deck/start',function() {

	Meteor.defer(function() {
		// $('body').hammer({}).live("swipe", function(ev) {
  //   	    console.log(ev);
	 //   	});
	});
	

	Template.deck_start.events = {
		'render': function() {
			document.body.addEventListener('touchmove', function(e){ e.preventDefault(); });
			hammerTest();
			snapToDeck($('#deckFlow .deck').eq(1));

			floatDecks();
			setTimeout(function() {
				startAnimation();
			}, 1000);
		},
		'click .deck': function(e) {
			el = $(e.currentTarget);
			// deckFlow(el);
			// endAnimation();
		}
	}

	view.render('deck_start');

	function hammerTest() {
		var el = document.getElementById('deckFlow');
		var xStart = 0;

    	var hammer = new Hammer(el, {
        	drag_min_distance: 0,
        	drag_horizontal: true,
        	drag_vertical: true,
        	transform: false,
        	hold: false,
        	prevent_default: true
    	});

    	hammer.ondragstart = function(ev) {
    	}

    	hammer.ondrag = function(ev) {
    		$('#deckFlow .deck').css(transitionPrefix, 'all 0s ease-out');
    		snapToDeck($('.deck.current'), ev.distanceX);
    	};

    	hammer.ondragend = function(ev) {
    		$('#deckFlow .deck').css(transitionPrefix, 'all .3s ease-out');
    		snapToDeck($('.deck').eq(findCenterDeck()));

    	}

    	hammer.ontap = function(ev) {
    		var el = $(ev.originalEvent.target).closest('.deck');
    		endAnimation(function() {route(el.attr('rel'))});	
		}
	}

	function findCenterDeck() {
		var dif = -99999;
		var cur = 0;
		$("#deckFlow .deck").each(function(i) {
			var matrix = matrixToArray($(this).css(transformPrefix));
			if(parseInt(matrix[14], 10) > dif) {
				dif = matrix[14];
				cur = i;
			}
		});

		return cur;

		function matrixToArray(matrix) {
    		return matrix.substr(7, matrix.length - 8).split(', ');
		}
	}

	function snapToDeck(el, relPos) {
		var container = el.parent();
		var decks = container.children();
		var current = container.find(el).index();
		var parentWidth = container.width();
		var width = decks.width();
		var offset = [];
		var center = (parentWidth - width) / 2;
		relPos = relPos || 0;
		// relPos = ((parentWidth - width) / 2) + relPos || center;
		// var relCur = relPos == center ? current : findCenterDeck();

		decks.each(function(i) {
			i += relPos / 300;
			var idxRel = Math.abs(i-current);
			offset.x = center - Math.sqrt(idxRel) * 220 *  (i < current ? 1 : -1);
			offset.z = idxRel * -150;

			// console.log(offset.x, offset.z);
			
			$(this)
				.css(transformPrefix, 'translate3d(' + offset.x + 'px, 0px,' + offset.z + 'px)');
				// .css('z-index', -idxRel);

			container.children().removeClass('current');
			el.addClass('current');

		});
	}

	function startAnimation() {
			$('#scene .sign').delay(600).removeClass('offstage', 1300, 'easeOutBounce');
			$('#scene .mountain-back').delay(400).removeClass('offstage', 1500, 'easeOutBack');
			$('#scene .mountain-mid').delay(400).removeClass('offstage', 1400, 'easeOutBack');
			$('#scene .mountain-front').delay(400).removeClass('offstage', 1300, 'easeOutBack');
			$('#scene .temple').delay(500).removeClass('offstage', 1300, 'easeOutBack');
			$('#scene .ground, #scene .guru').removeClass('offstage', 700, 'easeOutCirc');
			$('#deckFlow').fadeIn(500, 'easeInExpo');
	}

	function floatDecks() {
		var dur = 1000;
		setInterval(function() {
			$('#deckFlow .deck').find('img, .shadow').toggleClass('float', dur, 'easeInOutSine');
		}, dur);
	}

	function endAnimation(callback) {
		callback = callback || function(){};
		$('#deckFlow').addClass('offstage');
		$('.sign, .mountain-front, .mountain-mid, .mountain-back, .temple').addClass('offstage', 600, 'easeInBack');
		$('#scene .ground, #scene .guru').addClass('offstage', 700, 'easeInExpo', function() {callback()});
		
		
	}
	
});

route('/deck/browse',function() {
	Template.deck_browse.mydecks = function(){
		return Decks.find({_id: {$in: Meteor.user().decks}});
	};

	Template.deck_browse.decks = function() {
		var decks;

		Meteor.defer(function(){
			if(decks.count()) {
				deal($('#deck-grid'), 0, 'fit');
				// playSound('shuffling-cards-3', muted);
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
		  	// playSound('tear', muted);
	  	},
	  	'click .play': function(e) {
	  		playSound('switch', muted);
	  		e.stopPropagation();
	  		var el = $(e.target).closest('.deck-container');
	  		el.addClass('close').css(transformPrefix, 'translate3d(0, 0, 0)').find('.front').css(transformPrefix, 'rotateY(0)').end().find('.back').css(transformPrefix, 'rotateY(180deg)');
	  		$('.deck-container').not(el).css('opacity', 0);

  			setTimeout(function(){
  				route($(e.target).attr('rel'));
  			}, 800);
	  	}
	}
  	view.render('deck_browse');
});


route('/deck/play/:name', function(ctx){

 	var totalCards;
	var working_card = 0;
	var problems = [];
	var results = [];
	var count = 0;

	function animateDecks(){
		var answered = $('#answered');
		var unanswered = $('#unanswered');

		answered.width(answered.children().width());
		unanswered.width(unanswered.parent().width() - answered.width() - 20);

		deal($('#deck-dock'), 0);
		playSound('shuffling-cards-5', muted);
		featureCard(unanswered.children().eq(0), 0);
		
		$("#playground").slideDown(1000, function(){
				$('#unanswered .card').eq(0).click();
				$('#playground .solution').focus();
		});

		$('.card-container .question').each(function(){
			MathJax.Hub.Queue(['Typeset', MathJax.Hub, $(this).get(0)]);
		});		
	}
	
 	Template.deck_play.deck = function() {
		var name = ctx.params.name;
		var deck = Decks.findOne({name: name});
		if(deck && deck.cards.length > 0){
			totalCards = deck.cards.length;

			for(var i = 0; i < totalCards; i++) {
				problems[i] = problemize(deck.cards[i].problem);
				deck.cards[i].question = problems[i].html;
			}

			Meteor.deferOnce(animateDecks);
		}

	  	return deck;
  	}

  	Template.deck_play.events = {
  		'click #unanswered .card': function(e) {
  			playSound('tear', muted);
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
	  				playSound('wrong', muted);
	  			}
	  			else {
	  				playSound('right', muted);
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
					view.render('deck_results');	
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
	

	view.render('deck_play');
});