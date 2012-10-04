//XXX collection names lower case or upper case?

Decks = new Meteor.Collection('decks');
Cards = new Meteor.Collection('cards');
Games = new Meteor.Collection('games');
StatsCollection = new Meteor.Collection('stats');

UserCardStats = new Meteor.Collection('UserCardStats');
UserDeckInfo = new Meteor.Collection('UserDeckInfo');

if(Meteor.is_server) {
	UserDeckInfo.allow({
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

	UserCardStats.allow({
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