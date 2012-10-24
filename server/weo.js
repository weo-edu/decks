Meteor.startup(function() {

  Meteor.publish('user', function(identifier) {
    return Meteor.users.find({$or: [{_id: identifier}, {username: identifier}]});
  });

  Meteor.publish('decks', function(id){
    return Decks.find(id || {});
	});

  Meteor.publish('cards', function(ids){
    console.log('Cards Ids',ids)
    if (_.isArray(ids))
        return Cards.find({_id: {$in: ids}});
    else
        return Cards.find(ids);
  });

  Meteor.publish('userCards', function (users, cards) {
    var query = {};
    if (_.isArray(users)) {
        users = _.without(users,1);
        query.uid = {$in: users};
    } else 
        query.uid = users;
    if(cards) query['cid'] = {$in: cards};
    return UserCard.find(query);
  });

  Meteor.publish('userDecks', function(uid, did) {
    if(_.isArray(uid)) 
        uid = _.without(uid, 1);

    if(did) 
        return UserDeck.findUserDeck(uid, did);
    else
        return UserDeck.findUser(uid);
  });

  Meteor.publish('playedDecks', function(uid) {
    var self = this;
    var cursor = UserDeck.find({user: uid});
    self._publishCursor(cursor, false);
    cursor.observe({
      added: function(userDeck) {
        self._publishCursor(Decks.find(userDeck.deck), false);
      }
    });
    self.complete();
  });

  Meteor.publish('created', function(uid) {
    this._publishCursor(Decks.find({creator: uid}), false);
    this._publishCursor(Cards.find({creator: uid}));
  });

  Meteor.publish('homeDecks', function(uid) {
    var self = this;
    self._publishCursor(Decks.popular(), false);
    self._publishCursor(Decks.featured());
  });

  Meteor.publish('gradeStats', function() {
    return Info.find({ name: 'gradeStats' });
  });

  Meteor.publish('cardSearch', function(filter) {
    return Cards.find({'search.keywords': filter}, {sort: {plays: -1}});
  });

  Observer.start();
});


