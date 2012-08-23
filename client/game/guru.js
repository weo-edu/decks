;(function() {
	var game = null;

	window.Guru = new Emitter;
	process.register('guru', Guru);

	Guru.goat = function() {
		return {_id: 1, username: 'Goat Guru', synthetic: true, avatar: '/app!common/avatars/guru.png'};
	}

	Guru.play = function() {
		var problem;
		while(problem = game.problem()) {
			game.answer(Guru.answer(problem));
		}

		console.log('Guru answers', game.problems());
	}

	Guru.answer = function(problem, difficulty) {
		difficulty = difficulty || 80;
		var answer = utils.rand_int(0, 100);

		if(answer < difficulty)
			answer = problem.solution;

		return answer;
	}


	Guru.choose = function() {
		game.problems('random');
	}

	Guru.on('invite', function(e) {
		game = new Game(e.object.body);
		game.opponent = function() {
			return Meteor.user();
		};
		
		;(function gameLoop() {
			var done = false;

			switch(game.state()) {
				case 'card_select':
				{
					Guru.choose();
				}
				break;
				case 'play':
				{
					Guru.play();
					done = false;
				}
				break;
			};

			if(! done) {
				var ctx = new Meteor.deps.Context();
				ctx.run(function() { game.state(); });
				ctx.on_invalidate(gameLoop);
			}
		})();
	});
})();