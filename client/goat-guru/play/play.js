;(function(){

  route('/game/:id',
  	route.requireSubscriptionById('game'),
  	route.requireSubscription('UserDeckInfo', 
  		function(ctx) {
  			return Games.findOne(ctx.params.id).users;
  		},
  		function(ctx) {
  			console.log('deck', Games.findOne(ctx.params.id).deck);
  			return Games.findOne(ctx.params.id).deck;
  		}
  	),
  	route.requireSubscription('Cards', function(ctx) {
  		return Decks.findOne(Games.findOne(ctx.params.id).deck).cards;
  	}),
  	route.requireSubscription('gradeStats'),
  	function(ctx) {
  		var game = null
  			, game_id = ctx.params.id
  			, gameCreated = new ReactiveVar(false);

  		console.log('route');
  		
			Template.game.created = function() {
				var self = this;
				game = new Game(game_id);
				gameCreated.set(true);
				console.log('game created');


				function showDialog(message) {
					console.log('show dialog', message);
					var dialog = ui.get('.dialog');
					if (!dialog) {
						console.warn('no dialog for message: ' + message);
						return;
					}
					dialog.set('message', message);
					dialog.await().modal().center().show();
				}

				self.showDialogWrap = function(message) {
					console.log('show dialog');
					if (self.firstRender) {
						self.onRender(function() {
							showDialog(message);
						})
					} else {
						showDialog(message);
					}						
				}

				self.hideDialog = function() {
					console.log('hide dialog');
					var dialog = ui.get('.dialog');
					if (dialog && dialog.isVisible())
						dialog.hide();

				}

				var dialogHandle = ui.autorun(function() {
					var dialog_state = game.dialogState();
					Meteor.defer(function() {
						console.log('defer dialog state');
	  				if (dialog_state)
	  					self.showDialogWrap(game.state().replace('.','_'));
	  				else {
	  					self.hideDialog();
	  				}
  				});

				});

				/*game.on('quit', function() {
					showDialogWrap('quit_overlay');
				});*/

				game.start();

				self.onDestroy(function() {
	  			game && game.stop();
	  			game = null;
	  			gameCreated.set(false);
	  			dialogHandle.stop();
				});
			}

  		/*
  			Game template helpers and events
  		*/
 			

  		Template.game.helpers({
  			renderGame: function() {
  				return Template[game.renderState()]();
  			}

  		});

  		Template.game_nav.helpers({
  			opponent: function(){
  				if (gameCreated.get())
						return game.opponent();
				}
  		})

  		Template.game_user.helpers({
  			isSynthetic: function() {
  				return this.synthetic;
  			}
  		})


  		//XXX if you could access a parent template vars this would be unnecessary
  		var selected_cards = null;
  		/*
  			Cards select template helpers and events
  		*/
  		Template.select_view.created = function() {
  			var self = this;
				self.opponent = game.opponent();
				self.deck = game.deck();
				self.deck_cards = Cards.find(this.deck.cards).fetch();

				game.initSelection();

				self.timer_el = null;
				function startTimer() {
					ui.timer(game.timeToSelect(), function(time) {
						if (self.timer_el)
							self.timer_el.innerHTML = Math.floor(time / 1000);
					});
				}
				if (game.mainState() === 'select')
					startTimer();
				else
					game.on('select', startTimer);
			};

			Template.select_view.destroyed = function() {
				game && game.destroySelection();
			}

			Template.select_view.rendered = function() {
				if (this.firstRender) {
					if (!this.timer_el) 
						this.timer_el = this.find('.timer');
				}
			}

			Template.select_view.helpers({
				opponent: function(ctx) {
					return ctx.template.opponent;
				},
				deck: function(ctx){
					return ctx.template.deck;
				},
				cards: function(ctx) {
					return ctx.template.deck_cards;
				}
			});

			Template.select_view.events({
				'click .play-button': function(e, template) {
					game.pickSelectedCards();
				},
				'click .randomize-button': function(e, template) {
					game.randomSelect(true);
				},
				'click .quit-button': function(e, template) {
					game.quit();
					route('/goat');
				},
				'mousedown .scroll-select-info': function(evt, template) {
					if(evt.which === 1) {
						var data = this;
						template.handler = ui.down(template,function() {
							return game.incrementSelectedCard(data._id)
						});
					}
				},
				'mousedown .subtract': function(evt, template) {
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
  		var numCards = game.nCards() * 2;

  		this.opponentId = game.opponent()._id
  		this.myId = Meteor.user()._id

			var ratio = 1,
				width = 32,
				height = 42,
				trackerHeight = 222,
	  		trackerWidth = 96,
	  		totalHeight = 0,
	  		cols = 0,
	  		rows = 0;

			var totalHeight = getHeight();

			while(totalHeight > trackerHeight) {
			 	ratio = (trackerWidth / (++cols)) / width;
				width = Math.floor(ratio * width);
				height = Math.floor(ratio * height);
				totalHeight = getHeight(width, height, game.nCards() * 2);
			}

			innerStyle = 'style="margin: 0 auto; height:' + (height - 5) +'px; width:' + (width - 5) +'px;"';

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
				rows = Math.ceil((game.nCards() * 2) / cols);
				console.log(cols, rows);
				return (rows * height);
			}
  	}

		Template.problem_tracker.helpers({
			select: function() {
				return game.mainState() === 'select';
			},
			selected: function() {
				// XXX Too slow with large numbers of cards
				var str = '';
				//var numSelected = game.player(_.without(game.get('users'),this._id)).numSelected;
				var numSelected = game.player(this._id).numSelected;
				var selected = ''
				for(var i = 0; i < game.nCards() ; i++) {
					selected = i < numSelected ? 'selected' : '';
					str += '<div class="little-scroll ' + selected + '" ' + style + '><div class="little-scroll-inner" '+ innerStyle +'></div></div>';
				}

				return  str;
			},
			tracker: function() {
				var cur = game.currentProblem(this._id);
				var problems = game.problems(this._id);
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
			},
			style: function() {
				return style;
			}
		});

		Template.scroll_select_view.helpers({
			myStats: function() {
				return game.myCardStats(this._id);
			},
			opponentStats: function() {
				return game.opponentCardStats(this._id);
			},
			selectionCount: function() {
				return game.selectionCount(this._id);
			}
		});

		Template.scroll_stat.helpers({
			height: function() {
				return (this.val * 100) + '%';
			},
			backgroundColor: function() {
				var p = (this.val * 100);
				var color = '#D31F2C';
				if ( p > 95)
					color = '#29ABE2';		
				else if (p > 75)
					color = '#52BF46';
				else if (p > 40)
					color = '#FED53A';

				return color;
			}
		});

		Template.scroll_select_table.helpers({
			opponent: function() {
				return game.opponent();
			}
		});

		Template.play_view_dialog.rendered = function() {
			console.log('play view dialog');
		}
		/*
			Deck play template helpers and events
		*/
		Template.play_view.created = function() {
			this.deck = game.deck();
			this.me = game.me();
			this.opponent = game.opponent();
	 	};

	 	Template.play_view.rendered = function() {
	 		$('#answer').focus();
	 	};

 		Template.play_view.helpers({
 			me: function(ctx) { return ctx.template.me; },
 			opponent: function(ctx){ return ctx.template.opponent; },
 			deck: function(ctx) { return ctx.template.deck; }
 		});

 		Template.play_view_dialog.helpers({
 			message: function() {
 				var dialog = ui.get('.dialog');
 				var message = dialog.get('message');
 				return Template[message] && Template[message]();
 			}
 		})

 		var problemRendered = null;
 		Template.problem_container.created = function() {
 			var self = this;

 			self.timer_el = null;
			function startTimer() {
				ui.timer(game.timeToPlay(), function(time) {
					if (self.timer_el)
						self.timer_el.innerHTML = Math.floor(time / 1000);
				});
			}

			if (game.state() === 'play.')
				startTimer();
			else
				game.on('play.', startTimer);

			this.alignProblem = function() {
 				$('#problem').css({
 					'margin-top': -(($('#problem').height() / 2))
 				});
 			}
 		}

 		Template.problem_container.rendered = function() {
 			console.log('problem_container rendered');
 			if (this.firstRender) {
 				if (!this.timer_el)
 					this.timer_el = this.find('.timer');
 			}

 			this.alignProblem();
 		}

 		Template.problem_container.helpers({
 			card: function() {
 				return game.currentProblem();
 			}
 		});


 		var pointsEl = null;
 		Template.game_points.rendered = function() {
 			pointsEl = document.getElementById('game-points');
 		}

 		Template.game_points.points = function() {
 				return routeSession.get('myPoints') || Math.round(game.points(game.me()._id));
 		} 

 		Template.game_multiplier.created = function() {
 			var self = this;
 			game.on('next', function() {
 				if (!self.interval)
 					self.speedUpdate();
 			});

 		}

 		Template.game_multiplier.rendered = function() {
 			if (this.firstRender) {
 				var self = this;
	 			//XXX shouldnt use spark for rendering of this
	 			var el = $("#speed-bar .inner-speed-bar");
	 			self.speedUpdate = function() {
	 				el.css({width: '100%'});
		 			el
		 				.stop(true,false)
		 				.animate({width: "0%"}, game.timeForBonus() * 1000, 'linear');	
		 		}
	 			self.speedUpdate();
 			}
 		}

 		Template.game_multiplier.helpers({
	 		multiplier: function() {
	 			var multiplier = utils.round(game.getMultiplier(),2);
	 			return multiplier ? ('x' + multiplier) : '';
 			}
 		}); 

 		Template.game_multiplier.destroyed = function() {
 			Meteor.clearInterval(this.interval);
 		}

 		Template.current_card.helpers({
      card: function() {
        return game.currentProblem();
      }
   	}); 

   	Template.play_view.rendered = function() {
   		console.log('play view rendered');
   	}


 		Template.play_view.events({
				'click': function(e, template) {
					$('#answer').focus();
				},
				'click .quit-button': function() {
					game.quit();
					route('/goat');
				},
				'keypress input': function(e, template) {
					if(e.which === 13 && game.state() !== 'play.waiting') {
					var res = game.answer(parseInt($('#answer').val(), 10));
					var problem = game.currentProblem();

					var card = _.clone(Cards.findOne(problem.card_id));
					card.type = 'card';

					event({name: 'complete', time: problem.time},
						card,
						{
							adverbs: res ? 'correctly' : 'incorrectly',
							groupId: game.id
						});

						game.nextProblem();

 					var inc = 1;
			 		var pointsTimeout = null;
			 		var curPoints = parseInt(pointsEl.innerHTML, 10);
			 		var endPoints = Math.round(game.points(game.me()._id));
			 		var delta = endPoints - curPoints;

			 		if (res) {
			 			var dur = 19;
	 					while(dur < 20) {
	 					 inc++;
	 					 dur = 500 / (delta / inc);
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
				 		
			 		} else {
			 			$('#bonus').attr('style', ' ').html(' ' + problem.solution).attr('class', 'error')
							.stop(true, false)
							.animate({
								'margin'		: 0,
								'opacity'		: 1, 
								'font-size'	: '80px'
							}, 0, 'easeOutSine')
							.delay(1000)
							.animate({
								'margin'		: 0,
								'font-size'	: '100px'
							}, 50, 'easeOutSine')
							.animate({
								'opacity'		: 0,
								'font-size'	: 0
							}, 80, 'easeInSine');
					}

					Meteor.defer(function(){ 
						$('#answer').focus(); 
					});
				}
			}
		});


		Template.play_continue.events({
			'click .end': function() {
				game.dispatch('end');
			},
			'click .continue': function() {
				game.dispatch('continue');
			}
		});

		Template.play_waiting.created = function() {
			var self = this;
			self.timer_el = null;
			function startTimer() {
				ui.timer(game.timeToPlay(), function(time) {
					if (self.timer_el)
						self.timer_el.innerHTML = Math.floor(time / 1000);
				});
			}

			if (game.state() === 'play.waiting')
				startTimer();
			else
				game.on('play.waiting', startTimer);
		}

		Template.play_waiting.rendered = function() {
 			if (this.firstRender) {
 				if (!this.timer_el)
 					this.timer_el = this.find('.timer');
 			}
 		}

	 	/*
	 		Results
	 	*/
	 
 	 	Template.results_view.helpers({
 			winner: function(ctx) {
 				var winner = game.winner();
 				return winner && winner.username || 'TIE';
 			}
	 	});

	 	Template.results_view.events({
	 		'click .rematch-button': function() {
	 			var deckId = game.deck()._id;
				var uid = game.opponent().synthetic ? game.me()._id : game.opponent()._id;

				Game.route(deckId, uid);
	 		}
	 	});
	 	

	 	Template.results_table.created = function() {
	 		this.results = game.results();
	 		this.me = game.me();
	 		this.opponent = game.opponent();
	 		this.bonuses = {
	 			me: game.breakdown(this.me._id), 
	 			opponent: game.breakdown(this.opponent._id)
	 		};
	 	}

	 	Template.results_table.helpers({
	 		results: function(ctx) {
 				return ctx.template.results;
 			},
 			// XXX ?
	 		opponentName: function() {
	 			return game.opponent().username;
	 		},
 			round: function(points) {
 				return Math.round(points);
 			},
 			bonuses: function() {
 				return Meteor.template.bonuses;
 			}
 		});

 	// 	Template.end_game.helpers({
 	// 		results: function(ctx) {
 	// 			return ctx.template.results;
 	// 		},
 	// 		opponent: function() {
 	// 			console.log('game',game.me());
 	// 			return game.opponent();
 	// 		},
 	// 		winner: function(ctx) {
 	// 			var winner = game.winner();
 	// 			return winner && winner.username || 'TIE';
 	// 		},
		// 	show_cards: function() {
		// 		return routeSession.get('show_cards');
		// 	},
 	// 		message: function() {
 	// 			var dialog = ui.get('.dialog');
 	// 			var message = dialog.get('message');
 	// 			return Template[message] && Template[message]();
 	// 		}
		// });

		// Template.end_game.events({
		// 		'click #results-nav .rematch': function() {
		// 			var deckId = game.deck()._id;
		// 			var uid = game.opponent().synthetic ? game.me()._id : game.opponent()._id;

		// 			Game.route(deckId, uid);
		// 		},
		// 		'click #results-nav .back': function() {
		// 			route('/');
		// 		},
		// 		'click #view-cards-nav .results': function(evt, template) {
		// 			$('#slider').removeClass('show-cards', 400, 'easeInOutExpo', function(){
		// 					routeSession.set('show_cards', '');
		// 			});
		// 		},
		// 		'click #results-nav .view-cards': function(evt, template) {
		// 			$('#slider').addClass('show-cards', 400, 'easeInOutExpo', function(){
		// 					routeSession.set('show_cards', 'show-cards');
		// 			});
		// 		} 
		// });

		// Template.individual_results.helpers({
 	// 		round: function(points) {
 	// 			return Math.round(points);
 	// 		}
 	// 	});

		Template.error_scroll.helpers({
			scrolls: function() {
				console.log(game.problems());
				return game.problems();
			},
			title: function() {
				return Cards.findOne(this.card_id).title;
			},
			correct: function() {
				return game.isCorrect(this);
			},
			review_card: function() {
				return routeSession.get('review_card');
			}
		});

		Template.error_scroll.events({
			'click .error-scroll': function(evt){
				console.log(evt, this)
				routeSession.set('review-scroll', this);
				ui.get('.dialog').closable().overlay().center().show();
			}
		});

		// Template.view_cards.events({
		// 	'click .card': function(evt, template) {
		// 		var self = this;
		// 		$('#slider').addClass('review', 400, 'easeInOutExpo', function(){
		// 				routeSession.set('review_card', self);
		// 				routeSession.set('show_cards', 'review');
		// 		});
		// 	}
		// });

		Template.solution_dialog.created = function() {
 			this.alignProblem = function() {
 				$('#problem').css({
 					'margin-top': -(($('#problem').height() / 2))
 				});
 			}
 		}

 		Template.solution_dialog.rendered = function() {
 			this.alignProblem();
 		}

		Template.solution_dialog.helpers({
			scroll: function() {
				var scroll = routeSession.get('review-scroll');
				return scroll;
			}
		})


		Template.select_dialog.helpers({
			init: function() {
				return {component: 'dialog'};
			},
			message: function(ctx) {
				var dialog = ui.get('.dialog');
				var message = dialog.get('message');
				return Template[message] && Template[message]();
			}
		});

	 	dojo.render('game', 'game_nav');
	});
})();