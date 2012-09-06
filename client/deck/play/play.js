;(function(){
	var game = null,
		stateMachineHandle = null;


  route('/game/:id', 
  	function(ctx, next) {
 			Meteor.subscribe('game', ctx.params.id, next);
  	},
  	function(ctx){
  		game && stopPlaying();
  		game = new Game(ctx.params.id);

  		function stopPlaying() {
  			stateMachineHandle && stateMachineHandle.stop();
  			stateMachineHandle = null;

  			game && game.destroy();
  			game = null;
  		}

			Template.game.created = function() {
				var self = this;
				Game.emit('create', self, game);

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

				stateMachineHandle = ui.autorun(function() {
					machine.state([game.mystate()]);
				});

				self.onDestroy(stopPlaying);
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
  				return game && stateTemplateMap[game.state()];
  			}
  		});

  		Template.user.select = function() {
  			return routeSession.equals('game_state', 'card_select') || routeSession.equals('game_state', 'await_join');
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
				opponent: function(ctx){
					return ctx.template.opponent;
				},
				nCards: function(ctx) {
					return ctx.template.nCards;
				},
				deck: function(ctx){
					return ctx.template.deck;
				},
				cards: function(ctx) {
					return ctx.template.deck_cards;
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

		 	Template.deck_play.rendered = function() {
		 		$('#answer').focus();
		 	};

		 	function nextCard() {
		 		var p = game.problem();
		 		p && routeSession.set('cur_problem', p);
		 	}

	 		Template.deck_play.helpers({
	 			opponent: function(ctx){ return ctx.template.opponent; },
	 			deck: function(ctx) { return ctx.template.deck; },
	 			message: function() {
	 				var dialog = ui.get('.dialog');
	 				var message = dialog.get('message');
	 				return Template[message] && Template[message]();
	 			}
	 		});

	 		var problemRendered = null;
	 		Template.problem_container.helpers({
	 			card: function() {
	 				Meteor.defer(function() {
	 					$('#problem-container').addClass('show', 0);
	 				});

	 				problemRendered = (new Date()).getTime();
	 				return routeSession.get('cur_problem') || Meteor.defer(nextCard);
	 			}
	 		});

	 		Template.deck_play.events({
 				'click': function(e, template) {
 					$('#answer').focus();
 				},
 				'keypress': function(e, template) {
 					if(e.which === 13) {
						var res = game.answer(parseInt($('#answer').val(), 10)),
							dTime = (new Date()).getTime() - problemRendered,
							problem = routeSession.get('cur_problem');

						var card = _.clone(Cards.findOne(problem.card_id));
						card.type = 'card';
						card.title = card.name;
						
						if(res) {
							regrade(card);
							console.log(displayPoints(card.stats.grade || card.grade), 'points');
						}
						event({name: 'complete', time: dTime},
							card,
							res ? 'correctly' : 'incorrectly'
							);

 						nextCard();
 						Meteor.defer(function(){ $('#answer').focus(); });
 					}
 				}
	 		});

	 		//Meteor.deps.Context.logInvalidateStack = true;

	 		function percent(val, total) {
	 			return (val / total) * 100;
	 		}

	 		Template.progress_bar.created = function() {
	 			var self = this;
	 			var handle = ui.autorun(function(){
					var user = self.data._id === Meteor.user()._id ? 'me' : 'opponent';

 					animateProgress('#' + user);
 					function animateProgress(container) {
 						var answered = game.answered(self.data._id),
 							p = percent(answered, game.nCards());

 						$(container + ' .fill').animate({'height': p + '%'}, function() {
 							routeSession.set('answered_' + self.data._id, answered);
 						});
 					}
	 			});

	 			self.onDestroy(function() {
	 				handle.stop();
	 			});
	 		}

		 	Template.progress_bar.progress = function(ctx) {
		 		var answered = routeSession.get('answered_' + this._id);
		 		return percent(answered, game.nCards()) + '%';
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
	 			results: function(ctx) {
	 				return ctx.template.results;
	 			},
	 			opponent: function(ctx) {
	 				return ctx.template.opponent;
	 			},
	 			winner: function(ctx) {
	 				if(ctx.template.results.me.correct === ctx.template.results.opponent.correct)
	 					return 'TIE';
	 				else
						return ctx.template.results.me.correct > ctx.template.results.opponent.correct 
							? ctx.template.me.username : ctx.template.opponent.username;
	 			}
	 		});



	 		Template.end_game.helpers({
				show_cards: function() {
					return routeSession.get('show_cards');
				}
			});

			Template.end_game.events({
 				'click #results-nav .rematch': function() {
 					var deckId = game.deck()._id;
 					var uid = game.opponent().synthetic ? game.me()._id : game.opponent()._id;

 					Meteor.defer(function() {
	 					var g = Game.create(deckId, uid);
	 					var url = g.url();
	 					g.destroy();
	 					stopPlaying();
	 					Guru.emit('stop');
  					Meteor.defer(function() { 
  						route(url);
  					});
  				});
 				},
 				'click #results-nav .back': function() {
 					route('/');
 				},
 				'click #view-cards-nav .results': function(evt, template) {
 					$('#slider').removeClass('show-cards', 400, 'easeInOutExpo', function(){
 							routeSession.set('show_cards', '');
 					});
 				},
 				'click #results-nav .view-cards': function(evt, template) {
 					$('#slider').addClass('show-cards', 400, 'easeInOutExpo', function(){
 							routeSession.set('show_cards', 'show-cards');
 					});
 				} 
			});

			Template.view_cards.rendered = function() {
				$('#card-grid').layout({
					rows: 2,
					cols: 4
				});
			}

			Template.view_cards.helpers({
				cards: function() {
					return game.problems();
				},
				image: function() {
					return Cards.findOne(this.card_id).image;
				},
				correct: function() {
					return game.isCorrect(this._id) ? 'correct' : 'incorrect';
				},
				review: function() {
					return routeSession.get('review');
				},
				review_card: function() {
					return routeSession.get('review_card');
				}
			});

 			Template.view_cards.events({
				'click .card': function(evt, template) {
					var self = this;
					$('#slider').addClass('review', 400, 'easeInOutExpo', function(){
							routeSession.set('review_card', self);
							routeSession.set('show_cards', 'review');
					});
				}
			});


			Template.review_problem.events({
				'click .review-back': function() {
					$('#slider').switchClass('review', 'show-cards', 400, 'easeInOutExpo', function(){
 							routeSession.set('show_cards', 'show-cards');
 					});
				},
				'click .solution': function() {
					alert(routeSession.get('review_card').solution);
				}
			});

			Template.level_progress.helpers({
				level: function() {
					return Meteor.user().level;
				},
				points: function() {
					return Math.round(pointsToNextLevel(Meteor.user().level) - Meteor.user().points);
				},
				pointsNeeded: function() {
					return Math.round(pointsToNextLevel(Meteor.user().level));
				}
			})

		 	view.render('game');
		});
})();