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
		var handle = null,
			transitionTable = null,
			evaluators = null,
			machine = null;

		game = new Game(e.object.body);
		game.opponent = function() {
			return Meteor.user();
		};

		transitionTable = [
			['await_join', function() {}],
			['card_select', function() { Guru.choose(); }],
			['play', function(){ Guru.play(); }],
			[null, function(){ handle && handle.stop(); }]
		];

		machine = new StateMachine(transitionTable);
		handle = ui.autorun(
		function() {
			return game.state() === 'results';
		},
		function() {
			machine.state([game.state()]);
		});
	});
})();