;(function() {

  var defaults = {
    nCards: 5
  };

  Game.route = function(deck, user) {
    var game = new Game({deck: deck, user: user});
    game.invite();
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

      Bonus.setup(self);
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

      Game.emit('start', self);
    });

  
    self.on('card_select', function() {
      self.updatePlayer({card_select_begin: +new Date()});
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
    Meteor.subscribe('userCardStats', self.game().users, self.deck().cards);
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
  Game.prototype.invite = function() {
    this.message('invite:game', this.id);
    return this;
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
        var update = {};
        update[self.me()._id+'.problems.'+p_idx + '.startTime'] = +new Date();
        Games.update(self.game()._id, {$set: update});
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

  Game.prototype.bonus = function(pts, reason, problem) {
    var self = this;
    var bonuses = problem ? (problem.bonuses || {}) : (self.player().bonuses || {});
    bonuses[reason] = bonuses[reason] || 0;
    bonuses[reason] += pts;

    if(problem) {
      problem.bonuses = bonuses;
      console.log('problem bonuses', bonuses);
      self.updateProblem(problem);
    } else {
      self.updatePlayer({bonuses: bonuses});
    }
  }

  Game.prototype.points = function(uid) {
    var self = this;
    uid = uid || self.me()._id;

    var points = _.reduce(self.player(uid).problems, function(memo, problem) {
      return memo + (problem.points || 0) + _.reduce(problem.bonuses, function(memo, bonus) {
        return memo + bonus;
      }, 0);
    }, 0);

    points += _.reduce(self.player(uid).bonuses, function(memo, bonus) {
      return memo + bonus;
    }, 0);

    return points;
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
        correct = 0;

      _.each(problems, function(p, key) {
        if(self.isCorrect(p)) {
          correct++;
        }
      });

      return {
        correct: correct,
        incorrect: problems.length - correct,
        total: problems.length,
        points: self.points(id)
      };
    }
  }

  Game.prototype.lastAnsweredProblem = function() {
    var self = this;
    return _.find(self.problems().reverse(), function(p, i) {
      return typeof p.answer !== 'undefined';
    });
  }

  Game.prototype.updateProblem = function(problem) {
    var self = this,
      idx = null,
      problems = self.problems();

    _.find(problems, function(p, i) {
      if(p._id === problem._id) {
        problems[i] = problem;
        return true;
      }
    });

    self.updatePlayer({problems: problems});
  }

  /*
    Record an answer to a problem
  */
  Game.prototype.answer = function(answer) {
    var self = this,
      problem = self.problem();

    problem.answer = answer;

    if (!problem.time) problem.time = (+new Date()) - problem.startTime;
    console.log('problem time', problem.time);

    var correct = self.isCorrect(problem);
    

    problem.points = correct ? Stats.points(Stats.regrade(problem.card_id)) : 0;
    
    self.emit('answer', problem, correct);

    self.updateProblem(problem);
    self.updatePlayer({
      last_answer: new Date(),
      points: self.player().points + problem.points
    });

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

  Game.prototype.opponentCardStats = function (cardId) {
    var self = this;
    if (self.opponent().synthetic) {
      return self.player(self.opponent()._id).stats[cardId];
    } else {
      var userStats = UserCardStats.findOne({uid: self.opponent()._id, cid: cardId});
      var accuracy = 0;
      var retention = 0;
      var speed = 0;

      if (userStats && userStats.correct > 0) {
        var user_mu = userStats.correct_time / userStats.correct; // in ms
        user_mu /= 1000; // in seconds

        var cardStatistics = Stats.cardTime(cardId);

        // speed is cumulative density at point user_average_speed on the normal
        // distribution defined by the card statistics
        speed = 1 - Stats.inverseGaussCDF(user_mu,cardStatistics.mu,cardStatistics.lambda);

        var t = new Date() - userStats.last_played;
        t = t/(1000*60*60*24);
        retention = Math.exp(-t / userStats.correct);
        accuracy = userStats.correct / userStats.attempts
      }
      
      var stats = {
        accuracy: { name: 'accuracy', val:  accuracy},
        speed:  { name: 'speed', val: speed },
        points: { name: 'points', val: Math.round(Stats.points(Stats.regrade(cardId))) },
        retention: { name: 'retention', val: retention }
      };
      return stats;
    }
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

  Game.prototype.opponentState = function(state) {
    return this.localState(this.opponent()._id, state);
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
      if (self.opponentState() === 'await_results') {
        self.emit('opponentDone');
      }
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
      self.emit(new_state)
    });
    self.stateHandle = ui.autorun(function() {
      machine.state([self.state(), self.mystate(), self.opponentState()]);
    });
  }

	window.Game = Game;
})();
