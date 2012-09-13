;(function() {

	Guru.create  = function (game) {
		var deck_id = game.deck()._id;
		var deck_info = UserDeckInfo.findOne({user: Meteor.user().username, deck: deck_id});
		if (!deck_info)
			return new Guru[MASTERY.PROFICIENT](game);
		else
			return new Guru[deck_info.mastery.rank || 0](game);
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

		DependsEmitter.call(self);

		self.game = game;
		self.autorunHandle = null;

		process.register('guru', self);

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
		UserDeckInfo.update(
			{ user: Meteor.user().username, deck: self.game.deck() },
			{$inc: { 'mastery.wins': 1, 'mastery.winsAtRank': 1}}
		);
	}

	Guru.prototype.stop = function() {
		var self = this;
		self.autorunHandle && self.autorunHandle.stop();
		self.mygame.stop();
	}

	Guru.prototype.problemTime = function(problem) {
		return Stats.cardTime(problem.card_id).u;
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

	Guru[MASTERY.PROFICIENT].prototype.answer = function(problem) {
		var difficulty = 80;
		var answer = utils.rand_int(0, 100);

		if(answer < difficulty)
			answer = problem.solution;

		return answer;
	}

	
	window.Guru = Guru;


})();