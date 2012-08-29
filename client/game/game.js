;(function() {
  Game.gamesHandle = Meteor.subscribe('games');

  var defaults = {
    nCards: 5
  };

  Game.gamesHandle = null;
	Game.create = function(deck, user) {
    user = User.lookup(user || Meteor.user());

    try {
      var game = new Game(Game._insert(deck, user));
      return game.invite(user._id);
    } catch(err) {
      console.log("User does not exist: " + err.message);
      return false;
    }
	}

  /*
    Inserts a new game record into the database
    and returns its id
  */
  Game._insert = function(deck, user, cb) {
    if(user._id === Meteor.user()._id) {
      user = Guru.goat();
    }

    return Games.insert({
      creator: Meteor.user()._id,
      deck: deck,
      users: [Meteor.user()._id, user._id],
      state: {
        game: 'await_join'
      }
    }, cb);
  }

  /*
    Instantiate a new game object
  */
	function Game(id, options) {
		var self = this;

    self.options = options || {};
		self.id = id;

    DependsEmitter.apply(self);
    self.depends('ready', function() {
      if(typeof Games !== 'undefined' && Games) {
        return self.game() && self.deck()
          && self.me() && self.opponent()
          && Cards.find(self.deck().cards).count() === self.deck().cards.length;
      } else {
        var cur = Meteor.deps.Context.current;
        Meteor.defer(function() {
          cur.invalidate();
        });
      }
    });

    self.on('ready', function() {
      if(!self.game())
        throw new Error('Sorry the specified game does not exist');

      //  Setup the reactive game_state routeSession variable
      //  We use a routeSession variable so that we can be reactive
      //  specific to this value instead of the entire game object.
      //
      //  XXX Put this variable on routeSession once its finished
      //  There is no need to maintain this once the current route
      //  has been destroyed.
      routeSession.set('game_state', self.game().state.game);

      //  The game creator manages the official state, anyone joining
      //  the game simply watches it.  This is arbitrary, it could be
      //  either of them, but we just have to choose one.
      self.mine() ? self.stateManager() : self.stateWatcher();

      //  If we don't already have a local state, then we joined a new game
      //  so we set our state to 'await join'
      self.mystate() || self.mystate('await_join') 
    });

    self.emit('ready');
	}

  utils.inherits(Game, DependsEmitter);
  _.extend(Game, DependsEmitter.prototype);
  DependsEmitter.call(Game);


  /*
    Returns the url of the game
  */
  Game.prototype.url = function() {
    return '/game/' + this.id;
  }

  /*
    Access the game object for the current game
  */
  Game.prototype.game = function(nonReactive) {
    return Games.findOne(this.id, {reactive: !nonReactive});
  }


  /*
    Send a message to your opponent
  */
  Game.prototype.message = function(/* arguments */) {
    var self = this;
    var opponent = self.opponent();
    if(opponent.synthetic === true) {
      opponent = Meteor.user();
    }

    return (self.message = function(/* arguments */) {
      var args = [opponent._id].concat(_.toArray(arguments));
      return message.apply(window, args);
    }).apply(self, arguments);
  }


  /*
    Get the deck for the current game
  */
  Game.prototype.deck = function(nonReactive) {
    return Decks.findOne(this.game(nonReactive).deck);
  }

  /*
    Invite another user to join the game
  */
  Game.prototype.invite = function(uid) {
    var self = this;
    Games.update(this.id, { $addToSet: { users: uid } }, function(err) {
      if(!err) {
        self.message('invite:game', self.id);
      } else {
        console.warn(err);
      }
    });

    return self;
  }

  /*
    Returns either the current problem or the problem with the
    specified id
  */
  Game.prototype.problem = function(id) {
    var self = this;
    var p = _.find(self.problems(), function(p) {
      return (id && p._id === id) || typeof p.answer === 'undefined';
    });

    p || self.mystate('await_results');
    return p;
  }

  /*
    Returns the number of cards being used in this game.
    Currently only looks at the defaults object.
    XXX: Add run-time config options
  */
  Game.prototype.nCards = function() {
    return defaults.nCards;
  }

  Game.prototype.isCorrect = function(id, problems){
    var self = this;
    problems = problems || self.problems();
    var problem = _.find(problems, function(val, key){
      return val._id === id;
    });

    return problem.answer === problem.solution;
  }

  /*
    Generate a small object representing the results
    of the game
  */
  Game.prototype.results = function(id) {
    var self = this;
    if(!id) {
      return {
        me: self.results(self.me()._id),
        opponent: self.results(self.opponent()._id)
      };
    } else {
      var problems = self.game()[id + '_problems'],
        correct = 0;

      _.each(problems, function(val, key) {
        if(self.isCorrect(val._id, problems)) {
          correct++;
        }
      });

      return {
        correct: correct,
        incorrect: problems.length - correct,
        total: problems.length
      };
    }
  }

  /*
    Record an answer to a problem
  */
  Game.prototype.answer = function(answer) {
    var self = this,
      problems = self.problems(),
      update = { $set: {} },
      problem = self.problem();

    _.find(problems, function(val, key) {
      if(val._id === problem._id) {
        problems[key]['answer'] = answer;
        return true;
      }
      return false;
    });

    update['$set'][self.me()._id + '_problems'] = problems;
    Games.update(self.id, update);
    return self.isCorrect(problem._id);
  }

  /*
    Returns the list of problemized cards
    or a particular index into that list
  */
  Game.prototype.problems = function(cards) {
    var self = this,
      deck = self.deck(),
      update = { $set: {} };

    if(cards) {
      if(cards === 'random') {
        cards = _.map(_.range(self.nCards()), function() {
          return deck.cards[utils.rand_int(deck.cards.length)];
        });
      }

      update['$set'][self.opponent()._id + '_problems'] = 
        _.map(cards, function(card) {
          return problemize(Cards.findOne(card));
        });

      Games.update(self.id, update);
      self.mystate('await_select');
    }

    return self.game()[self.me()._id + '_problems'];
  }

  /*
    Return your opponent's user object
  */
  Game.prototype.opponent = function() {
    var self = this;

    if(self.options.opponent) {
      self.opponent = self.options.opponent;
      return self.opponent();
    } else
      return User.lookup(_.without(self.game().users, self.me()._id)[0]) || Guru.goat();
  }

  /*
  */
  Game.prototype.me = function() {
    var self = this;

    if(self.options.me) {
      self.me = self.options.me;
      return self.me();
    } else
      return Meteor.user();
  }

  /* 
    Returns the creator of the game's user id
  */
  Game.prototype.creator = function() {
    return this.game().creator;
  }

  /*
    Returns boolean indicating whether or not the current user
    is the creator of the game
  */
  Game.prototype.mine = function() {
    return this.creator() === this.me()._id;
  }

  /*
  */
  Game.prototype.mystate = function(state) {
    return this.localState(this.me()._id, state);
  }

  /*
  */
  Game.prototype.localState = function(uid, state) {
    var self = this,
      update = {$set: { } },
      field  = 'state.' + uid,
      fields = {fields: {}};

    if(state) {
      update['$set'][field] = state;
      Games.update(self.id, update);
    }

    return Games.findOne(self.id, {fields: {state: 1}})['state'][uid];
  }

  /*
    Reactive function that returns and/or sets
    the current state of the game.  Only the creator
    of the game may change its state.  Updating the
    game state also updates each player's local state.
  */
	Game.prototype.state = function(state) {
    var self = this;
    if(state) {
      var update = {$set: {'state.game': state}};
      update['$set']['state.' + self.me()._id] = state;
      update['$set']['state.' + self.opponent()._id] = state;
      Games.update(self.id, update);
      if(!routeSession.equals('game_state', state))
        routeSession.set('game_state', state);
    }

    return routeSession.get('game_state');
	}

  Game.prototype.stateWatcher = function() {
    var self = this;
    self.stateHandle = ui.autorun(function() {
      var state = self.game().state.game;
      if(!routeSession.equals('game_state', state)) {
        routeSession.set('game_state', state);
      }
    });
  }


  Game.prototype.destroy = function() {
    var self = this;
    self.stateHandle.stop();
  }

  Game.prototype.stateManager = function() {
    var self = this;
    var transitionTable = [
      // game state   local state      local state      new state
      ['await_join',  'await_join',    'await_join',    'card_select'],
      ['card_select', 'await_select',  'await_select',  'play'],
      ['play',        'await_results', 'await_results', 'results']//,
      //['results', null, null, _.bind(self.destroy, self)]
    ];

    var machine = new StateMachine(transitionTable, _.bind(self.state, self));
    self.stateHandle = ui.autorun(function() {
      machine.state([self.state(), self.mystate(), self.localState(self.opponent()._id)]);
    });
  }

	window.Game = Game;
})();
