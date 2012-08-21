;(function(){
  route('/game/:id', 
  	function(ctx, next){
  		Game.gamesHandle = Games.gamesHandle || Meteor.subscribe('games',next);
  	},
  	function(ctx){
      var game = new Game(ctx.params.id);
  		
  		/*
  			Game template helpers and events
  		*/
  		;(function(){
  			var stateTemplateMap = {
  				'await_join': 'cards_select',
  				'card_select': 'cards_select',
  				'await_select': 'select_wait',
  				'play': 'deck_play',
  				'finished': 'game_finish'
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
  		;(function(){
  			var cards = [],
  				deck = game.deck(),
  				deck_cards = Cards.find(deck.cards).fetch(),
  				opponent = game.opponent();

				_.extend(Template.cards_select, {
					opponent: function(){
						return opponent;
					},
					deck: function(){
						Meteor.defer(function(){
							$('#card-grid').layout({
								rows: 2,
								cols: 4
							});
						});
						return deck;
					},
					cards: function(){
						return deck_cards;
					},
					events: {
						'click .play-button': function(e){
							Meteor.defer(function(){ game.cards(cards) });
						},
						'click .card': function(e) {
							var self = this;
							var el = $(e.currentTarget);
							var container = el.parent();
							var numSelected = container.children('.select').length;

							if(numSelected === 3 && ! el.hasClass('select')){
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

				_.extend(Template.select_wait, {
					cards: function(){
						game.cards() && game.state('play');
					}
				})
			})();

			/*
				Deck play template helpers and events
			*/
			;(function(){
				function nextCard(){
					Session.set('cur_problem', game.problem());
				}

				_.extend(Template.deck_play, {
		 			opponent: _.bind(game.opponent, game),
		 			deck: _.bind(game.deck, game),
		 			card: function(){
		 				Meteor.defer(function(){
		 					$('#problem-container').addClass('show', 0);
		 				});

		 				return Session.get('cur_problem') || nextCard();
		 			},
		 			events: {
		 				'click': function(){
		 					$('#answer').focus();
		 				},
		 				'keypress': function(e){
		 					if(e.which === 13){
		 						game.answer($('#answer').val());
		 						nextCard();
		 					}
		 				}
		 			}
		 		});
		 	})();

			view.render('game');
		}
	);
})();