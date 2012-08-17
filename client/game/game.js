;(function(){
  var defaults = {
    nCards: 5
  };

  Game.gamesHandle = null;
	Game.create = function(deck, user){
    user = User.lookup(user || Meteor.user());

    Game.gamesHandle = Game.gamesHandle || Meteor.subscribe('games');
		var game = new Game(Game._insert(deck, user._id));
    return game.invite(user._id);
	}

  /*
    Inserts a new game record into the database
    and returns its id
  */
  Game._insert = function(deck, cb){
    return Games.insert({
      creator: Meteor.user()._id,
      deck: deck,
      users: [Meteor.user()._id],
      state: 'await_join'
    }, cb);
  }

	Game.message = function(/* arguments */){
		message.apply(window, arguments);
	}

	function Game(id){
		var self = this;
		self.id = id;
		if(!self.game)
			throw new Error('Sorry the specified game does not exist');

    Games.find(self.id).observe({
      added: function(doc, before_index){
        Session.set('game_state', doc.state);
      },
      changed: function(new_doc, at_idx, old_doc){
        new_doc.state === old_doc.state || Session.set('game_state', new_doc.state);
      }
    });

    //  If this is a game that we're joining, move ahead to the
    //  card select phase
    (!self.mine() && self.state() === 'await_join') && self.state('card_select');
	}
	utils.inherits(Game, Emitter);

	Game.prototype.__defineGetter__('game', function(){
		return Games.findOne(this.id);
	});

  Game.prototype.message = function(/* arguments */){
    var self = this;
    var opponent = self.opponent();
    if(opponent.synthetic === true){
      opponent = Meteor.user();
    }

    return (self.message = function(/* arguments */){
      var args = [opponent._id].concat(_.toArray(arguments));
      return Game.message.apply(Game, args);
    }).apply(self, arguments);
  }


  Game.prototype.deck = function(){
    return Decks.findOne(this.game.deck);
  }

  /*
    Invite another user to join the game
  */
  Game.prototype.invite = function(uid){
    var self = this;
    Games.update(this.id, {$addToSet: {users: uid}}, function(err){
      if(!err){
        self.message('invite:game', self.id);
      } else{
        console.warn(err);
      }
    });

    return self;
  }

  /*
    Returns the number of cards being used in this game.
    Currently only looks at the defaults object.
    XXX: Add run-time config options
  */
  Game.prototype.nCards = function(){
    return defaults.nCards;
  }

  /*
    Retrieve a specific card by index
    This function returns a full card record
    as opposed to simply an id
  */
  Game.prototype.card = function(i){
    return Cards.findOne(this.cards()[i]);
  }


  Game.prototype.problems = function(){
    var self = this,
      problems = [];

    if(self.cards()){
      _.each(self.cards(), function(id){
        var card = Cards.findOne(id);
        card.problemized = problemize(card.problem);
        problems.push(card);
      });

      return (self.problems = function(){
        return problems;
      })();
    }
  }

  /*
    Returns the list of cards for the current player
    and, if an argument is passed, sets the cards
    for the opponent
  */
  Game.prototype.cards = function(cards){
    var self = this;
    if(cards){
      if(cards === 'random'){
        cards = [];
        var list = self.deck().cards;
        for(var i = 0; i < self.nCards(); i++){
          cards.push(list[utils.rand_int(0, list.length)]);
        }
      }

      var update = {$set: {}};
      update['$set'][self.opponent()._id + '_cards'] = cards;
      Games.update(self.id, update);
      Meteor.deps.await_once(
        function(){ 
          return self.cards() && self.game[self.opponent()._id + '_cards']
        },
        function(){
          self.state('play');
        }
      );
    }

    return self.game[self.me() + '_cards'];
  }

  Game.prototype.opponent = function(){
    return User.lookup(
      _.find(this.game.users, function(uid){
        return uid !== Meteor.user()._id; 
      }) || Guru.goat());
  }

  /*
    Returns the user id of the current user.  This is necessary
    in order to support single-player modes.  In multiplayer this
    will always be Meteor.user()._id, but in single-player it can
    also be the computer player.
  */
  Game.prototype.me = function(){
    var self = this;
    return _.find(self.game.users, function(uid){ return uid !== self.opponent()._id; });
  }
  /*
    Returns boolean indicating whether or not the current user
    is the creator of the game
  */
  Game.prototype.mine = function(){
    return this.game.creator === Meteor.user()._id;
  }

  /*
    Reactive function that returns and/or sets
    the current state of the game
  */
	Game.prototype.state = function(state){
    state && Games.update(this.id, {$set: {state: state}});
    return Session.get('game_state');
	}

	window.Game = Game;
})();