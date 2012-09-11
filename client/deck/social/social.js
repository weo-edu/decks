route('/deck/friends', function(ctx) {

	view.render('social');

	Template.buddies.friends = function() {
		return User.friends();
	}

	Template.social.events({
		'click .buddy': function(e) {
			var el = $(e.currentTarget)

			// $('.buddy.active').removeClass('active');
			// el.addClass('active');
			Session.set('active', this);
		},
		'click .play-button': function(e) {
			// route('/deck/browse');
		}
	});

	Template.social.destroyed = function() {
		console.log('social destroyed');
		Session.set('active', null);
	}

	Template.buddies.helpers({
	 	'active': function() {
	 		var active = Session.get('active');
	 		if(active)
	 			return this._id == active._id ? 'active' : '';
	 		else
	 			return null;
	 	}
	})

	Template.social.preserve({
		'.buddy[id]': function(node) {
			return node.id;
		},
		'.avatar-tmb-small[id]': function(node) {
			return node.id;
		}
	});

	Template.active_friend.helpers({
		'active': function() {
			var active = Session.get('active');
			if(active)
				return active.avatar;
			else 
				return '/app!common/avatars/default.png';
		}
	});

	Template.opponent_decks.helpers({
		'decks': function() {
			return Decks.find({});
		}
	});

	Template.opponent_decks.events({
		'click .deck': function() {
			var dialog = ui.get('.dialog');
	 		dialog.set('currentDeck', this);
	 		dialog.closable().overlay().center().show();
		},
		'click .challenge-button': function() {
			var self = this;
  		var deck = Decks.findOne({ title: self.title });
  		Game.route(deck._id, Session.get('active')._id);
		}
	});

	Template.opponent_deck_more.deck = function() {
		var dialog = ui.get('.dialog');
		return dialog.get('currentDeck');
	}

});