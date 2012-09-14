var cards = [
                {
                        type: 'card',
                        title: '1\'s',
                        grade: '4',
                        image: '/decks/simple-sums/1.png',
                        problem: {
                                template: '1 + {{a}}  = ?',
                                solution: '1 + a'
                        }
                },
                {
                        type: 'card',
                        title: '2\'s',
                        grade: '4',
                        image: '/decks/simple-sums/2.png',
                        problem: {
                                template: '2 + {{a}}  = ?',
                                solution: '2 + a'
                        }
                },
                {
                        type: 'card',
                        title: '3\'s',
                        grade: '4',
                        image: '/decks/simple-sums/3.png',
                        problem: {
                                template: '3 + {{a}}  = ?',
                                solution: '3 + a'
                        }
                },
                {
                        type: 'card',
                        title: '4\'s',
                        grade: '4',
                        image: '/decks/simple-sums/4.png',
                        problem: {
                                template: '4 + {{a}}  = ?',
                                solution: '4 + a'
                        }
                },
                {
                        type: 'card',
                        title: '5\'s',
                        grade: '4',
                        image: '/decks/simple-sums/5.png',
                        problem: {
                                template: '5 + {{a}}  = ?',
                                solution: '5 + a'
                        }
                },
                {
                        type: 'card',
                        title: '6\'s',
                        grade: '4',
                        image: '/decks/simple-sums/6.png',
                        problem: {
                                template: '6 + {{a}}  = ?',
                                solution: '6 + a'
                        }
                },
                {
                        type: 'card',
                        title: '7\'s',
                        grade: '4',
                        image: '/decks/simple-sums/7.png',
                        problem: {
                                template: '7 + {{a}}  = ?',
                                solution: '7 + a'
                        }
                },
                {
                        type: 'card',
                        title: '8\'s',
                        grade: '4',
                        image: '/decks/simple-sums/8.png',
                        problem: {
                                template: '8 + {{a}}  = ?',
                                solution: '8 + a'
                        }
                },
                {
                        type: 'card',
                        title: '9\'s',
                        grade: '4',
                        image: '/decks/simple-sums/9.png',
                        problem: {
                                template: '9 + {{a}}  = ?',
                                solution: '9 + a'
                        }
                }
            ];

    var decks = [
        {
            type: 'deck',
            title: 'Simple Sums',
            image: '/decks/simple-sums/simple-sums.png',
            description: 'This is an easy addition deck',
            tags: 'addition'
        },
        {
            type: 'deck',
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
            description: 'This is an easy subtraction deck',
            tags: 'subtraction'
        },
        {
            type: 'deck',
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
            description: 'This is an easy subtraction deck',
            tags: 'subtraction'
        },
        {
            type: 'deck',
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
            description: 'This is an easy subtraction deck',
            tags: 'subtraction'
        },
        {
            type: 'deck',
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
            description: 'This is an easy subtraction deck',
            tags: 'subtraction'
        },
        {
            type: 'deck',
            title: 'Simple Sums',
            image: '/decks/simple-sums/simple-sums.png',
            description: 'This is an easy addition deck',
            tags: 'addition'
        },
        {
            type: 'deck',
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
            description: 'This is an easy subtraction deck',
            tags: 'subtraction'
        },
        {
            type: 'deck',
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
            description: 'This is an easy subtraction deck',
            tags: 'subtraction'
        },
        {
            type: 'deck',
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
            description: 'This is an easy subtraction deck',
            tags: 'subtraction'
        },
        {
            type: 'deck',
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
            description: 'This is an easy subtraction deck',
            tags: 'subtraction'
        },
        {
            type: 'deck',
            title: 'Simple Sums',
            image: '/decks/simple-sums/simple-sums.png',
            description: 'This is an easy addition deck',
            tags: 'addition'
        },
        {
            type: 'deck',
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
            description: 'This is an easy subtraction deck',
            tags: 'subtraction'
        },
        {
            type: 'deck',
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
            description: 'This is an easy subtraction deck',
            tags: 'subtraction'
        },
        {
            type: 'deck',
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
            description: 'This is an easy subtraction deck',
            tags: 'subtraction'
        },
        {
            type: 'deck',
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
            description: 'This is an easy subtraction deck',
            tags: 'subtraction'
        }
    ];



Meteor.startup(function() {
	// Decks.remove({});
 //    Cards.remove({});

 //    _.each(cards, function(card){
 //        Cards.insert(card);
 //    });

 //    _.each(decks, function(deck){
 //        deck.cards = _.pluck(Cards.find({}, {fields: ['_id']}).fetch(), '_id');
 //        Decks.insert(deck);
 //    });

  Meteor.publish('decks', function() {
    return Decks.find({});
  });

  Meteor.publish('UserCardStats', function(uid) {
      return UserCardStats.find({uid: uid});
  });

  Meteor.publish('cards',function() {
    return Cards.find({});
  })

  Meteor.publish('user', function(identifier) {
    return Meteor.users.find({$or: [{_id: identifier}, {username: identifier}]});
  });

	Meteor.publish('Decks', function(){
    return Decks.find({});
	});

  Meteor.publish('Cards', function(){
      return Cards.find({});
  });


  Meteor.publish('mydecks', function() {
    return findUserDecks(this.userId());
  });

  Meteor.publish('mydeckinfo', function() {
    return UserDeckInfo.find({user: this.userId()});
  });

  Observer.start();
});