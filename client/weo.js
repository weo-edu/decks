//
route('/', function(ctx, next) {
  route.redirect('/deck/start');
});

route.start();
Meteor.subscribe('Decks');
Meteor.subscribe('Cards');




