;(function(global) {

	var bonuses = [
		{
			baseProbability: .25,
			init: function(problem) {
				problem.critical = Math.random();
			},
			shouldAward: function(problem, correct) {
				if(!correct) 
					return;
				var self = this;
				//	Scale the probability up each time the card appears
				//	Initialize to 1 because the answer event gets emitted
				//	before the answer is applied to the problem
				var problem_found = false;
				var n = _.reduce(self.game.problems(), function(memo, p) {
					if (problem_found) return memo;
					if (problem._id === p._id) problem_found = true;
					return memo + (p.card_id === problem.card_id ? 1 : 0);
				}, 0);

				var probability = Math.min(self.baseProbability * n, .5);
				if(problem.critical < probability)
					return true;
			},
			value: function(problem) {
				return 2 * problem.points;
			},
			name: 'critical',
			message: 'Critical!'
		},
		{
			type: 'multiplier',
			shouldAward: function(problem, correct) {
				return correct;
			},
			value: function(problem) {
				var time = problem.time / 1000;
				var cardStatistics = Stats.cardTime(problem.card_id);
				var speed = 1 - Stats.inverseGaussCDF(time, cardStatistics.mu, cardStatistics.lambda);

				var cutoff = .5
				var max_inc = .1;
				console.log('speed', speed);
				if (speed > cutoff)
					return utils.round((speed - cutoff) / (1 - cutoff) * max_inc, 2);
				else
					return 0;
			},
			name: 'multiplier',
			message: 'Multiplier!',
			notify: function(){}
		}
	];

	function nInARow(n) {
		var self = this,
			nCorrect = 0,
			problems = [];

		return function(problem, correct) {
			var self = this;
			problems.push(problem);
			nCorrect = correct ? nCorrect+1 : 0;
			if (nCorrect >= n) {
				self.award(problems);
				nCorrect = 0;
			}  
		}
	}

	Bonus.setup = function(game) {
		_.each(bonuses, function(bonus) {
			var b = Bonus.create(bonus, game);
			game.on('answer', function(problem, correct) {
				if (b.shouldAward(problem, correct))
					b.award(problem);
				else if (b.miss)
					b.miss(problem);
			});
			game.on('problemInstantiated', function(problem) {
				if (b.init)
					b.init(problem);
			});
		});
	}

	function Bonus(bonus, game) {
		var self = this;
		_.extend(self, bonus);
		self.game = game;
	}

	Bonus.create = function(bonus, game) {
		if (!bonus.type)
			return new Bonus(bonus, game);
		else if (bonus.type === 'multiplier')
			return new Multiplier(bonus, game);
	}

	Bonus.prototype.award = function(problem) {
		var self = this;
		var points = typeof self.value === 'function' ? self.value(problem) : self.value;
		points = Math.round(points);
		self.game.bonus(points, self.name, problem);
		self.notify(points);
	}


	Bonus.prototype.notify = function(points) {
		var self = this,
			msg = typeof self.message === 'array' ? 
			self.message[utils.rand_int(0, self.message.length-1)] 
			: self.message;

		msg += '<br/>' + points;
		if(self.game.me()._id !== 1) {
			$('#bonus').attr('style', ' ').html(msg).attr('class', self.name)
				.stop(true, false)
				.animate({
					'margin'		: 0,
					'opacity'		: 1, 
					'font-size'	: '50px'
				}, 130, 'easeOutSine')
				.delay(1000)
				.animate({
					'margin'		: 0,
					'font-size'	: '70px'
				}, 50, 'easeOutSine')
				.animate({
					'margin'		: '0 0 0 -300px',
					'opacity'		: 0,
					'font-size'	: 0
				}, 80, 'easeInSine');
		}
	}

	function Multiplier(o, game) {
		Bonus.call(this, o, game);
	}

	utils.inherits(Multiplier, Bonus);

	Multiplier.prototype.award = function(problem) {
		var self = this;
		var mult_inc = self.value(problem);
		self.game.multiplier(mult_inc, problem);
		self.notify(mult_inc);
	}

	Multiplier.prototype.miss = function() {
		var self = this;
		self.game.resetMultiplier();
	}


	global.Bonus = Bonus;
})(typeof window === 'undefined' ? exports : window);