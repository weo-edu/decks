route('/deck/browse',function() {

	Template.decks.decks = function() {
		return Decks.find({status: 'published'});
	}

	Template.deck_browse.decks = function() {
		return Decks.find({});
	};

	Template.deck_more.card = function() {
		var dialog = ui.get('.dialog');
		return dialog.get('currentCard');
	}

	Template.deck_browse.categories = function() {
		return Decks.homeFeeds;
	}

	Template.category.decks = function(name) {
		var feed = Decks.feed(this, Meteor.user()._id);
		return feed.fetch();
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

	  		//XXX is title unique ?
	  		var deck = Decks.findOne({ title: self.title });
		  	$('#browse-screen').animate({left: 0}, 400, 'easeInOutExpo', function(){
	  			Game.route(deck._id);
	  		});
	  	},
	  	'click .challenge-button' : function(e) {
	  		var self = this;
	  		var dialog = ui.get('.dialog');
	  		var user = prompt('Who would you like to play with?');
	  		
	  		if(user) {
	  			var deck = Decks.findOne({ title: self.title });
  				Game.route(deck._id, user);
  			}
	  	}
	}
  	view.render('deck_browse');
});