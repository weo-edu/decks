route('/deck/select/:name', function(ctx){

	Template.cards_select.deck = function() {
		var name = ctx.params.name;
		var deck= Decks.findOne({title: name});

		Meteor.defer(function() {
			shelf($('.card-grid'), 5, 1, 0);
		});	

		return deck;	
  	}

  	Template.cards_select.events = {
  	}

	view.render('cards_select');
});