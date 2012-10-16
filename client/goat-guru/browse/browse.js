route('/goat',function() { 

	Template.goat_browse.categories = function() {
		return Decks.homeFeeds;
	}

	Template.category.tomes = function() {
		var feed = Decks.feed(this, Meteor.user()._id);
		return feed.fetch();
	}

	Template.tome.events({
		'click': function() {
			console.log(this._id);
			route('/tome/' + this._id);
		}
	});

	dojo.render('goat_browse');

});

route('/friends',function() { 

	Template.tome.events({
		'click': function() {
			console.log(this);
			var friendName = Session.get('active').username;
			route('/tome/' + friendName + '/' + this._id);
		}
	});

	Template.friends_browse.rendered = function() {
		console.log('rendered friend browse');
	}
	Template.buddies.events({
		'click .buddy': function(e) {
			Session.set('active', this);
		},
	});

	Template.buddies.preserve({
		'.buddy[id]': function(node) {
			return node.id;
		}
	});

	Template.buddies.helpers({
		'friends': function() {
			return User.friends();
		},
	 	'active': function() {
	 		var active = Session.get('active');
	 		if(active)
	 			return this._id == active._id ? 'active' : '';
	 		else
	 			return '';
	 	},
	 	'isConnected': function() {
	 		return this.connected ? 'connected' : 'disconnected';
	 	}
	});

	Template.opponent_decks.helpers({
		'tomes': function() {
			var active = Session.get('active');
			if(active) {
				Meteor.subscribe('UserDeckInfo', active._id);

				var deckInfos = UserDeckInfo.find({user: active._id}).fetch();
				_.each(deckInfos, function(i) {
					_.extend(i, Decks.findOne(i.deck)); 
				});
				return deckInfos;
			}
		},
		'user': function() {
			var active = Session.get('active');
			return active ? active : false;
		}
	});

	dojo.render('friends_browse');
});


route('/inventory', function() {

	Template.tome.events({
		'click': function() {
			route('/tome/' + this._id);
		}
	});

	Template.my_collection.events({
		'click #create-tome': function() {
			Decks.insert({creator: Meteor.user().username, type: 'deck'}, function(err,_id) {
				if (err) throw err;
				route('/create/tome/' + _id);
			});
		},
		'click #create-scroll': function() {
			Cards.insert({creator: Meteor.user().username, type: 'card'}, function(err,_id) {
				if (err) throw err;
				route('/create/scroll' + _id);
			});
		}
	})

	Template.my_collection.helpers({
		tomes: function() {
			var deckInfos = UserDeckInfo.find({user: Meteor.user()._id}).fetch();
			
			_.each(deckInfos, function(i) {
				_.extend(i, Decks.findOne(i.deck)); 
			});

			// return deckInfos; 
			return Decks.find({})
		}
	});

	dojo.render('my_collection');
});
