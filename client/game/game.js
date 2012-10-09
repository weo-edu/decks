;(function() {

  var defaults = {
    nCards: 5,
    cardSelectTime: 30,
    playPastTime: 1000,
    heartbeat_timeout: 2,
    speedBonusCutoff: .5
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
    Emitter.call(self);

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
      };
      game[Meteor.user()._id] = {state: 'limbo'};
      game[user._id] = {state: 'limbo'};
      self.id = Games.insert(game);
    } else {
      self.id = id;
    }

    //XXX should unsubscribe at some point
    Meteor.subscribe('userCardStats', self.game().users, self.deck().cards);

    self.me_id = self.me()._id;
    self.opponent_id = self.opponent()._id;


    /////////////////////
    // Event Listeners //
    /////////////////////

    self.on('play', function(changed) {
      if (changed) {
        self.sortProblems();
        self.nextProblem();
      }

    });

    self.on('results', function(changed) {
      if (self.me().synthetic || !changed)
        return;
      self.complete();
    });

    // setup bonusus
    Bonus.setup(self);
    // update points after bonuses
    self.on('answer', self.updatePoints.bind(self));


    //////////////////////////////
    // Time Limits and Timeouts //
    //////////////////////////////

    self.timeouts = {};
  
    self.on('select', function(change) {
      if (self.me().synthetic) 
        return;

      if (change)
        self.updatePlayer({card_select_begin: +new Date()});
      
      self.timeouts.select = Meteor.setTimeout(function() {
        self.randomSelect();
        Meteor.setTimeout(function() {
          self.pickSelectedCards();
        }, 1000);
      }, Math.max(self.timeToSelect(), 0));
    });

    self.on('play.', function(change) {
      if (self.me().synthetic) 
        return;

      if (change)
        self.updatePlayer({play_end: +new Date()});

      self.timeouts.play = Meteor.setTimeout(function() {
        if (self.state() === 'play.')
          self.dispatch('finished');
      }, self.timeToPlay());
    });

    self.on('play.waiting', function(change) {
      if (self.me().synthetic)
        return;

      if (change) {
        self.updatePlayer({play_end: +new Date()});
        console.log('play_end');
      }


      self.timeouts.heartbeat = Meteor.setTimeout(function() {
        if (self.state() === 'play.waiting')
          self.heartbeat();
      }, self.timeToPlay());
    });

    self.on('select.waiting', function() {
      if (self.me().synthetic)
        return;
      self.timeouts.heartbeat = Meteor.setTimeout(function() {
        console.log('heartbeat timeout');
        if (self.state() === 'select.waiting')
          self.heartbeat();
      }, self.timeToSelect(), 0);
    });

	}

  utils.inherits(Game, Emitter);

  _.extend(Game, Emitter.prototype);
  Emitter.call(Game);

  Game.prototype.start = function() {
    var self = this;
    if(!self.game())
        throw new Error('Sorry the specified game does not exist');

    console.log(self.me_id, 'start');



    if (self.state() === 'limbo')
      self.dispatch('joined');
    
    self.stateManager();
    self.monitor();

    /*if (self.pending())
      self.emit('pending', self.pending());*/

    Game.emit('start', self);
  }


  /////////////
  // Getters //
  /////////////

  /*
    Access the game object for the current game
  */
  Game.prototype.game = function(nonReactive) {
    return Games.findOne(this.id, {reactive: !nonReactive});
  }

  Game.prototype.get = function(field, notReactive) {
    var self = this;
    if ('number' === typeof field)
      field = '' + field;
    var game = Games.findOne(self.id, {fields: [field], reactive: !notReactive});
    return LocalCollection._getField(game,field);
  }

   /*
    Get the deck for the current game
  */
  Game.prototype.deck = function(notReactive) {
    return Decks.findOne(this.get('deck', notReactive));
  }

  Game.prototype.player = function(id) {
    var self = this;
    id = id || self.me()._id;
    return self.get(''+ id);
  }

  /* 
    Returns the creator of the game's user id
  */
  Game.prototype.creator = function() {
    return this.get('creator');
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
      return User.lookup(_.without(self.get('users', true), self.me()._id)[0]) || Guru.goat();
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


  ////////////
  // Invite //
  ////////////

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
    Invite another user to join the game
  */
  Game.prototype.invite = function() {
    this.message('invite:game', this.id);
    return this;
  }


  /////////////
  // Helpers //
  /////////////


  Game.prototype.opponentIsGoat = function() {
    return this.opponent_id === Guru.goat()._id;
  }

  /*
    Returns boolean indicating whether or not the current user
    is the creator of the game
  */
  Game.prototype.mine = function() {
    return this.creator() === this.me()._id;
  }

  /*
    Returns the number of cards being used in this game.
    Currently only looks at the defaults object.
    XXX: Add run-time config options
  */
  Game.prototype.nCards = function() {
    if (!this.ncards)
      this.ncards = parseInt(this.deck(true).cardsPerGame || defaults.nCards, 10)
    return this.ncards;
  }

  Game.prototype.isCorrect = function(problem){
    return problem.answer === problem.solution;
  }

  Game.prototype.isIncorrect = function(problem) {
    return problem.answer !== undefined && problem.answer !== problem.solution;
  }

  /*
    Returns the url of the game
  */
  Game.prototype.url = function() {
    return '/game/' + this.id;
  }

  Game.prototype.opponentCardStats = function (cardId) {
    var self = this;
    if (self.opponentIsGoat()) {
      return self.get(self.opponent_id,true).stats[cardId];
      //return self.player(self.opponent_id).stats[cardId];
    } else {
      var stat = Stats.userCard(self.opponent_id, cardId);
      var stats = {
        accuracy: { name: 'accuracy', val:  stat.accuracy},
        speed:  { name: 'speed', val: stat.speed },
        points: { name: 'points', val: Math.round(Stats.points(Stats.regrade(cardId))) },
        retention: { name: 'retention', val: stat.retention }
      };
      return stats;
    }
  }

  Game.prototype.myCardStats = function (cardId) {
    var stat = Stats.userCard(Meteor.user()._id, cardId);
    var stats = {
      accuracy: { name: 'accuracy', val:  stat.accuracy},
      speed:  { name: 'speed', val: stat.speed },
      points: { name: 'points', val: Math.round(Stats.points(Stats.regrade(cardId))) },
      retention: { name: 'retention', val: stat.retention }
    };
    return stats;
  }


  /////////////////
  // Time Limits //
  /////////////////

  Game.prototype.timeToSelect = function() {
    var self = this;
    var select_begin = self.player().card_select_begin;
    var time_to_select = select_begin + defaults.cardSelectTime * 1000 - new Date();
    return Math.max(time_to_select, 0);
  }

  Game.prototype.timeToPlay = function() {
    var self = this;
    var play_end = self.player().play_end;
    var time_to_results = play_end + defaults.playPastTime * 1000 - new Date();
    return Math.max(time_to_results, 0);
  }


  ////////////////////
  // Card Selection //
  ////////////////////

  Game.prototype.initSelection = function() {
    var self = this;

    self.selected_cards = new ReactiveDict();

    _.each(self.deck().cards, function(card) {
      self.selected_cards.set(card._id,0);
    });

    self.numSelected(0);
    
  }

  Game.prototype.numSelected = function(val) {
    var self = this;
    if(val !== undefined) {
      self.updatePlayer({numSelected: val});      
    } else {
      var player = self.get(self.me_id,true);
      return parseInt(player.numSelected, 10);
    }
  }

  Game.prototype.destroySelection = function() {
    this.selected_cards = null;
  }

  Game.prototype.selectionCount = function(cardId) {
    var self = this;
    return self.selected_cards.get(cardId);
  }

  Game.prototype.randomSelect = function(force) {
    var self = this;
    var cardsLeft = self.nCards() - self.numSelected();
    var deck = self.deck();
    var card_id = null;

    if (!cardsLeft && !force)
      return;

    if (!cardsLeft) {
      _.each(deck.cards, function(card_id) {
        self.selected_cards.set(card_id,0);
      });
      cardsLeft = self.nCards();
    }

    _.times(cardsLeft, function() {
      card_id = deck.cards[utils.rand_int(deck.cards.length)];
      var numSelected = self.selected_cards.get(card_id);
      self.selected_cards.set(card_id, numSelected + 1 );
    });

    self.numSelected(self.nCards());
  }

  Game.prototype.selectedCards = function() {
    var self = this;
    var cards = [];
    _.each(self.selected_cards.all(), function(num, _id) {
      _.times(num, function() {
        cards.push(_id);
      });
    });
    return cards;
  }

  Game.prototype.incrementSelectedCard = function(cardId) {
    var self = this;
    var numSelected = self.selected_cards.get(cardId);
    if (self.numSelected() < self.nCards()) {
      self.selected_cards.set(cardId, numSelected + 1 );
      self.numSelected(self.numSelected() + 1);
      return true;
    }
    return false;
  }

  Game.prototype.decrementSelectedCard = function(cardId) {
    var self = this;
    var numSelected = self.selected_cards.get(cardId);
    if (numSelected > 0) {
      self.selected_cards.set(cardId, numSelected - 1 );
      self.numSelected(self.numSelected() - 1);
      return true;
    }
    return false;
  }

  Game.prototype.pickSelectedCards = function() {
    var self = this;
    if(self.numSelected() !== self.nCards())
      return false;

    self.timeouts.select && Meteor.clearTimeout(self.timeouts.select);
    delete self.timeouts.select
    self.setProblems(self.selectedCards());
    self.dispatch('selected');
    return true;
  }


  ////////////////////////
  // Problem Management //
  ////////////////////////

  /*
    Returns either the current problem or the problem with the
    specified id
  */
  Game.prototype.problem = function(id, playerId) {
    return this.problemByIdx(this.problemIdx(id,playerId), playerId);
  }

  Game.prototype.problemIdx = function(problemId, playerId) {
    var self = this;
    if ('object' === typeof problemId)
      problemId = problemId._id;

    playerId = playerId || self.me_id;

    if (!self._problem_idxs)
      self._problem_idxs = {};

    if (!self._problem_idxs[playerId]) {
      self._problem_idxs[playerId] = {};
      var problems = self.problems(playerId);
      _.each(problems, function(problem,idx) {
        self._problem_idxs[playerId][problem._id] = idx;
      });
    }
    return self._problem_idxs[playerId][problemId];
  }

  Game.prototype.problemByIdx = function(idx, playerId) {
    playerId = playerId || this.me_id;
    return this.get(playerId + '.problems.' + idx);
  }

  Game.prototype.currentProblem = function(player_id) {
    var self = this;
    player_id = player_id || self.me_id;

    var problem_idx = this.get((player_id || this.me_id)+'.problem');
    if (problem_idx === undefined)
      return;
    else
      return this.problemByIdx(problem_idx, player_id);
  }

  Game.prototype.currentSpeed = function() {
    var self = this;
    var problem = self.currentProblem();
    var time = +new Date() - problem.startTime;
    time /= 1000; // in seconds
    var cardStatistics = Stats.cardTime(problem.card_id);
    var speed = 1 - Stats.inverseGaussCDF(time, cardStatistics.mu, cardStatistics.lambda);
    speed = (speed - defaults.speedBonusCutoff) / ( 1 - defaults.speedBonusCutoff);

    speed = Math.max(speed, 0);

    return utils.round(speed,4);
  }

  Game.prototype.setCurrentProblem = function(idx) {
    this.updatePlayer({problem: idx});
  }

  Game.prototype.nextProblem = function() {
    var self = this;
    var problem_idx = this.get(self.me_id + '.problem');
    if (problem_idx === undefined)
      problem_idx = 0;
    else if (self.problemByIdx(problem_idx).answer !== undefined)
      problem_idx++;

    var num_problems = self.problems().length;

    // dont't do anything if next problem is called too many times
    if (problem_idx > num_problems)
      return;

    self.setCurrentProblem(problem_idx);

    // when no more problems are left the game is finished
    if (problem_idx === num_problems) {
      console.log('dispatch finished', self.me_id);
      self.dispatch('finished');
      return;
    }

    var problem = self.currentProblem();
    if (! problem.startTime) {
      self.updateProblem(problem,{startTime: +new Date()});
    }

    self.emit('next');
    return problem;

  }


  ////////////////////
  // Update Helpers //
  ////////////////////

  Game.prototype._updateProblem = function(problem, mod) {
    var self = this;
    var update = {}
    var p_idx = self.problemIdx(problem);
    if (p_idx === undefined)
      throw new Error('didnt find problem idx');
    _.each(mod, function(val, field) {
      update[self.me_id + '.problems.' + p_idx + '.' + field] = val;
    });
    return update;
  }

  Game.prototype.updateProblem = function(problem, mod) {
    var self = this;
    var update = self._updateProblem(problem, mod);
    Games.update(self.get('_id'), {$set: update});
  }

  /*
    Returns the list of problemized cards
    or sets them for the opponent
  */
  Game.prototype.problems = function(player_id) {
    var self = this;
    return self.get((player_id || self.me_id) + '.problems');
  }

  Game.prototype.setProblems = function(cards) {
    var self = this;
  
    var problems = _.map(cards, function(c) { 
      var problem = problemize(Cards.findOne(c));
      // allows players to sort in same order
      problem.order = Math.random();
      self.emit('problemInstantiated', problem);
      return problem; 
    });

    var update = {$pushAll: {}};
    update.$pushAll[self.me_id + '.problems'] = problems;
    update.$pushAll[self.opponent_id + '.problems'] = problems;
    self.update(update);
  }

  Game.prototype.sortProblems = function() {
    var self = this;
    var problems = self.get(self.me_id + '.problems');
    problems = _.sortBy(problems, function(problem) {
      return problem.order + problem._id;
    });
    self.updatePlayer({
      problems: problems
    });
  }

  Game.prototype.updatePlayer = function(o, id) {
    var self = this,
      update = {$set: {}};

    id = id || self.me_id;
    _.each(o, function(val, key) {
      update['$set'][id + '.' + key] = val;
    });
    self.update(update);
  }

  Game.prototype.update = function(update, cb) {
    Games.update(this.id, update, cb);
  }


  ////////////////////
  // Answer Problem //
  ////////////////////

  /*
    Record an answer to a problem
  */
  Game.prototype.answer = function(answer) {
    var self = this,
      problem = self.currentProblem();

    problem.answer = answer;
    if (!problem.time) 
      problem.time = (+new Date()) - problem.startTime;

    var correct = self.isCorrect(problem);
    

    problem.points = correct ? Stats.points(Stats.regrade(problem.card_id)) : 0;
    
    self.updateProblem(problem, {
      answer: answer, 
      points: problem.points, 
      time: problem.time
    });

    self.emit('answer', problem, correct);

    return correct;
  }


  ////////////////////////
  // Point Accumulation //
  ////////////////////////

  Game.prototype.bonus = function(points, reason, problem) {
    var self = this;

    //problem update
    problem.bonuses = problem.bonuses || {};
    var bonuses = problem.bonuses;
    bonuses[reason] = points;

    //db update
    var mod = {};
    mod['bonuses.' + reason] = points;
    self.updateProblem(problem, mod);
  }

  Game.prototype.multiplier = function(mult, problem) {
    var self = this;
    var problem_update = self._updateProblem(problem, {multiplier: mult});
    var inc = {};
    inc[self.me_id + '.multiplier'] = mult;
    self.update({$inc: inc, $set: problem_update});
    console.log('multiplier', mult);
  }

  Game.prototype.getMultiplier = function() {
    var self = this;
    return self.get(self.me_id + '.multiplier') || 0;
  }

  Game.prototype.resetMultiplier = function() {
    var self = this;
    var update = {$set: {}};
    update.$set[self.me_id + '.multiplier'] = 0;
    self.update(update);
  }

  Game.prototype.updatePoints = function(problem) {
    var self = this;
    var points = self.get(self.me_id + '.points') || 0;
    var multiplier = 1 + self.get(self.me_id + '.multiplier');
    var bonus = _.reduce(problem.bonuses, function(memo, bonus) {
      return memo + bonus;
    }, 0);
    points += (problem.points || 0) * multiplier + bonus;
    console.log('points',points, problem.points, multiplier, bonus);
    self.updatePlayer({points: points});
  }

  Game.prototype.points = function(uid) {
    var self = this;
    uid = uid || self.me_id;
    return self.get(uid + '.points') || 0;
  }


  //////////////
  // End Game //
  //////////////
  
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
    console.log('complete event');
    event('complete', game, {
      adverbs: adverb
    });
    self.emit('complete');
  }

  Game.prototype.winner = function() {
    var self = this;
    var res = self.results();

    var state = self.state();
    var opState = self.opponentState();
    if (state === 'quit') {
      if (opState !== 'quit')
        return self.opponent();
      else 
        return null;
    } else if (opState === 'quit') {
      return self.me();
    }

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
        incorrect = 0;

      _.each(problems, function(p, key) {
        if(self.isCorrect(p)) {
          correct++;
        } else if (self.isIncorrect(p)) {
          incorrect++;
        }
      });

      return {
        correct: correct,
        incorrect: incorrect,
        total: problems.length,
        points: self.points(id)
      };
    }
  }

  Game.prototype.breakdown = function(uid) {
    var self = this;
    var points = 0;
    var mult = 0;
    var mult_total = 0;
    var points_total = 0;
    var crit = 0;
    _.each(self.problems(uid), function(problem) {
      mult =  problem.multiplier ? mult + problem.multiplier : 0;
      var bonus = _.reduce(problem.bonuses, function(memo, bonus, name) {
        if (name === 'critical')
          crit += bonus;
        return memo + bonus;
      }, 0);
      mult_total += problem.points * mult;
      points_total += problem.points;
      points += problem.points * (1 + mult) + bonus;
    });
    
    return {
      critical: crit,
      multiplier: Math.round(mult_total),
      points: Math.round(points_total)
    }
  }

  Game.prototype.quit = function() {
    this.dispatch('quit');
  }

  Game.prototype.stop = function() {
    var self = this;
    self.stateHandle && self.stateHandle.stop();
    self.stateHandle = null;
    self.monitorHandle && self.monitorHandle.stop();
    self.monitorHandle = null;
    self.clearTimeouts();
    self.emit('stop');
  }

  Game.prototype.clearTimeouts = function(timeouts) {
    var self = this;
    timeouts = timeouts || self.timeouts;
    _.each(timeouts, function(timeout, name) {
      if ('object' === typeof timeout && timeout !== null)
        self.clearTimeouts(timeout);
      else
        timeout && Meteor.clearTimeout(timeout);
      delete self.timeouts[name];
    });
  }


  ////////////////
  // Heartbeats //
  ////////////////

  Game.prototype.heartbeat = function(timeout) {
    var self = this;
    var h = {
      _id: Meteor.uuid(),
      received: false,
      initiator: self.me_id,
      time: +new Date(),
      timeout: (timeout || defaults.heartbeat_timeout) * 1000
    };

    var update = {$set: {}};
    update.$set['heartbeats.'+ h._id] = h;
    self.update(update);
  }

  Game.prototype.monitor = function() {
    var self = this;
    self.timeouts.heartbeats = {};
    self.monitorHandle = ui.autorun(function() {
      var update = {};
      var heartbeats = self.get('heartbeats');
      _.each(heartbeats, function(h) {
        if (h.initiator === self.me_id) {
          if (h.received) {
            //if opponenet received heartbeat, clear it
            if (!update.$unset)
              update.$unset = {};
            update.$unset['heartbeats.' + h._id] = true
            Meteor.clearTimeout(self.timeouts.heartbeats[h._id]);
            delete self.timeouts.heartbeats[h._id]
          } else {
            // if opponent hasnt received heartbeat, 
            // setTimeout for `opdead` event
            if (!self.timeouts.heartbeats[h._id]) {
              self.timeouts.heartbeats[h._id] = Meteor.setTimeout(function() {
                var update = {};
                update.$unset = {};
                update.$unset['heartbeats.' + h._id] = true
                self.update(update);
                delete self.timeouts.heartbeats[h._id]
                self.dispatch('opdead');
              }, Math.max(h.time + h.timeout - new Date()), 0);
            }
          }
        } else if (!h.received) {
          if (!update.$set)
            update.$set = {};
          update.$set['heartbeats.' + h._id + '.received'] = true;
        } 
      });
      if (update.$set || update.$unset)
        self.update(update);
    });
  }


  ///////////////////
  // State machine //
  ///////////////////
  
  /*
  */
  Game.prototype.state = function(state) {
    var self = this;
    if (state) {
      self.updatePlayer({state: state}, self.me_id);
      self.emit(state, true);
    }
    return self.get(self.me_id + '.state');
  }

  Game.prototype.opponentState = function() {
    return this.get(this.opponent_id + '.state');
  }

  var stateTemplateMap = {
    'limbo': 'select_view',
    'select': 'select_view',
    'play': 'play_view',
    'results': 'results_view',
    'canceled': 'game_canceled',
    'quit': 'game_quit',

  };
  Game.prototype.renderState = function() {
    var state = this.mainState();
    if (state === 'quit') {
      var opponentState = this.opponentState().split('.')[0];
      return stateTemplateMap[opponentState];
    } else
      return stateTemplateMap[state];
  }

  Game.prototype.mainState = function() {
    return this.state().split('.')[0];
  }

  Game.prototype.dialogState = function() {
    var state = this.state();
    if (state === 'quit')
      return 'quit'
    else
      return this.state().split('.')[1];
  }

  Game.prototype.dispatch = function(type) {
    var self = this;
    var e = {
      _id: Meteor.uuid(),
      time: +new Date(), 
      type: type, 
      actor: self.me_id,
      processed: {}
    };
    var update = {$set: {}};
    update.$set['events.'+ e._id] = e;
    self.update(update);
  }

  Game.prototype.processEvents = function() {
    var self = this;
    var events = self.get('events');
    var unprocessed = [];
    _.each(events, function(e, id) {
      if (!e.processed[self.me_id]) {
        var update = {$set: {}};
        update.$set['events.' + id + '.processed.' + self.me_id] = true;
        self.update(update);
        unprocessed.push(e);
      }
    });
    return _.sortBy(unprocessed, 'time');
  }

  Game.prototype.stateManager = function() {
    var self = this;
    var transitionTable = [
      //state    event          new state
      ['limbo', 'me.joined', 'limbo.waiting'],
      ['limbo', 'op.joined', 'limbo.'],
      ['limbo.waiting', 'op.joined', 'select'],
      ['limbo.', 'me.joined', 'select'],
      ['select', 'me.selected', 'select.waiting'],
      ['select', 'op.selected', 'select.'],
      ['select', 'op.quit', 'canceled'],
      ['select.', 'op.quit', 'canceled'],
      ['select.', 'op.opdead', 'canceled'],
      ['select.waiting', 'op.selected', 'play'],
      ['select.waiting', 'op.quit', 'canceled'],
      ['select.waiting', 'me.opdead', 'canceled'],
      ['select.', 'me.selected', 'play'],
      ['play', 'me.finished', 'play.waiting'],
      ['play', 'op.finished', 'play.'],
      ['play', 'op.quit', 'play.continue'],
      ['play.', 'me.finished', 'results'],
      ['play.', 'op.opdead', 'results'],
      ['play.waiting', 'op.finished', 'results'],
      ['play.waiting', 'op.quit', 'results'],
      ['play.waiting', 'me.opdead', 'results'],
      ['play.continue', 'me.continue', 'play.'],
      ['play.continue', 'me.end', 'results'],
      ['*', 'me.quit', 'quit']
    ];
    var machine = new StateMachine(transitionTable, {
      next: function(new_state) {
        if (self.state() !== new_state)
          self.state(new_state);
      },
      miss_logs: true
    });

    self.emit(self.state(), false);

    self.stateHandle = ui.autorun(function() {
      var events = self.processEvents();
      _.each(events, function(e) {
        var e_string = e.actor === self.me_id ? 'me.' : 'op.';
        e_string += e.type;
        machine.newEvent(self.state(), e_string);
      });
    });
  }

	window.Game = Game;
})();
