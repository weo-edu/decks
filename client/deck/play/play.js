;(function(){
  route('/game/:id', 
  	function(ctx, next) {
 			Meteor.subscribe('game', ctx.params.id, next);
  	},
  	function(ctx, next) {
  		var game = Games.findOne(ctx.params.id);
  		Meteor.subscribe('userDeckInfo', game.users, game.deck, function() {
  			if (!UserDeckInfo.findOne({user: Meteor.user()._id, deck: game.deck})) {
  				UserDeckInfo.insert({ 
  					user: Meteor.user()._id, 
  					deck: game.deck, 
  					mastery: {} 
  				});
  			}
  			next();
  		});
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

				game.initSelection();

				self.timer_el = null;
				function startTimer() {
					ui.timer(game.timeToSelect(), 500, function(time) {
						if (self.timer_el)
							self.timer_el.innerHTML = Math.floor(time / 1000);
					});
				}
				if (game.state() === 'card_select')
					startTimer();
				else
					game.on('card_select', startTimer);
			};

			Template.cards_select.destroyed = function() {
				game && game.destroySelection();
			}

			Template.cards_select.rendered = function() {
				if (this.firstRender) {
					if (!this.timer_el) 
						this.timer_el = this.find('.timer');
				}
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

			console.log('live');
			$('#select-screen .dialog, #select-screen .overlay').live('click', function() {
				console.log('click');
				$('#select-screen .dialog').addClass('puff', 500, function() {
					$(this).removeClass('puff');
				});
			});

			Template.cards_select.events({
				'click .play-button': function(e, template) {
					game.pickSelectedCards();
				},
				'click .randomize-button': function(e, template) {
					game.randomSelect(true);
				},
				'mousedown .card': function(evt, template) {
					if(evt.which === 1) {
						var data = this;
						template.handler = ui.down(template,function() {
							return game.incrementSelectedCard(data._id)
						});
					}
				},
				'mousedown .selection-count': function(evt, template) {
					if(evt.which === 1) {
						var data = this;
						template.handler = ui.down(template,function() {
							return game.decrementSelectedCard(data._id)
						});
						evt.preventDefault();
						evt.stopPropagation();
					}
				},

				'mouseup': function (evt, template) {
					template.handler && template.handler.up();
					template.handler = null;
				}
			});


  	var style = '',
  		innerStyle = '';

  	Template.problem_tracker.created = function() {
  		var numCards = game.nCards();

  			/*this.autoHandle = ui.autorun(function() {
	  			game.selectionsLeft();
	  		},
	  		function(){
	  			var numSelected = numCards - game.selectionsLeft();
	  			game.updatePlayer({numSelected: numSelected});
	  		});*/


  		this.opponentId = game.opponent()._id
  		this.myId = Meteor.user()._id

			var ratio = 1,
				width = 12,
				height = 16,
				trackerHeight = 160,
	  		trackerWidth = 52,
	  		totalHeight = 0,
	  		cols = 0,
	  		rows = 0;

			var totalHeight = getHeight();

			while(totalHeight > trackerHeight) {
			 	ratio = (trackerWidth / (++cols)) / width;
				width = Math.floor(ratio * width);
				height = Math.floor(ratio * height);
				totalHeight = getHeight(width, height, game.nCards());
			}

			innerStyle = 'style="height:' + (height - 1) +'px; width:' + (width - 1) +'px;"';

			if(width <= 1) {
				width = 1;
				innerStyle = 'style="height: ' + (height - 1) + 'px; width: 1px; margin: 0px"';
			}

			if(height <= 1) {
				height = 1;
				innerStyle = 'style="height: 1px; width: 1px; margin: 0px"';
			}

			style = 'style="height:' + height +'px; width:' + width +'px;"';
			
			function getHeight() { 
				cols = Math.floor(trackerWidth / width);
				rows = Math.ceil(game.nCards() / cols);
				return (rows * height);
			}
  	}

  	Template.problem_tracker.destroyed = function() {
  		this.autoHandle && this.autoHandle.stop();
  	}

		Template.problem_tracker.helpers({
			select: function() {
				return routeSession.equals('game_state', 'card_select') || routeSession.equals('game_state', 'await_join');
			},
			selected: function() {
				var str = '';
				var numSelected = game.player(_.without(game.game().users,this._id)).numSelected;
				var selected = ''
					
				for(var i = 0; i < game.nCards() ; i++) {
					selected = i < numSelected ? 'selected' : '';
					str += '<div class="little-card ' + selected + '" ' + style + '><div class="inner" '+ innerStyle +'></div></div>';
				}
					
				return  str;
			},
			tracker: function() {
				var problems = game.player(this._id).problems;
				var cur = currentProblem(problems);
				var arr = _.map(problems,function(p) {
					var c = '';
					if(p.answer !== undefined) {
						if(game.isCorrect(p))
							c = 'correct';
						else
							c = 'incorrect';
					}
					else if(cur && cur._id === p._id)
						c = 'current';

					return c;
				});

				return arr;
			},
			innerStyle: function() {
				return innerStyle;
			}
		});


		function currentProblem(cards) {
			var opponentProblem = null
			_.find(cards, function(p, i) {
						if(typeof p.answer === 'undefined') {
							opponentProblem = p;
							return true;
						}
					});
			return opponentProblem;
		}

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
		


		Template.card_selection_view.selectionCount = function() {
			return game.selectionCount(this._id);
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
	 				return Template[message] && Template[message]();
	 			}
	 		});

	 		var problemRendered = null;
	 		Template.problem_container.helpers({
	 			card: function() {
	 				problemRendered = (new Date()).getTime();
	 				return routeSession.get('cur_problem') || Meteor.defer(nextCard);
	 			}
	 		});


	 		var pointsEl = null;
	 		Template.game_points.rendered = function() {
	 			pointsEl = document.getElementById('game-points');
	 		}

	 		Template.game_points.points = function() {
	 				return routeSession.get('myPoints') || Math.round(game.points(game.me()._id));
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
							//console.log(problem.points, card.stats && card.stats.grade, 'points', game.game());
						}
						event({name: 'complete', time: problem.time},
							card,
							res ? 'correctly' : 'incorrectly'
							);

 						nextCard();

 						// animateLevel(game.me());

	 					var inc = 1;
				 		var pointsTimeout = null;
				 		var curPoints = parseInt(pointsEl.innerHTML, 10);
				 		var endPoints = Math.round(game.points(game.me()._id));
				 		var delta = endPoints - curPoints;

	 					var dur = 19;
		 				if(dur === 19) {
		 					while(dur < 20) {
		 					 inc++;
		 					 dur = 500 / (delta / inc);
		 					}
		 				}

				 		function stop() {
				 			template.pointsInterval && clearInterval(template.pointsInterval);
				 			template.pointsInterval = null;
				 		}

				 		stop();

				 		template.pointsInterval = setInterval(function() {
			 				if(curPoints < endPoints) {
								curPoints += inc;
								pointsEl.innerHTML = curPoints;
								// XXX Switch to jQuery for setTimeout
							} else {
								routeSession.set('myPoints', endPoints);
								stop();
							}
				 		}, dur);

 						Meteor.defer(function(){ 
 							$('#answer').focus(); 
 						});
 					}
 				}
	 		});

	 		function percent(val, total) {
	 			return (val / total) * 100;
	 		}


	 		// Template.progress_bar.rendered = function() {
	 		// 	var self = this;
	 		// 	if(self.firstRendered === false) return;
	 		// 	self.nCards = game.nCards();

	 		// 	self.firstRendered = false;
	 		// 	var handle = ui.autorun(function(){
				// 	var user = self.data._id === Meteor.user()._id ? 'me' : 'opponent';

 			// 		animateProgress('#' + user);
 			// 		function animateProgress(container) {
 			// 			var answered = game.answered(self.data._id),
 			// 				p = percent(answered, game.nCards());

 			// 			$(container + ' .fill').stop(true, false).animate({'height': p + '%'}, {
 			// 				//step: function(height) {
 			// 				//	self.animHeight = height;
 			// 				//},
 			// 				complete: function() {
 			// 					routeSession.set('answered_' + self.data._id, answered);
 			// 			} });
 			// 		}
	 		// 	});

	 		// 	self.onDestroy(function() {
	 		// 		handle.stop();
	 		// 	});
	 		// }

		 	// Template.progress_bar.progress = function(ctx) {
		 	// 	var answered = routeSession.get('answered_' + this._id);
		 	// 	return percent(answered, ctx.template.nCards) + '%';
		 	// }

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

			// Template.view_cards.rendered = function() {
			// 	$('#card-grid').layout({
			// 		rows: 2,
			// 		cols: 4
			// 	});
			// }

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
					var user = this.synthetic ? Meteor.user() : Meteor.users.findOne(this._id);
					return user.level%60;
				},
				stage: function(){
					var user = this.synthetic ? Meteor.user() : Meteor.users.findOne(this._id);
					var stage = Math.ceil((user.level+1)/60)
					if(stage % 2 == 0)
						return 'stage-' + (stage-1) + ' half';
					else 
						return 'stage-' + stage;
				},
				rotate: function() {
					var user = this.synthetic ? Meteor.user() : Meteor.users.findOne(this._id);
					var degs = getDegs(user);

					if(degs > 180)
						return ': rotate(180deg); width: 16px;';
					else
						return ': rotate(' + degs + 'deg);';  
				},
				rotateSecond: function() {
					var user = this.synthetic ? Meteor.user() : Meteor.users.findOne(this._id);
					var degs = getDegs(user);

					return ': rotate(' + degs + 'deg);';
				},
				hide: function() {
					var user = this.synthetic ? Meteor.user() : Meteor.users.findOne(this._id);
					var degs = getDegs(user);

					if(degs > 180)
						return 'clip: auto;';
					else
						return '';
				},
				prefix: function() {
					return transformPrefix;
				}
			});

			// function animateLevel(user) {
			// 	var degs = getDegs(user);
			// 	var who = 'me';
			// 	var firstSemi = $('#' + who + ' .first-semi');
			// 	var secondSemi = $('#' + who + ' .second-semi');
			// 	var inner = $('#' + who + ' .inner');
			// 	var levelEl = $('#' + who + ' .stat-circle .stage');

			// 	if(user.level !== parseInt(levelEl.html(), 10)) {
			// 		firstSemi.attr('style', '');
			// 		secondSemi.attr('style', '');
			// 		inner.css('clip', 'rect(0px, 30px, 30px, 15px)');
			// 		levelEl.html(user.level);
			// 	}

			// 	if(degs > 180) {
			// 		firstSemi.attr('style', transformPrefix + ': rotate(180deg); width: 16px;');
			// 		secondSemi.attr('style', transformPrefix + ': rotate(' + degs + 'deg)');
			// 		secondSemi.animate( { textIndent: degs },
			// 		{
			// 			step: function(now,fx) {
			// 				console.log(now);
			// 				if(now > 182)
			// 					inner.css('clip', 'auto');
			// 			}
			// 		});
			// 	} else {
			// 		firstSemi.attr('style', transformPrefix + ': rotate(' + degs + 'deg)');
			// 		secondSemi.attr('style', transformPrefix + ': rotate(' + degs + 'deg)');
			// 		inner.css('clip', 'rect(0px, 30px, 30px, 15px)');
			// 	}				
			// }

			function getDegs(user) {
					var levelPoints = Stats.levelPoints(user.level) - user.points;
					var levelPointsNeeded = Stats.levelPoints(user.level);
					return (levelPoints / levelPointsNeeded)*360;
			}

		 	view.render('game');
		});
})();