(function(){
	var current_game;
	var Game = {
		create: function(){
			if(!Meteor.user())
				throw new Error('You must be logged in to create a game');
			if(current_game)
				throw new Error('You cannot create a new game until you exit the current one');

			current_game = Games.insert({creator: Meteor.user()._id, users: [Meteor.user()._id]});
		},
		request: function(user){
			user = User.lookup(user);
			if(user)
				message({to: user._id, subject: 'request:game', body: {game: current_game}});
		},
		destroy: function(){
			current_game = null;
		}
	}

	window.Game = Game;
})();