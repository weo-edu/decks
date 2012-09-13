;(function() {

	Guru.create  = function (game) {
		var deck_id = game.deck()._id;
		var deck_info = UserDeckInfo.findOne({user: Meteor.user()._id, deck: deck_id});
		if (!deck_info)
			return new Guru[MASTERY.PROFICIENT](game);
		else
			return new (Guru[deck_info.mastery.rank || 0] || Guru[MASTERY.MASTER_GURU])(game);
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
		if(game.opponent().synthetic) {
			var guru = Guru.create(game);
			guru.start();
		}

	});

	function Guru(game) {
		var self = this;

		self.game = game;
		self.autorunHandle = null;	

		game.on('stop', function() {
			self.stop();
		});

		game.on('complete', function() {
      // user beat goat guru
      var winner = game.winner();
      if (winner && winner.username === Meteor.user().username)
        self.beat();
		});
	}

	Guru.prototype.start = function() {
		var self = this;

		var transitionTable = null
			, evaluators = null
			, machine = null;

		var options = {
			me: function() {
				return Guru.goat();
			},
			opponent: function() {
				return Meteor.user();
			}
		};

		self.mygame = new Game(self.game.id, options);

		transitionTable = [
			['await_join', function() { }],
			['card_select', function() { self.choose(); }],
			['play', function(){ self.play(); }],
			['results', function() { Meteor.defer(function() { self.stop(); }) }]
		];

		machine = new StateMachine(transitionTable);
		self.autorunHandle = ui.autorun(
			function() {
				self.mygame.state();
			},
			function() {
				machine.state([self.mygame.state()]);
			}
		);

		_.each(self.mygame.deck().cards,function(cardId) {
			self.setCardStats(cardId);
		});

		self.mygame.start();
	}

	Guru.prototype.choose = function() {
		var self = this;
		self.mygame.problems('random');
	}

	Guru.prototype.play = function() {
		var self = this;

		var time = +new Date();
		var setTimes = false;
		var problems = self.mygame.problems();

		_.each(problems, function(problem) {
			if (!problem.startTime) {
				setTimes = true;
				var problem_time = self.problemTime(problem);
				problem.startTime = time;
				problem.time = problem_time;
				time += problem_time;
			}
		});

		if (setTimes)
			self.mygame.updatePlayer({problems: problems});


		var playerDone = false;
		var answerTimeout = null;
		function answer () {
			var problem = self.mygame.problem();
			if (problem) {
				var timeToAnswer = problem.time - (new Date() - problem.startTime);
				if (timeToAnswer < 0) timeToAnswer = 0;
				answerTimeout = Meteor.setTimeout(function() {
					self.mygame.answer(self.answer(problem));
					answer();
				}, playerDone ? 0 : timeToAnswer);
			}

		}

		answer();

		self.mygame.once('opponentDone', function() {
			playerDone = true;
			Meteor.clearTimeout(answerTimeout);
			answer();
		});
		
	}

	Guru.prototype.beat = function() {
		var self = this;
		var mastery = self.mastery();
		if (mastery.winsAtRank >= 2) {
			UserDeckInfo.update(
				{ user: self.mygame.opponent()._id, deck: self.mygame.deck()._id },
				{$set: { 'mastery.winsAtRank': 0}, $inc: {'mastery.rank': 1,'mastery.wins': 1}}
			);
		} else {
			UserDeckInfo.update(
				{ user: self.mygame.opponent()._id, deck: self.mygame.deck()._id },
				{$inc: { 'mastery.wins': 1, 'mastery.winsAtRank': 1}}
			);
		}		
	}

	Guru.prototype.mastery = function() {
		var self = this;
		return UserDeckInfo.findOne({ 
			user: self.mygame.opponent()._id, 
			deck: self.mygame.deck()._id }
		).mastery;
	}

	Guru.prototype.stop = function() {
		var self = this;
		self.autorunHandle && self.autorunHandle.stop();
		self.mygame.stop();
	}

	Guru.prototype.problemTime = function(problem) {
		var self = this;
		var db_stats = self.mygame.player().stats[problem.card_id];
		var cardDist = Stats.cardTime(problem.card_id);
		var dist = new NormalDistribution(cardDist.u,cardDist.s);
		var time = dist.getQuantile(1-db_stats.speed.val * Math.sqrt(db_stats.retention.val));
		if (time < 100) time = 800;
		return time;
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
	}

	utils.inherits(Guru[MASTERY.EXPERT], Guru);

	Guru[MASTERY.EXPERT].prototype.cardStats = function() {
		return {
			accuracy: {u: .90, s: .03},
			speed: {u: .80, s: .03},
			retention: {u: .90, s: .10}
		}
	}


	Guru[MASTERY.GURU] = function(game) {
		Guru.call(this, game);
	}

	utils.inherits(Guru[MASTERY.GURU], Guru);

	Guru[MASTERY.GURU].prototype.cardStats = function() {
		return {
			accuracy: {u: .96, s: .02},
			speed: {u: .95, s: .04},
			retention: {u: .95, s: .10}
		}
	}

	Guru[MASTERY.MASTER_GURU] = function(game) {
		Guru.call(this, game);
	}

	utils.inherits(Guru[MASTERY.MASTER_GURU], Guru);

	Guru[MASTERY.MASTER_GURU].prototype.cardStats = function() {
		return {
			accuracy: {u: .99, s: .002},
			speed: {u: .99, s: .002},
			retention: {u: .99, s: .002}
		}
	}

	Guru.prototype.beat = function() {
		var self = this;
		UserDeckInfo.update(
			{ user: self.mygame.opponent()._id, deck: self.mygame.deck()._id },
			{$inc: { 'mastery.wins': 1, 'mastery.winsAtRank': 1}}
		);
	}

	
	window.Guru = Guru;


})();