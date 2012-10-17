//XXX collection names lower case or upper case?

Zebras = new Meteor.Collection('Zebras');
Herds = new Meteor.Collection('Herds');

Games = new Meteor.Collection('Games');

Info = new Meteor.Collection('Info');
UserZebra = new Meteor.Collection('UserZebra');
UserHerd = new Meteor.Collection('UserHerd');

if(Meteor.is_server) {
	UserHerdInfo.allow({
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