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
		var problem;
		while(problem = self.mygame.problem()) {
			self.mygame.answer(self.answer(problem));
		}
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

	function time_stats(problem) {
		var card = Cards.findOne(problem.card_id);
		var grade_stats = StatsCollection.findOne({name: 'gradeStats'});
		console.log('grade_stats', grade_stats);
		if (grade_stats) grade_stats = grade_stats.stats.bins[card.grade];
		console.log('card_stats', card.stats);
		var stats = {};
		if (card.stats.correct >= 10) {
			var average_time = card.stats.correct_time / card.stats.correct;
			stats.u  = average_time;
			var std = Math.sqrt((card.stats.correct_time_squared/card.stats.correct) - Math.pow(average_time,2));
			stats.s = std;
		} else if (grade_stats && grade_stats.correct > 0) {
			var average_time = grade_stats.correct_time / grade_stats.correct;
			stats.u = average_time;
			var std = Math.sqrt((grade_stats.correct_time_squared/grade_stats.correct) - Math.pow(average_time,2));
			stats.s = std;
		} else {
			stats.u = 5;
			stats.s = 1;
		}
		return stats;
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