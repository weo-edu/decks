//
route('/', function(ctx, next) {
  route.redirect('/deck/start');
});

Meteor.subscribe('Decks');
Meteor.subscribe('Cards');
Meteor.subscribe('UserDeckInfo', Meteor.user()._id);
Meteor.subscribe('UserDecks', Meteor.user()._id);
