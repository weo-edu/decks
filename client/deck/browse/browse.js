route('/deck/browse',function() {
	Template.decks.decks = function() {
		Meteor.defer(function() {
			// $('#deck-grid').layout();
		});
		
		return Decks.find({});
	}

	Template.decks.arrange = function(selector) {
		
	}

	Template.deck_browse.mydecks = function(){
		return Decks.find(Meteor.user().decks);
	};

	Template.deck_browse.decks = function() {
		return Decks.find({});
	};

	Template.deck_more.card = function() {
		var dialog = ui.get('.dialog');
		return dialog.get('currentCard');
	}

	Template.deck_browse.events = {
	 	'click .deck-container': function(e) {
	 		var dialog = ui.get('.dialog');
	 		dialog.set('currentCard',this);
	 		dialog.closable().overlay().center().show();
	  	},
	  	'click .play-button': function(e) {
	  		var self = this;
	  		var dialog = ui.get('.dialog');
	  		dialog.hide();

	  		var deck = Decks.findOne({ title: self.title });
	  		var game = Game.create(deck._id);
	  		$('#browse-screen').animate({left: 0}, 400, 'easeInOutExpo', function(){
	  			var url = game.url();
	  			game.destroy();
	  			console.log('game destroy');
	  			route(url);
	  		});
	  	},
	  	'click .challenge-button' : function(e) {
	  		var self = this;
	  		var dialog = ui.get('.dialog');
	  		var user = prompt('Who would you like to play with?');
	  		
	  		if(user) {
	  			var deck = Decks.findOne({ title: self.title });
  				var game = Game.create(deck._id, user);
  				if(game) {
  					dialog.hide();
  					$('#browse-screen').animate({left: 0}, 400, 'easeInOutExpo', function(){
  						var url = game.url();
  						game.destroy();
  						console.log('game destroy');
  						route(url);
  					});	
  				} else {
  					alert('User does not exist');
  				}
  				
  			}
	  	}
	}
  	view.render('deck_browse');
});