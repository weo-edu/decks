;(function(global) {

	var bonuses = [
		{
			setup: function(game) {
				var self = this;
				game.on('answer', _.bind(nInARow(5), self));
			},
			name: 'spree',
			message: '5 Card Spree!',
			points: function(problems) {
				var points = .1 * _.reduce(problems, function(memo, problem) {
					return memo + problem.points;
				}, 0);
				console.log('spree', points)
				return points;
			}
		},
		{
			onProblem: true,
			baseProbability: .05,
			setup: function(game) {
				var self = this;
				game.on('answer', function(problem, correct) {
					if(!correct) return;

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
					if(Math.random() < probability) {
						console.log('award critical', game.me()._id);
						self.award(problem);
					}
				});
			},
			points: function(problem) {
				console.log('critical', 2 * problem.points);
				return 2 * problem.points;
			},
			name: 'critical',
			message: 'Critical!'
		},
		{
			onProblem: true,
			setup: function(game) {
				var self = this;
				game.on('answer', function(problem, correct) {
					if (!correct) return;

					self.award(problem);

				});
			},
			points: function(problem) {
				var time = problem.time;
				var cardStatistics = Stats.cardTime(problem.card_id);
				var speed = 1 - jstat.pnorm(time,cardStatistics.u,cardStatistics.s);
				return problem.points * Math.sqrt(speed) * 2;

			},
			name: 'time',
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
		_.each(bonuses, function(b, i) {
			b = new Bonus(b, game);
			b.setup(game);
		});
	}

	function Bonus(o, game) {
		var self = this;
		if(! (self instanceof Bonus)) {
			return new Bonus(o);
		}

		_.extend(self, o);
		self.game = game;
	}

	Bonus.prototype.award = function(problem) {
		var self = this,
			points = typeof self.points === 'function' ? self.points(problem) : self.points;
		points = Math.round(points);
		self.game.bonus(points, self.name, self.onProblem ? problem : undefined);
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

	global.Bonus = Bonus;
})(typeof window === 'undefined' ? exports : window);