;(function() {
	var game = null;
	var autorunHandle = null;

	window.Guru = new DependsEmitter;
	process.register('guru', Guru);

	Guru.ready = function() {
		if(typeof Games !== 'undefined' && Games) {
			if(game.deck()) {
				if(game.deck().cards.length === Cards.find(game.deck().cards).count()) {
					return true;
				}
			}
		} else {
			var cur = Meteor.deps.Context.current;
			Meteor.defer(function() {
				cur.invalidate(); 
			});
		}

		return false;
	}

	Guru.depends('choose', Guru.ready);
	Guru.depends('play', Guru.ready);

	Guru.goat = function() {
		return {_id: 1, username: 'Goat Guru', synthetic: true, avatar: '/app!common/avatars/guru.png'};
	}

	Guru.on('play', function() {
		var problem;
		while(problem = game.problem()) {
			game.answer(Guru.answer(problem));
		}
	});

	Guru.answer = function(problem, difficulty) {
		difficulty = difficulty || 80;
		var answer = utils.rand_int(0, 100);

		if(answer < difficulty)
			answer = problem.solution;

		return answer;
	}

	Guru.on('choose', function() {
		game.problems('random');
	});

	Game.on('create', function(tmpl, g) {
		if(g.opponent().synthetic && ! game) {
			Guru.start(g.id);
		}

		tmpl.onDestroy(function() {
			Guru.emit('stop');
		});
	});


	Guru.start = function(id) {
		var transitionTable = null,
			evaluators = null,
			machine = null;
			options = {
				me: function() {
					return Guru.goat();
				},
				opponent: function() {
					return Meteor.user();
				}
			};

		game && Guru.emit('stop');
		game = null;
		game = new Game(id, options);

		transitionTable = [
			['await_join', function() { }],
			['card_select', function() { Guru.emit('choose'); }],
			['play', function(){ Guru.emit('play'); }],
			['results', function() { Meteor.defer(function() { Guru.emit('stop'); }) }]
		];

		machine = new StateMachine(transitionTable);
		autorunHandle = ui.autorun(
		function() {
			game.state();
		},
		function() {
			machine.state([game.state()]);
		});
	}

	function stopAutorun() {
		autorunHandle && autorunHandle.stop();
		autorunHandle = null;
	}

	Guru.on('stop', function() {
		game && game.destroy();
		game = null;
		stopAutorun();
	})


})();