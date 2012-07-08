route('/deck/browse',function() {
	var containerWidth = 0;
	var deckWidth = 0;
	var decksPerRow = 0;
	var gutter = 0;
	var transformPrefix = domToCss(Modernizr.prefixed('transform'));
	
	Template.deck_browse.decks = function() {
		var decks;

		Meteor.defer(function(){
			if(decks.count()){
				containerWidth = $('#deck-grid').width();
				deckWidth = $('#deck-grid .deck').width();
				decksPerRow = Math.floor(containerWidth / deckWidth);
				gutter = ((containerWidth - decksPerRow * deckWidth) / (decksPerRow - 1));

				$('#deck-grid').height(((deckWidth + gutter) * (Math.floor(decks.count()/decksPerRow)) + deckWidth));

				var idx = 0;
				
				var deal = setInterval(function(){
					
					var el = $('.deck-container').eq(idx);
					// var bg = getAverageRGB(el.find('img').get(0));
					// var x = (deckWidth + gutter) * (idx%decksPerRow);
					// var y = (deckWidth + gutter) * (Math.floor(idx/decksPerRow));
					var rot = getTranslation(el);
					// console.log(rot);
					// el.css({'left': x, 'top': y});
					// el.css(transformPrefix, 'rotateY(0deg) scale(1)');
					el.css(transformPrefix, 'translate3d(' + rot.left + 'px,'+ rot.top +'px, 0)');
					el.css('z-index', 1);
					// el.find('.deck-meta').css({'background': bg});
					idx++;
					
					if(idx >= decks.count())
						clearInterval(deal);


				}, 150);

			}
			$('#header').click(function(){
				$('#tab').addClass('active', 400);
				$(this).slideUp(300);
			});

			$('#tab').click(function(){
				$('#header').slideDown(300);
				$(this).removeClass('active', 400);
			});
		});

	  decks = Decks.find({});
	  return decks;
	};

	Template.deck_browse.events = {
		 	'click .deck': function(e) {
		  	var el = $(e.target).closest('.deck-container');
		  	// var that = null;
		  	$('.deck-container').not(el).removeClass('view-more');
		  	el.toggleClass('view-more');
		  	// el.css(transformPrefix, ' rotateY(-180deg) scale(1.1)');

		  	// route('/deck/play/' + this.name);
	  	},
	  	'click .play': function(e) {
	  		/*
	  		e.stopPropagation();
	  		var el = $(e.target).closest('.deck-container');
	  		var that = this;
	  		el.addClass('close').css(transformPrefix, 'translate3d(0, 0 ,0)').find('.front').css(transformPrefix, 'rotateY(0)').end().find('.deck-meta').css(transformPrefix, 'rotateY(180deg)');
	  		// el.find('.font').css(transformPrefix, 'rotateY(0)');
	  		$('.deck-container').not(el).css('opacity', 0);//transformPrefix, 'translate3d(0, 0, 0)');
	  		// , function(){
  			setTimeout(function(){
  				route('/deck/play/' + that.name);
  			}, 800);
	  		// }); */
	  	},
	  	'mouseover .deck-container': function(e){
		  	// var el = $(e.target).closest('.deck');//.parent('.deck');
		  	// // console.log(el.closest('.deck').attr('class'));
		  	// // var rot = getTranslation(el);
		  	// el.css(transformPrefix, ' rotateY(-180deg) scale(1.1)');
		  	// el.css('z-index', 99);
	  	},
	  	'mouseout .deck': function(e){
	  		// var el = $(e.target).closest('.deck');
	  		// var rot = getTranslation(el);
	  		// el.css(transformPrefix, 'translate3d(' + rot.left + 'px,'+ rot.top +'px, 0)');
	  	}
	}

  	renderView('deck_browse');

	function getAverageRGB(imgEl) {

    var blockSize = 5, // only visit every 5 pixels
        defaultRGB = {r:0,g:0,b:0}, // for non-supporting envs
        canvas = document.createElement('canvas'),
        context = canvas.getContext && canvas.getContext('2d'),
        data, width, height,
        i = -4,
        length,
        rgb = {r:0,g:0,b:0},
        count = 0;

    if (!context) {
        return defaultRGB;
    }

    height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
    width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

    context.drawImage(imgEl, 0, 0);

    try {
        data = context.getImageData(0, 0, width, height);
    } catch(e) {
        /* security error, img on diff domain */
        return defaultRGB;
    }

    length = data.data.length;

    while ( (i += blockSize * 4) < length ) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i+1];
        rgb.b += data.data[i+2];
    }

    // ~~ used to floor values
    // rgb.r = ~~(rgb.r/count);
    // rgb.g = ~~(rgb.g/count);
    // rgb.b = ~~(rgb.b/count);

    var color = 'rgb(' + ~~(rgb.r/count) + ', '  + ~~(rgb.g/count) + ', ' + ~~(rgb.b/count) + ')'; 
    return color;

	}

	function getTranslation(el)
	{
		var idx = el.parent().children(el).index(el);
		// console.log(deckWidth, gutter, decksPerRow);
		var x = (deckWidth + gutter) * (idx%decksPerRow);
		var y = (deckWidth + gutter) * (Math.floor(idx/decksPerRow));

		var rot = {left: x, top: y};
		return rot;
	}
});


route('/deck/play/:name', function(ctx){
	var play_session = new _Session();
	var name = ctx.params.name;
	var game;

  Meteor.deps.await(
    function() {
      var deck = Decks.findOne({name: name});
      return  deck !== undefined;
    },
    function() {
      game = new Game(Decks.findOne({name: name}),3);
      play_session.set('card', game.nextCard());
    }
  );

  Template.deck_play.card = function(){
  	Meteor.defer(function(){
  		MathJax.Hub.Queue(["Typeset", MathJax.Hub, $('.card').get(0)]);
  	});

  	return play_session.get('card');
	}

	var events = {};
	events[util.okcancel_events('#solution')] = util.make_okcancel_handler({
   	ok: function (value,evt) {
  	  game.recordResult(game.isSolution(parseInt(value)));
   	  var next_card = game.nextCard();
   	  if (next_card) {
   	    play_session.set('card',next_card);
   	    evt.target.value = "";
   	  }
   	  else{
   	  	evt.stopPropagation();

   	  	Meteor.defer(function(){ 
   	  		renderView('deck_results');
   	  	});
   	  }
   	}
	});

	Template.deck_play.events = events;

  Template.deck_results.correct = function(){
	  return game.results.find({result: true}).count();
	}

  Template.deck_results.total = function(){ 
	  return game.results.find({}).count();
	};
	
	renderView('deck_play');
});