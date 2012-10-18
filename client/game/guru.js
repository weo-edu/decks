;(function() {

	var topSpeed = 1.0; //seconds

	Guru.create  = function (game) {
		var deck_id = game.deck()._id;
		var deck_info = UserDeckInfo.findOne({user: Meteor.user()._id, deck: deck_id});
		if (!deck_info) {
			UserDeckInfo.insert({user: Meteor.user()._id, deck: deck_id});
			return new Guru[MASTERY.PROFICIENT](game);
		}
		else {
			var rank = deck_info.mastery && deck_info.mastery.rank || 0;
			return new (Guru[rank] || Guru[MASTERY.MASTER_GURU])(game);
		}
			
	}

	Guru.goat = function () {
		return {
			_id: 1, 
			username: 'Goat Guru', 
			synthetic: true, 
			avatar: '/app!common/avatars/guru.png'
		};
	}

	Game.on('start', function(game) {
		console.log('guru start');
		if(game.opponent().synthetic) {
			var guru = Guru.create(game);
			guru.start();
		}
	});

	function Guru(game) {
		var self = this;

		self.game = game;

		game.on('stop', function() {
			self.stop();
		});
	}

	Guru.prototype.start = function() {
		var self = this;

		var options = {
			me: function() {
				return Guru.goat();
			},
			opponent: function() {
				return Meteor.user();
			}
		};

		self.mygame = new Game(self.game.id, options);

		self.mygame.on('select', self.choose.bind(self));

		self.mygame.on('play', self.setupTimes.bind(self));
		self.mygame.on('play', self.guruRunner.bind(self));

		self.mygame.on('play.', function() {
			self.answerTimeout && Meteor.clearTimeout(self.answerTimeout);
			self.guruRunner();
		});


		self.mygame.on('results', function(changed) {
			console.log('guru results');
			self.stop();
			if (!changed)
				return
			var winner = self.mygame.winner();
			console.log('winner', winner);
      if (winner && winner._id !== Guru.goat()._id)
        self.beat();
		});

		self.mygame.on('play.continue', function() {
			self.mygame.dispatch('end');
		});

		_.each(self.mygame.deck().cards,function(cardId) {
			self.setCardStats(cardId);
		});

		self.mygame.start();
	}

	Guru.prototype.choose = function(changed) {
		var self = this;

		if (!changed)
			return;
		console.log('guru choose');
		self.mygame.initSelection();
		self.select();
		self.mygame.pickSelectedCards();
		self.mygame.destroySelection();
	}

	Guru.prototype.select = function() {
		var self = this;
    var game = self.mygame;
    var cardsLeft = game.nCards() - game.numSelected();
    console.log('gardsLeft');
    var deck = game.deck();

    var stats = {};
    _.each(deck.cards, function(cardId) {
    	if (! stats[cardId])
      	stats[cardId] = game.opponentCardStats(cardId);
    });

    var maxAdvantage = null;
    var maxCardId = null;
    var goatScore = null;
    var playerScore = null;
    var advantage = null;
    _.times(cardsLeft, function() {
      maxAdvantage = null;
      maxCardId = null;

      _.each(deck.cards, function(cardId) {
      	// goat does not pick based on card difficulty
      	// only player accuracy, speed and retention
      	// goat's score is included in decision making to make it indeterminant

        goatScore = self.getCardStats(cardId).accuracy.val; //accuracy
        goatScore *= self.getCardStats(cardId).speed.val; //speed
        goatScore *= (1 - Math.pow(game.selected_cards.get(cardId) * .2, 2)); //repeat deduction

        playerScore = stats[cardId].accuracy.val; //accuracy
        playerScore *= stats[cardId].speed.val; //speed
        playerScore *= stats[cardId].retention.val; //retention deduction
                
        advantage = goatScore - playerScore;
        console.log('advantage', advantage, cardId);
        if (maxAdvantage === null || advantage > maxAdvantage) {
          maxAdvantage = advantage;
          maxCardId = cardId;
        }
      });

      console.log('chose', maxCardId, maxAdvantage, stats[maxCardId]);
      game.selected_cards.set(maxCardId, game.selected_cards.get(maxCardId) + 1 );
    });

		game.numSelected(game.nCards());
  }

	Guru.prototype.setupTimes = function(changed) {
		if (!changed)
			return

		var self = this;

		var time = +new Date();
		var problems = self.mygame.problems();

		_.each(problems, function(problem) {
			var problem_time = self.problemTime(problem);
			problem.startTime = time;
			problem.time = problem_time;
			time += problem_time;
		});

		self.mygame.updatePlayer({problems: problems});
	}

	Guru.prototype.guruRunner = function() {
		var self = this;
		var problem = self.mygame.nextProblem();
		if (problem) {
			var timeToAnswer = problem.time - (new Date() - problem.startTime);

			// if old game or user is finished dont wait
			if (timeToAnswer < 0 || self.mygame.state() === 'play.') timeToAnswer = 0;

			self.answerTimeout = Meteor.setTimeout(function() {
				self.mygame.answer(self.answer(problem));
				self.guruRunner();
			}, timeToAnswer);
		}
	}


	Guru.prototype.beat = function() {
		console.log('beat');
		var self = this;
		var mastery = self.mastery(),
			modify = {$inc: { 'mastery.wins' : 1 } };

		if (mastery.winsAtRank >= 2 &&  mastery.rank <= MASTERY.MASTER_GURU) {
			modify['$set'] = {'mastery.winsAtRank': 0};
			modify['$inc']['mastery.rank'] = 1;		
		} else {
			modify['$inc']['mastery.winsAtRank'] = 1;
		}

		UserDeckInfo.update(
			{ user: self.mygame.opponent()._id, deck: self.mygame.deck()._id },
			modify
		);

		console.log(UserDeckInfo.findOne({user: self.mygame.opponent()._id, deck: self.mygame.deck()._id}));		
	}

	Guru.prototype.mastery = function() {
		var self = this,
			info = UserDeckInfo.findOne({ 
				user: self.mygame.opponent()._id, 
				deck: self.mygame.deck()._id
			});

		return (info && info.mastery) || {
			rank: 0,
			winsAtRank: 0,
			wins: 0
		};
	}

	Guru.prototype.stop = function() {
		var self = this;
		console.log('stop guru');
		self.answerTimeout && Meteor.clearTimeout(self.answerTimeout);
		self.answerTimeout = null;
		
		self.mygame.stop();
	}

	Guru.prototype.problemTime = function(problem) {
		var self = this;
		var db_stats = self.mygame.player().stats[problem.card_id];
		var cardDist = Stats.cardTime(problem.card_id);
		var x = 1 - db_stats.speed.val * Math.sqrt(db_stats.retention.val)
		var time = Stats.inverseGaussQuantile(x, cardDist.mu, cardDist.lambda);
		time = Math.max(time, topSpeed);
		return time * 1000;
	}

	Guru.prototype.answer = function(problem) {
		var self = this;
		var db_stats = self.mygame.player().stats[problem.card_id];
		var sample = Math.random();
		var answer;
		if(sample < db_stats.accuracy.val * Math.sqrt(db_stats.retention.val))
			answer = problem.solution;
		else 
			answer = null;
		return answer;
	}

	Guru.prototype.setCardStats = function(cardId) {
		var self = this;

		var player_db = self.mygame.player();
		var db_stats = player_db.stats && player_db.stats[cardId];
		if (db_stats) return db_stats;

		var stats = self.cardStats();

		//XXX replave normal sample with inverse sample
		var stats = {
			accuracy: {name: 'accuracy', val: cap(Stats.normalSample(stats.accuracy.u,stats.accuracy.s))},
			speed: { name: 'speed', val: cap(Stats.normalSample(stats.speed.u, stats.speed.s))},
			retention: { name: 'retention', val: cap(Stats.normalSample(stats.retention.u, stats.retention.s))},
			points: { name: 'points', val: Math.round(Stats.points(Stats.regrade(cardId))) },
		};
		var update = {};
		update['stats.'+cardId] = stats;
		self.mygame.updatePlayer(update);
	}

	Guru.prototype.getCardStats = function(cardId) {
		return this.mygame.get(Guru.goat()._id + '.stats.' + cardId);
	}

	function cap(val) {
		if (val > 100) return 100
		if (val < 0) return 0
		return val;
	}


	var MASTERY = {
		PROFICIENT: 0,
		ADVANCED: 1,
		EXPERT: 2,
		GURU: 3,
		MASTER_GURU: 4
	};


	Guru[MASTERY.PROFICIENT] = function(game) {
		Guru.call(this, game);
		console.log('proficient');
	}

	utils.inherits(Guru[MASTERY.PROFICIENT], Guru);

	Guru[MASTERY.PROFICIENT].prototype.cardStats = function() {
		return {
			accuracy: {u: .66, s: .1},
			speed: {u: .50, s: .1},
			retention: {u: .80, s: .10}
		}
	}

	Guru[MASTERY.ADVANCED] = function(game) {
		Guru.call(this, game);
		console.log('advanced');
	}

	utils.inherits(Guru[MASTERY.ADVANCED], Guru);


	Guru[MASTERY.ADVANCED].prototype.cardStats = function() {
		return {
			accuracy: {u: .80, s: .04},
			speed: {u: .66, s: .04},
			retention: {u: .85, s: .10}
		}
	}


	Guru[MASTERY.EXPERT] = function(game) {
		Guru.call(this, game);
		console.log('expert');
	}

	utils.inherits(Guru[MASTERY.EXPERT], Guru);

	Guru[MASTERY.EXPERT].prototype.cardStats = function() {
		return {
			accuracy: {u: .95, s: .03},
			speed: {u: .80, s: .03},
			retention: {u: .90, s: .10}
		}
	}


	Guru[MASTERY.GURU] = function(game) {
		Guru.call(this, game);
		console.log('guru');
	}

	utils.inherits(Guru[MASTERY.GURU], Guru);

	Guru[MASTERY.GURU].prototype.cardStats = function() {
		return {
			accuracy: {u: .99, s: .01},
			speed: {u: .90, s: .04},
			retention: {u: .99, s: .01}
		}
	}

	Guru[MASTERY.MASTER_GURU] = function(game) {
		Guru.call(this, game);
		console.log('master guru');
	}

	utils.inherits(Guru[MASTERY.MASTER_GURU], Guru);

	Guru[MASTERY.MASTER_GURU].prototype.cardStats = function() {
		return {
			accuracy: {u: .995, s: .002},
			speed: {u: .94, s: .002},
			retention: {u: .99, s: .002}
		}
	}

	
	window.Guru = Guru;


})();