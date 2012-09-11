;(function(global) {
	function nInARow(n) {
		var self = this,
			nCorrect = 0;

		return function(problem, correct) {
			nCorrect = correct ? nCorrect+1 : 0;
			if (nCorrect >= n) {
				self.award();
			}  
		}
	}

	var bonuses = [{
		setup: function(game) {
			var self = this;
			game.on('answer', _.bind(self, nInARow(3)));
		},
		name: '3 in a row!!',
		points: 100
	}];

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