;(function(global) {

	var bonuses = [
		{
			setup: function(game) {
				var self = this;
				game.on('answer', _.bind(nInARow(3), self));
			},
			name: 'spree',
			message: '3 Card Spree!',
			points: 100
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
					var n = _.reduce(self.game.problems(), function(memo, p) {
						return memo + (p.card_id === problem.card_id ? 1 : 0);
					}, 1);

					var probability = Math.min(self.baseProbability * n, .50);
					if(Math.random() < probability) {
						self.award(problem);
					}
				});
			},
			points: 100,
			name: 'critical',
			message: 'Critical!'
		}
	];

	function nInARow(n) {
		var self = this,
			nCorrect = 0;

		return function(problem, correct) {
			var self = this;
			nCorrect = correct ? nCorrect+1 : 0;
			if (nCorrect >= n) {
				self.award(problem);
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
			points = typeof self.points === 'function' ? self.points() : self.points;
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
				}, 100, 'easeOutSine')
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