route('/deck/browse',function() {
	Template.decks.decks = function() {
		Meteor.defer(function() {
			$('#deck-grid').layout();
		});
		
		return Decks.find({});
	}

	Template.decks.arrange = function(selector) {
		
	}

	Template.deck_browse.mydecks = function(){
		return Decks.find({_id: {$in: Meteor.user().decks}});
	};

	Template.deck_browse.decks = function() {
		return Decks.find({});
	};

	Template.deck_more.card = function() {
		var dialog = ui.get('.dialog');
		return dialog.get('currentCard');
	}

	Template.deck_browse.events = {
	 	'click .deck-container': function(e,template) {
	 		var dialog = ui.get('.dialog');
	 		dialog.set('currentCard',this);
	 		dialog.closable().overlay().center().show();
	  	},
	  	'click .play-button': function(e) {
	  		var self = this;
	  		var dialog = ui.get('.dialog');
	  		dialog.hide();

	  		var user = prompt('Who would you like to play with?');
	  		var deck = Decks.findOne({ title: self.title });
	  		var game = Game.create(deck._id, user);
	  		$('#browse-screen').animate({left: 0}, 400, 'easeInOutExpo', function(){
	  			route(game.url());
	  		});
	  	}
	}
  	view.render('deck_browse');
});