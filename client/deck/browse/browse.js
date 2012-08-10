route('/deck/browse',function() {
	Template.decks.decks = function() {
		
			shelf($('#deck-grid'));
		
		return Decks.find({});
	}

	Template.decks.arrange = function(selector) {
		
	}

	Template.deck_browse.mydecks = function(){
		return Decks.find({_id: {$in: Meteor.user().decks}});
	};

	Template.deck_browse.decks = function() {
		var decks;
		// Meteor.defer(function(){
		// 	if(decks.count()) {
		// 		// deal($('#deck-grid'), 0, 'fit');
		// 		// playSound('shuffling-cards-3', muted);
		// 	}
		// });

	  decks = Decks.find({});
	  return decks;
	};

	Template.deck_browse.events = {
		'render': function() {
			shelf($('#deck-grid'));
		},
	 	'click .deck-container': function(e) {
	 		console.log(this);
	 		var dialog = ui.get('deck_more');
	 		dialog.context(this);
	 		dialog.closable().overlay().show().center();
	  	},
	  	'click .play-button': function(e) {
	  		var self = this;
	  		var dialog = ui.get('deck_more');
	  		dialog.hide();
	  		$('#browse-screen').animate({left: 0}, 400, 'easeOutBack', function(){
				route('/deck/select/' + self.title);
	  		});
	  	}
	}
  	view.render('deck_browse');
});