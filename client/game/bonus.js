;(function(global) {
	function nInARow(n) {
		var self = this,
			nCorrect = 0;

		return function(problem, correct) {
			var self = this;
			nCorrect = correct ? nCorrect+1 : 0;
			if (nCorrect >= n) {
				self.award();
				nCorrect = 0;
			}  
		}
	}

	var bonuses = [
	{
		setup: function(game) {
			var self = this;
			game.on('answer', _.bind(nInARow(3), self));
		},
		name: '3 in a row!!',
		points: 100
	},
	{
		baseProbability: .05,
		setup: function(game) {
			var self = this;
			game.on('answer', function(problem, correct) {
				if(!correct) return;

				var probability = self.baseProbability;
				_.each(self.game.problems(), function(p, i) {
					if(p._id === problem._id && p.answer !== undefined)
						probability *= 2;
				});

				if(Math.random() < probability) {
					self.award();
				}
			});
		},
		points: 100,
		name: 'Critical Strike!!'
	}
	];

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

	Bonus.prototype.award = function() {
		var self = this;
		console.log('awarding bonus', self.name);
		self.game.points(self.points);
	}

	global.Bonus = Bonus;
})(typeof window === 'undefined' ? exports : window);