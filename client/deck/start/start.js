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
    		endAnimation(function() {route('/deck/' + el.attr('rel'))});	
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

		decks.each(function(i) {
			i += relPos / 300;
			var idxRel = Math.abs(i-current);
			offset.x = center - Math.sqrt(idxRel) * 220 *  (i < current ? 1 : -1);
			offset.z = idxRel * -150;
			
			$(this).css(transformPrefix, 'translate3d(' + offset.x + 'px, 0px,' + offset.z + 'px)');
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