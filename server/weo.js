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

  Observer.start();
});


