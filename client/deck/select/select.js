route('/deck/select/:name', function(ctx){

	Template.cards_select.deck = function() {
		var name = ctx.params.name;
		var deck= Decks.findOne({title: name});

		Meteor.defer(function() {
			$('#card-grid').layout();
		});	

		return deck;	
  	}

  	Template.cards_select.events = {
  		'click .play-button': function(e) {
        var el = $(e.currentTarget);
  			$('.scene').animate({left: 768}, 400, 'easeInOutExpo', function(){
  					route('/deck/play/' + el.attr('rel'));
  			});
  			
  		}
  	}

	view.render('cards_select');
});