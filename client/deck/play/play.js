;(function(){
  route('/game/:id', 
  	function(ctx, next) {
  		if(Game.gamesHandle)
  			next();
  		else
  			Game.gamesHandle = Meteor.subscribe('game', ctx.params.id, next);
  	},
  	function(ctx){
      var game = new Game(ctx.params.id);
      console.log('game', game);
  		
  		function showDialog(message) {
  			console.log('test');
  			var dialog = ui.get('.dialog');
  			dialog.set('message', message);
  			dialog.overlay().center().show();
  		}

  		var machine = new StateMachine(
  			[['await_select', 'await_select'], ['await_results', 'await_results']],
  			_.bind(showDialog, window)
  			);
  		ui.autorun(function() {
  			machine.state([game.mystate()]);
  		/*	switch(game.mystate()) {
  				case 'await_select':
  				{
  					if(game.state() !== 'play') {
  						var dialog = ui.get('.dialog');
  						dialog.set('message', 'await_select');
  						dialog.overlay().center().show();
  					}
  				}
  				break;
  				case 'await_results':
  				{
  					if(game.state() !== 'results') {
  						var dialog = ui.get('.dialog');
  						dialog.set('message', 'await_results');
  						dialog.overlay().center().show();
  					}
  				}
  			}*/
  		});
 
  		/*
  			Game template helpers and events
  		*/
  		;(function(){
  			var stateTemplateMap = {
  				'await_join': 'cards_select',
  				'card_select': 'cards_select',
  				'await_select': 'select_wait',
  				'play': 'deck_play',
  				'results': 'end_game'
  			};

  			_.extend(Template.game, {
  				state: function(){
  					return stateTemplateMap[game.state()];
  				}
  			});
  		})();

  		Template.user.select = function() {
  			return Session.equals('game_state', 'card_select') || Session.equals('game_state', 'await_join');
  		}

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
					nCards: function() {
						return nCards;
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
		 			render: function() {
						var results = game.results();
						var myProgress = (results.me.correct / results.me.total) * 100;
						// $('.user-1 .fill').animate({'height': myProgress + '%'});
		 			},
		 			events: {
		 				'click': function() {
		 					$('#answer').focus();
		 				},
		 				'keypress': function(e) {
		 					if(e.which === 13){
								game.answer(parseInt($('#answer').val(), 10));
		 						nextCard();
		 						Meteor.defer(function(){ 
		 							$('#answer').focus(); 
		 						});
		 					}
		 				}

		 			}
		 		});
		 	})();

		 	Template.progress_bar.progress = function(ctx) {
		 		var results = game.results(ctx._id);
				var myProgress = (results.correct / results.total) * 100;
		 		return myProgress + '%';
		 	}

		 	/*
		 		Results
		 	*/
		 	;(function() {
		 		var results;
		 		_.extend(Template.play_results, {
		 			results: function() {
		 				results = game.results();
		 				return results;
		 			},
		 			opponent: function() {
		 				return game.opponent();
		 			},
		 			winner: function() {
		 				if(results.me.correct == results.opponent.correct)
		 					return 'TIE';
		 				else
							return results.me.correct > results.opponent.correct ? game.me().username : game.opponent().username;
		 			},
		 			render: function() {
			 				var myProgress = (results.me.correct / results.me.total) * 100;
			 				var opponentProgress = (results.opponent.correct / results.opponent.total) * 100;
			 				$('#you .fill').animate({'height': myProgress + '%'});
			 				$('#opponent .fill').animate({'height': opponentProgress + '%'});
		 			}
		 		});

				_.extend(Template.end_game, {
					show_cards: function() {
						return this.get('show_cards');
					},
					myCards: function(){
						return game.problems()
					},
					events: {
		 				'click #results-nav .rematch': function() {
		 					var id = game.opponent().synthetic ? game.me()._id : game.opponent()._id;
		  				route(Game.create(game.deck()._id, id).url());		  				
		 				},
		 				'click #results-nav .back': function() {
		 					route('/');
		 				},
		 				'click #results-nav .view-cards': function(evt, template) {
		 					template.set('show_cards', true);
		 				}
					}
				});

		 	})();


			view.render('game');
		}
	);
})();