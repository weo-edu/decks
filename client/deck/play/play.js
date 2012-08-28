;(function(){
	var game = null;


  route('/game/:id', 
  	function(ctx, next) {
 			Meteor.subscribe('game', ctx.params.id, next);
  	},
  	function(ctx){
  		game = new Game(ctx.params.id);

			Template.game.created = function() {
				Game.emit('create', this, game);

				function showDialog(message) {
					var dialog = ui.get('.dialog');
					dialog.set('message', message);
					dialog.overlay().center().show();
				}

				var machine = new StateMachine(
					[
						['await_select', 'await_select'],
						['await_results', 'await_results']
					],
					_.bind(showDialog, window)
					);

				var handle = ui.autorun(function() {
					machine.state([game.mystate()]);
				});

				this.onDestroy(function() {
					handle && handle.stop();
					handle = null;

					game && game.destroy();
					game = null;
				});
			}

  		/*
  			Game template helpers and events
  		*/
 			var stateTemplateMap = {
 				'await_join': 'cards_select',
 				'card_select': 'cards_select',
 				'await_select': 'select_wait',
 				'play': 'deck_play',
 				'results': 'end_game'
 			};

  		Template.game.helpers({
  			state: function() {
  				console.log('state rendering', game.state());
  				return stateTemplateMap[game.state()];
  			}
  		});

  		Template.user.select = function() {
  			return Session.equals('game_state', 'card_select') || Session.equals('game_state', 'await_join');
  		}


  		/*
  			Cards select template helpers and events
  		*/
  		Template.cards_select.created = function() {
  				this.cards = [];
  				this.opponent = game.opponent();
  				this.nCards = game.nCards();
  				this.deck = game.deck();
  				this.deck_cards = Cards.find(this.deck.cards).fetch();
			};

			Template.cards_select.rendered = function() {
				$('#card-grid').layout({
					rows: 2,
					cols: 4
				});
			}

			Template.cards_select.helpers( {
				opponent: function(){
					return this.template.opponent;
				},
				nCards: function() {
					return this.template.nCards;
				},
				deck: function(){
					return this.template.deck;
				},
				cards: function() {
					return this.template.deck_cards;
				},
				message: function(name) {
					var dialog = ui.get('.dialog');
					var message = dialog.get('message');
					return Template[message] && Template[message]();
				}
			});

			Template.cards_select.events({
				'click .play-button': function(e, template) {
					Meteor.defer(function(){ game.problems(template.cards); });
				},
				'click .card': function(e, template) {
					var self = this,
						el = $(e.currentTarget),
						container = el.parent(),
						numSelected = container.children('.select').length;

					if(numSelected === template.nCards && ! el.hasClass('select')) {
						var dialog = ui.get('.dialog');
						dialog.set('message', 'max_cards');
						dialog.closable().overlay().show().center();
					} else {
						template.cards.push(self._id);
						el.toggleClass('select');
						$('.chosen').html(container.children('.select').length);
					}
				}
			});


			/*
				Deck play template helpers and events
			*/
			Template.deck_play.created = function() {
				this.deck = game.deck();
				this.opponent = game.opponent();
		 	};

		 	Template.deck_play.destroyed = function() {
		 		Session.set('cur_problem', null);
		 	}

		 	function nextCard() {
		 		var p = game.problem();
		 		p && Session.set('cur_problem', p);
		 	}

	 		Template.deck_play.helpers({
	 			opponent: function(){ return this.template.opponent; },
	 			deck: function() { return this.template.deck; },
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
	 			}
	 		});

	 		Template.deck_play.events({
 				'click': function(e, template) {
 					$('#answer').focus();
 				},
 				'keypress': function(e, template) {
 					if(e.which === 13){
						game.answer(parseInt($('#answer').val(), 10));
						// var results = game.results();
						
						// var myProgress = (results.me.correct / results.me.total) * 100;

						// $('.user-1 .fill').animate({'height': myProgress + '%'});

						// console.log(myProgress);
 						nextCard();
 						Meteor.defer(function(){ $('#answer').focus(); });
 					}
 				}
	 		});

		 	Template.progress_bar.progress = function(ctx) {
		 		var results = game.results(ctx._id);
				var myProgress = (results.correct / results.total) * 100;
		 		return myProgress + '%';
		 	}

		 	/*
		 		Results
		 	*/
		 	Template.play_results.created = function() {
		 		this.results = game.results();
		 		this.opponent = game.opponent();
		 		this.me = game.me();
		 	}

	 		Template.play_results.helpers({
	 			results: function() {
	 				return this.template.results;
	 			},
	 			opponent: function() {
	 				return this.template.opponent;
	 			},
	 			winner: function() {
	 				if(this.template.results.me.correct == this.template.results.opponent.correct)
	 					return 'TIE';
	 				else
						return this.template.results.me.correct > this.template.results.opponent.correct 
							? this.template.me.username : this.template.opponent.username;
	 			},
	 			render: function() {
		 				//var myProgress = (this.template.results.me.correct / this.template.results.me.total) * 100;
		 				//var opponentProgress = (this.template.results.opponent.correct / this.template.results.opponent.total) * 100;
		 				//$('#you .fill').animate({'height': myProgress + '%'});
		 				//$('#opponent .fill').animate({'height': opponentProgress + '%'});
	 			}
	 		});


	 		Template.end_game.destroyed = function() {
	 			console.log('end_game destroyed');
	 			Session.set('show_cards', '');
	 		}

	 		Template.end_game.helpers({
				show_cards: function() {
					return Session.get('show_cards');
				}
			});

			Template.end_game.events({
 				'click #results-nav .rematch': function() {
 					var id = game.opponent().synthetic ? game.me()._id : game.opponent()._id;
  				route(Game.create(game.deck()._id, id).url());		  				
 				},
 				'click #results-nav .back': function() {
 					route('/');
 				},
 				'click #view-cards-nav .results': function(evt, template) {
 					$('#slider').removeClass('show-cards', 400, 'easeInOutExpo', function(){
 							Session.set('show_cards', '');
 					});
 				},
 				'click #results-nav .view-cards': function(evt, template) {
 					$('#slider').addClass('show-cards', 400, 'easeInOutExpo', function(){
 							Session.set('show_cards', 'show-cards');
 					});
 				} 
			});

			Template.view_cards.rendered = function() {
				console.log('layout review');
				$('#card-grid').layout({
					rows: 2,
					cols: 4
				});
			}

			Template.view_cards.helpers({
				cards: function() {
					console.log('cards helper');
					return game.problems();
				},
				correct: function() {
					return game.isCorrect(this._id) ? 'correct' : 'incorrect';
				},
				review: function() {
					return Session.get('review');
				},
				review_card: function() {
					return Session.get('review_card');
				}
			});

 			Template.view_cards.events({
				'click .card': function(evt, template) {
					var self = this
					$('#slider').addClass('review', 400, 'easeInOutExpo', function(){
							console.log('Setting review_card to: ', self);
							Session.set('review_card', self);
							Session.set('show_cards', 'review');
					});
				}
			});

	 		Template.play_results.events({
 				'click #results-nav .rematch': function(e, template) {
 					var id = game.opponent().synthetic ? game.me()._id : game.opponent()._id;
 					var newGame = Game.create(game.deck()._id, id);
 					var url = newGame.url();
 					newGame.destroy();
  				route(url);		  				
 				},
 				'click #results-nav .back': function(e, template) {
 					route('/');
 				}
 			});

			Template.review_problem.events({
				'click .review-back': function() {
					$('#slider').switchClass('review', 'show-cards', 400, 'easeInOutExpo', function(){
 							Session.set('show_cards', 'show-cards');
 					});
				},
				'click .solution': function() {
					alert(Session.get('review_card').solution);
				}
			});

		 	// })();

			view.render('game');
		});
})();