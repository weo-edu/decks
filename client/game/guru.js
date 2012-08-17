;(function(){
	var game = null;

	window.Guru = new Emitter;
	process.register('guru', Guru);

	Guru.goat = function(){
		return {_id: 1, username: 'Goat Guru', synthetic: true};
	}

	Guru.cards = function(){
		game.cards('random');
	}

	Guru.on('invite', function(e){
		game = new Game(e.object.body);
		game.opponent = function(){
			return Meteor.user();
		};

		Guru.cards();
	});
})();