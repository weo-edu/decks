//
route('/', function(ctx, next) {
  route.redirect('/deck/start');
});

Meteor.subscribe('Decks');
Meteor.subscribe('Cards');
Meteor.subscribe('mydeckinfo');



