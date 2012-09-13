;(function(){
  route('/game/:id', 
  	function(ctx, next) {
 			Meteor.subscribe('game', ctx.params.id, next);
  	},
  	function(ctx, next) {
  		var game = Games.findOne(ctx.params.id);
  		Meteor.subscribe('userDeckInfo', game.users, game.deck, next);
  	},
  	function(ctx, next) {
  		//XXX do in parallel
  		Meteor.subscribe('gradeStats', next);
  	},
  	function(ctx){
  		var game = null
  			, stateMachineHandle = null
  			, game_id = ctx.params.id;
  		
			Template.game.created = function() {
				var self = this;
				game = new Game(game_id);
				game.start();

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


			}

			Template.game.destroyed = function() {
				stateMachineHandle && stateMachineHandle.stop();
  			stateMachineHandle = null;

  			game && game.stop();
  			game = null;
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


  		//XXX if you could access a parent template vars this would be unnecessary
  		var selected_cards = null;
  		/*
  			Cards select template helpers and events
  		*/
  		Template.cards_select.created = function() {
  			var self = this;
				self.opponent = game.opponent();

				self.deck = game.deck();
				self.deck_cards = Cards.find(this.deck.cards).fetch();

				selected_cards = new ReactiveDict();

				_.each(this.deck_cards, function(card) {
					selected_cards.set(card._id,0);
				});

				routeSession.set('selectionsLeft', game.nCards());
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
					var cards = [];
					_.each(selected_cards.all(), function(num, _id) {
						_.times(num, function() {
							cards.push(_id);
						});
					});
					Meteor.defer(function(){ game.problems(cards); });
				},
				'mousedown .card': function(evt, template) {
					if(evt.which === 1) {
						var data = this;
						template.handler = ui.down(template,function() {
							var numSelected = selected_cards.get(data._id);
							var selectionsLeft = routeSession.get('selectionsLeft')
							if (selectionsLeft) {
								selected_cards.set(data._id, numSelected + 1 );
								routeSession.set('selectionsLeft', selectionsLeft - 1);
								return true;
							}
						});
					}
				},
				'mousedown .selection-count': function(evt, template) {
					if(evt.which === 1) {
						var data = this;
						template.handler = ui.down(template,function() {
							var numSelected = selected_cards.get(data._id);
							var selectionsLeft = routeSession.get('selectionsLeft')
							if (numSelected > 0) {
								selected_cards.set(data._id, numSelected - 1 );
								routeSession.set('selectionsLeft', selectionsLeft + 1);
								return true;
							}
						});
						evt.preventDefault();
						evt.stopPropagation();
					}
				},

				'mouseup': function (evt, template) {
					template.handler && template.handler.up();
				}
			});

		Template.card_view.helpers({
				showStats: function() {
					if(game)
						return true;
				},
				stats: function() {
					return game.opponentCardStats(this._id);
				}
		});

		Template.stat_circle.helpers({
			rotate: function() {
				var deg = this.val*360;
				if(deg > 180)
					return ': rotate(180deg); width: 16px;';
				else
					return ': rotate(' + deg + 'deg);';  
			},
			rotateSecond: function() {
				var deg = this.val*360;
				return ': rotate(' + deg + 'deg);';
			},
			hide: function() {
				if(this.val*360 > 180)
					return 'clip: auto;';
				else
					return '';
			},
			prefix: function() {
				return transformPrefix;
			}
		});
		
		Template.num_selected.created = function() {
			this.ncards = game.nCards();
		}

		Template.num_selected.helpers({
			nCards: function(ctx) {
				return ctx.template.ncards;
			},
			selected: function(ctx) {
				return ctx.template.ncards - routeSession.get('selectionsLeft');
			}
		});

		Template.card_selection_view.selectionCount = function() {
			return selected_cards.get(this._id);
		}


			/*
				Deck play template helpers and events
			*/
			Template.deck_play.created = function() {
				this.deck = game.deck();
				this.me = game.me();
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
	 			me: function(ctx) { return ctx.template.me; },
	 			opponent: function(ctx){ return ctx.template.opponent; },
	 			deck: function(ctx) { return ctx.template.deck; },
	 			message: function() {
	 				var dialog = ui.get('.dialog');
	 				var message = dialog.get('message');
	 				return Template[message] && Spark.isolate(Template[message]());
	 			}
	 		});

	 		var problemRendered = null;
	 		Template.problem_container.helpers({
	 			card: function() {
	 				problemRendered = (new Date()).getTime();
	 				return routeSession.get('cur_problem') || Meteor.defer(nextCard);
	 			}
	 		});

	 		Template.game_points.points = function() {
	 				console.log('game_points');
	 				return routeSession.get('myPoints') || 0;
	 		}

	 		Template.current_card.helpers({
	 			card: function() {
	 				return routeSession.get('cur_problem');
	 			}
	 		});

	 		Template.deck_play.events({
 				'click': function(e, template) {
 					$('#answer').focus();
 				},
 				'keypress': function(e, template) {
 					if(e.which === 13) {
 						clearTimeout(pointsTimeout);
						var res = game.answer(parseInt($('#answer').val(), 10)),
							problem = game.lastAnsweredProblem();

						var card = _.clone(Cards.findOne(problem.card_id));
						card.type = 'card';
						card.title = card.name;

						
						if(res) {
							console.log(problem.points, card.stats && card.stats.grade, 'points', game);
						}
						event({name: 'complete', time: problem.time},
							card,
							res ? 'correctly' : 'incorrectly'
							);

 						nextCard();
 						Meteor.defer(function(){ 
 							updatePoints();
 							$('#answer').focus(); 
 						});
 					}
 				}
	 		});

	 		var dur = 19;
	 		var inc = 1;
	 		var pointsTimeout = null;

	 		function updatePoints() {
	 			var el = document.getElementById('game-points');
 				var curPoints = parseInt(el.innerHTML, 10);
 				var endPoints = Math.round(game.points(game.me()._id));
 				var delta = endPoints - curPoints;

 				if(dur === 19) {
 					while(dur < 20) {
 					 inc++;
 					 dur = 500 / (delta / inc);
 					}
 				}

 				if(curPoints < endPoints) {
					curPoints += inc;
					//el.html(curPoints);
					el.innerHTML = curPoints;
					// XXX Switch to jQuery for setTimeout
					pointsTimeout = setTimeout(updatePoints, dur);
				} else {
					routeSession.set('myPoints', endPoints);
					dur = 19;
					inc = 1;
					clearTimeout(pointsTimeout);
				}
	 		}

	 		function percent(val, total) {
	 			return (val / total) * 100;
	 		}


	 		Template.progress_bar.rendered = function() {
	 			var self = this;
	 			if(self.firstRendered === false) return;
	 			self.nCards = game.nCards();

	 			self.firstRendered = false;
	 			var handle = ui.autorun(function(){
					var user = self.data._id === Meteor.user()._id ? 'me' : 'opponent';

 					animateProgress('#' + user);
 					function animateProgress(container) {
 						var answered = game.answered(self.data._id),
 							p = percent(answered, game.nCards());

 							console.log(user, 'animation start');
 						$(container + ' .fill').stop(true, false).animate({'height': p + '%'}, {
 							//step: function(height) {
 							//	self.animHeight = height;
 							//},
 							complete: function() {
 								console.log(user, 'animation done');
 								routeSession.set('answered_' + self.data._id, answered);
 						} });
 					}
	 			});

	 			self.onDestroy(function() {
	 				handle.stop();
	 			});
	 		}

		 	Template.progress_bar.progress = function(ctx) {
		 		//var user = this._id === Meteor.user()._id ? 'me' : 'opponent';
		 		//console.log(user, 'progress bar re-render');
		 		var answered = routeSession.get('answered_' + this._id);
		 		return percent(answered, ctx.template.nCards) + '%';
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
	 				var winner = game.winner();
	 				return winner && winner.username || 'TIE';
	 			}
	 		});

	 		Template.individual_results.helpers({
	 			round: function(points) {
	 				return Math.round(points);
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

 					Game.route(deckId, uid);
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
					return game.isCorrect(this) ? 'correct' : 'incorrect';
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
					return Math.round(Stats.levelPoints(Meteor.user().level) - Meteor.user().points);
				},
				pointsNeeded: function() {
					return Math.round(Stats.levelPoints(Meteor.user().level));
				}
			})

		 	view.render('game');
		});
})();