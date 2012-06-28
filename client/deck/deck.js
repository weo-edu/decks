route('/deck/browse',function() {
	Session.set('view','deck_browse');

	Template.deck_browse.decks = function() {
	  return Decks.find({});
	}

	Template.deck_browse.events = {
	  'click .deck': function() {
	    page('/deck/play/' + this.name);
	  }
	}

});


route('/deck/play/:name', function(ctx){
	Session.set('view','deck_play');
	var play_session = new _Session();
	var name = ctx.params.name;
	var game;

  Meteor.deps.await(
    function() {
      var deck = Decks.findOne({name: name});
      return  deck !== undefined;
    },
    function() {
      game = new Game(Decks.findOne({name: name}),3);
      play_session.set('card', game.nextCard());
    }
  );

  Template.deck_play.card = function(){
  	return play_session.get('card')
	}

	var events = {};
	events[util.okcancel_events('#solution')] = util.make_okcancel_handler({
	   	ok: function (value,evt) {
	  	  game.recordResult(game.isSolution(parseInt(value)));
	   	  var next_card = game.nextCard();
	   	  if (next_card) {
	   	    play_session.set('card',next_card);
	   	    evt.target.value = "";
	   	  }
	   	  else Session.set('view','deck_results');
	   	}
		});

	events['insert .card'] = function(e) {
		MathJax.Hub.Queue(["Typeset",MathJax.Hub,e.target]);
	};

	Template.deck_play.events = events;

  Template.deck_results.correct = function(){
	  return game.results.find({result: true}).count();
	}

  Template.deck_results.total = function(){ 
	  return game.results.find({}).count();
	};

	Template.deck_results.events = {
	  'click #decks-link': function() {
	    page('/');
	  }
	};
	
});