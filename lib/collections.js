//XXX collection names lower case or upper case?

Decks = new Meteor.Collection('Decks');
Cards = new Meteor.Collection('Cards');
Games = new Meteor.Collection('Games');
Info = new Meteor.Collection('Info');
UserCard = new Meteor.Collection('UserCard');
UserDeck = new Meteor.Collection('UserDeck');

if(Meteor.is_server) {
	UserDeck.allow({
	    insert: function(uid, doc) {
	      return true;
	    },
	    update: function(uid, docs, fields, modifier) {
	      return true;
	    },
	    remove: function(uid, docs) {
	      return true;
	    }
	});

	Cards.allow({
		insert: function(uid, doc) {
			return true;
		},
		update: function(uid, docs, fields, modifier) {
			return true;
		},
		remove: function(uid, docs) {
			return true;
		}
	});

	Decks.allow({
		insert: function(uid, doc) {
			return true;
		},
		update: function(uid, docs, fields, modifier) {
			return true;
		},
		remove: function(uid, docs) {
			return true;
		}
	});

	UserCard.allow({
		insert: function(uid, doc) {
			return true;
		},
		update: function(uid, docs, fields, modifier) {
			return true;
		},
		remove: function(uid, docs) {
			return true;
		}
	});

	Games.allow({
		insert: function(uid, doc) {
			return true;
		},
		update: function(uid, docs, fields, modifier) {
			return true;
		},
		remove: function(uid, docs) {

		}
	})
}