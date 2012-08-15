route('/deck/play/:name', function(ctx){

 	var totalCards;
	// var working_card = 0;
	
	var results = [];
	// var count = 0;

	// function animateDecks(){
	// 	var answered = $('#answered');
	// 	var unanswered = $('#unanswered');

	// 	answered.width(answered.children().width());
	// 	unanswered.width(unanswered.parent().width() - answered.width() - 20);

	// 	deal($('#deck-dock'), 0);
	// 	playSound('shuffling-cards-5', muted);
	// 	featureCard(unanswered.children().eq(0), 0);
		
	// 	$("#playground").slideDown(1000, function(){
	// 			$('#unanswered .card').eq(0).click();
	// 			$('#playground .solution').focus();
	// 	});

	// 	$('.card-container .question').each(function(){
	// 		MathJax.Hub.Queue(['Typeset', MathJax.Hub, $(this).get(0)]);
	// 	});		
	// }
	
 	Template.deck_play.deck = function() {
		var name = ctx.params.name;
		var deck = Decks.findOne({title: name});

		if(!deck) return;

		var game = new Reactive.Store('game');
		
		if (!game.get('problems')) {
			var problems = []
			game.set('problems',problems);
			totalCards = deck.cards.length;
			for(var i = 0; i < totalCards; i++)
				problems[i] = problemize(deck.cards[i].problem);
		}
		

		Meteor.defer(function() {
			$('#problem-container').addClass('show', 0);
			// $('#problem-container').animate({marginTop: 0}, 600, 'easeInOutExpo', function() {
			// 		$('#answer').focus();
			// });
			$('#answer').focus();
			$('#problem').html(game.get('problems')[0].html);
		});


	  	return deck;
  	}

  	Template.deck_play.events = {
  		'click': function() {
  			$('#answer').focus();
  		}
  	}

 //  	Template.deck_play.events = {
 //  		'click #unanswered .card': function(e) {
 //  			playSound('tear', muted);
	//   		var el = $(e.target).closest('.card-container');
	//   		working_card = (el.attr('data') - 1);
	//   		MathJax.Hub.Queue(["Typeset", MathJax.Hub, el.find('.question').get(0)]);

	//   		var curCard = $('#playground .card-container');

	//   		if(curCard.index() != -1) {
	// 	  		if(el.index() == el.parent().children().length - 1) 
	// 	  			curCard.animateInsert('prepend', $('#unanswered')).removeClass('current');
	//   			else {
	//   				var skipCoords = returnCardTo($('#unanswered .card-container:last-child'));
	//   				curCard.animateInsert('append', $('#unanswered'), function(){}, skipCoords).removeClass('current');
	//   			}
	// 		}

 //  			curCard.removeClass('current');
  					
	//   		el.animateInsert('prepend', $('#playground'), function(newEl){
	//   			newEl.addClass('current');
 //  				$('#playground .card-container.current .solution').focus();
	//   		});
	//   		$('#play-area').html(el.find('.back-content').html());
	//   		el.addClass('current');
	  		
	//   		featureCard($('#unanswered .card-container').eq(0));

	//   		function returnCardTo(el) {
	//   			var values = el.css(transformPrefix).split('(')[1].split(')')[0].split(',');
	//   			var skipCoords = [];
	//   			skipCoords.top = el.offset().top;
	//   			skipCoords.left = el.offset().left;
	//   			skipCoords.y = -Math.round(Math.asin(values[2]) * (180/Math.PI));

	//   			return skipCoords;
	//   		}
	//   	},
	//   	'mouseenter #unanswered .card-container': function(e) {
	//   		var el = $(e.currentTarget);
	//   		featureCard(el);
	//   	},
	//   	'mouseleave #unanswered': function(e) {
	//   		featureCard($(e.currentTarget).find('.current'));
	//   	},
	//   	'keydown #playground .solution': function(e){
	//   		if(e.which === 13)
	//   		{
	//   			el = $('#playground .card-container');
	//   			el.animateInsert('prepend', $('#answered'), checkResults).removeClass('current');
	//   			el.removeClass('current');

	//   			var result = parseInt(e.target.value, 10) === parseInt(problems[working_card].solution, 10);	
	//   			results.push(result);
	//   			if(!result) {
	//   				$('#bar, #bar .fill').stop(true, false).effect('highlight', {color: '#E54429'});
	//   				playSound('wrong', muted);
	//   			}
	//   			else {
	//   				playSound('right', muted);
	//   			}
	//   			problems[working_card].answered = 1;

 //  				$('#unanswered .card').eq(0).click();
	//   			$('#playground .solution').focus();
	//   			deal($('#answered'), 100, 'collapse');

 //  				count = updateMeta();

	//   		}
	//   		else if(e.which === 37)
	//   			$('#unanswered .card-container:last-child .card').click();
	//   		else if(e.which === 39)
	//   			$('#unanswered .card-container .card').eq(0).click();

	//   		$('#playground .solution').focus();	

	//   		function checkResults(){
	// 			if(results.length == totalCards) 
	// 				view.render('deck_results');	
	// 		}
	//   	}
 //  	}

 //  	Template.deck_results.correct = function(){
	//   return count;
	// }

 //  	Template.deck_results.total = function(){ 
	//   return totalCards;
	// };

	// function updateMeta() {
	// 	var thisCount = 0;
		  		
	// 	for(var i = 0; i < results.length;  i++) {
	// 		if(results[i] == true)
	// 			thisCount++;
	// 	}

	// 	if(thisCount != 0)
	// 		$('#bar .fill').animate({'height': (thisCount / totalCards * 100)  + '%' }, 600, 'easeOutBounce');

	// 	return thisCount;
	// }
	

	view.render('deck_play');
});