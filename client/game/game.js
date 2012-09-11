;(function() {

  var defaults = {
    nCards: 5
  };

  Game.route = function(deck, user) {
    var game = new Game({deck: deck, user: user});
    route(game.url());
  }

  /*
    Instantiate a new game object
  */
	function Game(id, options) {
		var self = this;

    DependsEmitter.call(self);
    self.depends('start', function() {
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

    self.on('start', function() {
      if(!self.game())
        throw new Error('Sorry the specified game does not exist');

      //  Setup the reactive game_state routeSession variable
      //  We use a routeSession variable so that we can be reactive
      //  specific to this value instead of the entire game object.
      //  
      //  XXX Put this variable on routeSession once its finished
      //  There is no need to maintain this once the current route
      //  has been destroyed.
      routeSession.set('game_state', self.game().state);

      //  The game creator manages the official state, anyone joining
      //  the game simply watches it.  This is arbitrary, it could be
      //  either of them, but we just have to choose one.
      self.mine() ? self.stateManager() : self.stateWatcher();

      //  If we don't already have a local state, then we joined a new game
      //  so we set our state to 'await join'
      self.mystate() || self.mystate('await_join') 
    });

    self.on('start', function() {
      Game.emit('start', self);
    });


    self.options = options || {};

    // insert game into db if first param is not id
    if ('object' === typeof id) {
      var user = id.user;
      var deck = id.deck;

      user = User.lookup(user || Meteor.user());

      if(user._id === Meteor.user()._id) {
        user = Guru.goat();
      }

      var game = {
        creator: Meteor.user()._id,
        deck: deck,
        users: [Meteor.user()._id, user._id],
        state: 'await_join'
      };
      game[Meteor.user()._id] = {};
      game[user._id] = {};
      self.id = Games.insert(game);
    } else {
      self.id = id;
    }
	}

  utils.inherits(Game, DependsEmitter);

  _.extend(Game, Emitter.prototype);
  Emitter.call(Game);


  Game.prototype.start = function() {
    var self = this;
    self.emit('start');
  }

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
    self.update({ $addToSet: { users: uid } }, function(err) {
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
    var p_idx = 0;
    var p = _.find(self.problems(), function(p, idx) {
      p_idx = idx;
      return (id && p._id === id) || typeof p.answer === 'undefined';
    });


    if (p) {
      if (! p.startTime) {
        console.log('update start Time');
        var update = {};
        update[self.me()._id+'.problems.'+p_idx + '.startTime'] = +new Date();
        Games.update(self.game()._id, {$set: update});
        console.log('game', self.game(), update);
      }
    } else
      self.mystate('await_results');
    return p;
  }

  /*
    Returns the number of cards being used in this game.
    Currently only looks at the defaults object.
    XXX: Add run-time config options
  */
  Game.prototype.nCards = function() {
    return this.deck(true).cardsPerGame || defaults.nCards;
  }

  Game.prototype.isCorrect = function(problem){
    return problem.answer === problem.solution;
  }

  Game.prototype.player = function(id) {
    var self = this;
    id = id || self.me()._id;
    return self.game()[id];
  }

  Game.prototype.updatePlayer = function(o, id) {
    var self = this,
      update = {$set: {}};

    id = id || self.me()._id;
    _.each(o, function(val, key) {
      update['$set'][id + '.' + key] = val;
    });

    self.update(update);
  }

  Game.prototype.update = function(update, cb) {
    Games.update(this.id, update, cb);
  }

  Game.prototype.points = function(pts) {
    var self = this;
    pts && self.updatePlayer({ points: self.player().points + pts });
    return self.player().points;
  }

  /*  
    Return the number of problems yet to be
    answered
  */
  Game.prototype.answered = function(id) {
    id = id || this.me()._id;
    var problems = this.player(id).problems,
      rest = _.filter(problems, function(p) {
        return p.hasOwnProperty('answer');
      });
    return rest && rest.length;
  }

  Game.prototype.winner = function() {
    var self = this;
    var res = self.results();

    if(Math.round(res.me.points) === Math.round(res.opponent.points))
      return null;
    else if(res.me.points > res.opponent.points)
      return self.me();
    else
      return self.opponent();
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
      var problems = self.player(id).problems,
        correct = 0,
        points = 0;

      _.each(problems, function(p, key) {
        if(self.isCorrect(p)) {
          correct++;
          points += p.points;
        }
      });

      return {
        correct: correct,
        incorrect: problems.length - correct,
        total: problems.length,
        points: points
      };
    }
  }

  Game.prototype.lastAnsweredProblem = function() {
    var self = this;
    return _.find(self.problems().reverse(), function(p, i) {
      return typeof p.answer !== 'undefined';
    });
  }

  /*
    Record an answer to a problem
  */
  Game.prototype.answer = function(answer) {
    var self = this,
      problems = self.problems(),
      pid = self.problem()._id;

    problem = _.find(problems, function(p, key) {
      if(p._id === pid) {
        p.answer = answer;
        p.time = (+new Date()) - p.startTime;
        p.points = Stats.points(Stats.regrade(p.card_id));    
        return true;
      }
    });

    self.updatePlayer({
      last_answer: new Date(),
      problems: problems
    });

    var correct = self.isCorrect(problem);
    self.emit('answer', problem, correct);
    return correct;
  }

  /*
    Returns the list of problemized cards
    or sets them for the opponent
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
      } else {
        cards = _.shuffle(cards);
      }

      self.updatePlayer({
        problems: _.map(cards, function(c) { return problemize(Cards.findOne(c)); })
      }, 
      self.opponent()._id);
      self.mystate('await_select');
    }

    return self.player().problems;
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
    var self = this;
    state && self.updatePlayer({state: state}, uid);
    return self.player(uid).state;
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
      var update = {$set: {'state': state}};
      update['$set'][self.me()._id + '.state'] = state;
      update['$set'][self.opponent()._id + '.state'] = state;
      self.update(update);
      if(!routeSession.equals('game_state', state)) {
        routeSession.set('game_state', state);
        if (state === 'results')
          self.complete();
      }
        
    }

    return routeSession.get('game_state');
	}

  Game.prototype.stateWatcher = function() {
    var self = this;
    self.stateHandle = ui.autorun(function() {
      var state = self.game().state;
      if(!routeSession.equals('game_state', state)) {
        routeSession.set('game_state', state);
      }
    });
  }


  Game.prototype.complete = function() {
    var self = this;

    var game = Games.findOne(self.id);
    game.type = 'game';
    game.title = self.deck().title + ': ' + self.me().username + ' vs ' + self.opponent().username;
    var adverb = null;
    var winner = self.winner();
    if (winner === null)
      adverb = 'andTied';
    else if (winner.username === Meteor.user().username)
      adverb = 'andWon';
    else
      adverb = 'andLost';
    event('complete', game, adverb);
    self.emit('complete');
  }

  Game.prototype.stop = function() {
    var self = this;
    self.stateHandle && self.stateHandle.stop();
    self.emit('stop');
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

    var machine = new StateMachine(transitionTable, function(new_state) {
      self.state(new_state);
    });
    self.stateHandle = ui.autorun(function() {
      machine.state([self.state(), self.mystate(), self.localState(self.opponent()._id)]);
    });
  }

	window.Game = Game;
})();
