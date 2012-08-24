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

		var handle = ui.autorun(
		function() {
			return game.state() === 'results';
		},
		function() {
			switch(game.state()) {
				case 'await_join':
				{

				}
				break;
				case 'card_select':
				{
					Guru.choose();
				}
				break;
				case 'play':
				{
					Guru.play();
				}
				break;
				default:
				{
					console.log('stopping guru handle', game.state());
					handle && handle.stop();
				}
				break;
			}
		});
	});
})();