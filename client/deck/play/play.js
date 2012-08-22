;(function(){
  route('/game/:id', 
  	function(ctx, next){
  		Game.gamesHandle = Games.gamesHandle || Meteor.subscribe('games',next);
  	},
  	function(ctx){
      var game = new Game(ctx.params.id);
  		
  		;(function localState() {
  			var ctx = new Meteor.deps.Context(),
	  			state = game.mystate();
	  		switch(state) {
	  			case 'await_select':
	  			{
	  				if(game.state() !== 'play') {
		  				Meteor.defer(function(){
		  					var dialog = ui.get('.dialog');
		  					dialog.set('message', 'await_select');
		  					dialog.overlay().center().show();
		  				});
		  			}
	  			}
	  			break;
	  			case 'await_results':
	  			{
	  				if(game.state() !== 'results') {
	  					Meteor.defer(function() {
	  						var dialog = ui.get('.dialog');
	  						dialog.set('message', 'await_results');
	  						dialog.overlay().center().show();
	  					});
	  				}
	  			}
	  			break;
	  		}

	  		ctx.run(function(){ game.mystate() } );
	  		ctx.on_invalidate(localState);
  		})();
  		
  		/*
  			Game template helpers and events
  		*/
  		;(function(){
  			var stateTemplateMap = {
  				'await_join': 'cards_select',
  				'card_select': 'cards_select',
  				'await_select': 'select_wait',
  				'play': 'deck_play',
  				'results': 'play_results'
  			};

  			_.extend(Template.game, {
  				state: function(){
  					return stateTemplateMap[game.state()];
  				}
  			});
  		})();

  		/*
  			Cards select template helpers and events
  		*/
  		;(function() {
  			var cards = [],
  				deck = game.deck(),
  				deck_cards = Cards.find(deck.cards).fetch(),
  				opponent = game.opponent(),
  				nCards = game.nCards();

				_.extend(Template.cards_select, {
					opponent: function(){
						return opponent;
					},
					deck: function(){
						Meteor.defer(function() {
							$('#card-grid').layout({
								rows: 2,
								cols: 4
							});
						});
						return deck;
					},
					cards: function() {
						return deck_cards;
					},
					message: function(name) {
						var dialog = ui.get('.dialog');
						var message = dialog.get('message');
						return Template[message] && Template[message]();
					},
					events: {
						'click .play-button': function(e) {
							Meteor.defer(function(){ game.problems(cards); });
						},
						'click .card': function(e) {
							var self = this,
								el = $(e.currentTarget),
								container = el.parent(),
								numSelected = container.children('.select').length;

							if(numSelected === nCards && ! el.hasClass('select')) {
								var dialog = ui.get('max_cards');
								dialog.context(self);
								dialog.closable().overlay().show().center();
							} else {
								cards.push(self._id);
								el.toggleClass('select');
								$('.chosen').html(container.children('.select').length);
							}
						}
					}
				});
			})();

			/*
				Deck play template helpers and events
			*/
			;(function() {
				var deck = game.deck();
				var opponent = game.opponent();

				function nextCard() {
					var p = game.problem();
					p && Session.set('cur_problem', p);
				}

				_.extend(Template.deck_play, {
		 			opponent: function(){ return opponent; },
		 			deck: function() { return deck; },
		 			card: function() {
		 				Meteor.defer(function() {
		 					$('#problem-container').addClass('show', 0);
		 				});

		 				return Session.get('cur_problem') || Meteor.defer(nextCard);
		 			},
		 			message: function() {
		 				var dialog = ui.get('.dialog');
		 				var message = dialog.get('message');
		 				return Template[message] && Template[message]();
		 			},
		 			events: {
		 				'click': function() {
		 					$('#answer').focus();
		 				},
		 				'keypress': function(e) {
		 					if(e.which === 13){
		 						game.answer(parseInt($('#answer').val(), 10));
		 						nextCard();
		 						Meteor.defer(function(){ $('#answer').focus(); });
		 					}
		 				}
		 			}
		 		});
		 	})();

		 	/*
		 		Results
		 	*/
		 	;(function() {
		 		_.extend(Template.play_results, {
		 			results: function() {
		 				return game.results();
		 			}
		 		});
		 	})();

			view.render('game');
		}
	);
})();