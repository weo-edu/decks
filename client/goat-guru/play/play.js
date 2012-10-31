;(function(){
  route('/game/:id',
  	route.requireSubscriptionById('game'),
  	route.requireSubscription('userDecks', 
  		function(ctx) {
  			return Games.findOne(ctx.params.id).users;
  		},
  		function(ctx) {
  			return Games.findOne(ctx.params.id).deck;
  		}
  	),
  	route.requireSubscription('decks', function(ctx) {
  		return Games.findOne(ctx.params.id).deck
  	}),
  	route.requireSubscription('cards', function(ctx) {
  		return Decks.findOne(Games.findOne(ctx.params.id).deck).cards;
  	}),
  	route.requireSubscription('gradeStats'),
  	function(ctx) {
  		var game = null
  			, game_id = ctx.params.id
  			, gameCreated = new ReactiveVar(false)
  			, curZebra = null;
  		
			Template.game.created = function() {
				var self = this;
				game = new Game(game_id);
				gameCreated.set(true);

				function showDialog(message) {
					var dialog = ui.get('.dialog');
					if (!dialog) {
						console.warn('no dialog for message: ' + message);
						return;
					}
					dialog.set('message', message);
					dialog.await().modal().center().show();
				}

				self.showDialogWrap = function(message) {
					if (self.firstRender) {
						self.onRender(function() {
							showDialog(message);
						})
					} else {
						showDialog(message);
					}						
				}

				self.hideDialog = function() {
					var dialog = ui.get('.dialog');
					dialog && dialog.isVisible() && dialog.hide();
				}

				var dialogHandle = ui.autorun(function() {
					var dialog_state = game.dialogState();
					Meteor.defer(function() {
	  				if (dialog_state)
	  					self.showDialogWrap(game.state().replace('.','_'));
	  				else {
	  					self.hideDialog();
	  				}
  				});
				});

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

  		Template.game_deck_stats.helpers({
  			rank: function() {
					var deckInfo = UserDeck.findOne({
  					user: Meteor.user()._id,
  					deck: game.deck()._id
  				});

  				return deckInfo && deckInfo.mastery ? deckInfo.mastery.rank : '';
  			}
  		});

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
				var timer = makeTimer(
					function() { return game.timeToSelect(); },
					function() { return self.timer_el; }
				);
				game.when('select', timer, true);
			};

			Template.select_view.destroyed = function() {
				game && game.destroySelection();
			}

			Template.select_view.rendered = function() {
				if (this.firstRender && ! this.timer_el) {
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
				'mousedown .select-scroll': function(evt, template) {
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

			this.innerStyle = 'margin: 0 auto; height:' + (height - 5) +'px; width:' + (width - 5) +'px;';

			if(width <= 1) {
				width = 1;
				this.innerStyle = 'height: ' + (height - 1) + 'px; width: 1px; margin: 0px';
			}

			if(height <= 1) {
				height = 1;
				this.innerStyle = 'height: 1px; width: 1px; margin: 0px';
			}

			this.style = 'height:' + height +'px; width:' + width +'px;';
			function getHeight() { 
				cols = Math.floor(trackerWidth / width);
				rows = Math.ceil((game.nCards() * 2) / cols);
				return (rows * height);
			}
  	}

		Template.problem_tracker.helpers({
			select: function() {
				return game.mainState() === 'select';
			},
			cards: function() {
				return _.range(game.nCards());
			},
			style: function(ctx) {
				return ctx.template.style;
			},
			innerStyle: function(ctx) {
				return ctx.template.innerStyle;
			},
			isSelected: function(uid) {
				return this < game.player(uid).numSelected ? 'selected' : '';
			},
			tracker: function() {
				var cur = game.currentProblem(this._id);
				var arr = _.map(game.problems(this._id), function(p) {
					var c = '';
					if(p.answer !== undefined) {
						c = game.isCorrect(p) ? 'correct' : 'incorrect';
					}
					else if(cur && cur._id === p._id)
						c = 'current';

					return c;
				});

				return arr;
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
					color = 'rgb(64, 202, 49)';		
				else if (p > 75)
					color = '#29ABE2';
				else if (p > 40)
					color = 'rgb(241, 205, 12)';

				return color;
			}
		});

		Template.scroll_select_table.helpers({
			opponent: function() {
				return game.opponent();
			}
		});

		Template.play_view_dialog.rendered = function() {
			// console.log('play view dialog');
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
	 		focusAnswer();
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
 		});

 		function makeTimer(tFn, elFn) {
 			return (function() {
 				ui.timer(tFn(), function(time) {
 					var el = elFn();
 					if(el)
	 					el.innerHTML = Math.floor(time/1000);
 				});
 			});
 		}

 		Template.problem_container.created = function() {
 			var self = this;
 			self.timer_el = null;

			var timer = makeTimer(
				function() { return game.timeToPlay(); }, 
				function() { return self.timer_el; }
			);
			game.when('play.', timer);
 		}

 		Template.problem_container.rendered = u.attach(function() {
 			if (this.firstRender) {
 				if (!this.timer_el)
 					this.timer_el = this.find('.timer');
 			}
 		}, _.bind(u.valign, null, '#problem'));

 		Template.problem_container.helpers({
 			html: function() {
 				var p = game.currentProblem();
 				if(p) {
	 				curZebra = new Zebra(p.zebra);
 					return curZebra.render(p.assignment);
 				}
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
 				Meteor.clearTimeout(self.resetTimeout);
 				self.speedUpdate();
 			});
 		}

 		Template.game_multiplier.rendered = function() {
 			var self = this;
 			if (self.firstRender) {
	 			//XXX shouldnt use spark for rendering of this
	 			var el = $("#speed-bar .inner-speed-bar");
	 			var totWidth = parseInt($('#speed-bar').width(), 10);
	 			(self.speedUpdate = function() {
	 				var mult = game.getMultiplier();
	 				
	 				if( mult > .5)
	 					mult = .5 + ((mult - .5) / 2);
	 				if( (mult + .25) >= 1 ) 
	 					mult = .75;

	 				var width = (mult + .25) * totWidth;
	 				el.width(width + 'px')
		 				.stop(true,false)
		 				.animate({width: "0px"}, game.timeForBonus() * 1000, 'linear');
		 			self.resetTimeout = Meteor.setTimeout(function() {
		 				game && game.resetMultiplier();
		 			}, game.timeForBonus() * 1000);
		 		})();
 			}
 		}

 		Template.game_multiplier.helpers({
	 		multiplier: function() {
	 			var mult = game.getMultiplier();
	 			if(mult >= 1)
	 				return 'third-mult';
	 			else if (mult >= .5)
	 				return 'second-mult';
	 			else if (mult >= .25)
	 				return 'first-mult';
	 			else
	 				return '';
 			}
 		}); 

 		Template.game_multiplier.destroyed = function() {
 			Meteor.clearTimeout(this.resetTimeout);
 		}

 		Template.current_card.helpers({
      card: function() {
        return game.currentProblem();
      }
   	}); 


 		function showCorrectAnswer(p) {
 			$('#bonus').attr('style', 'display: block;').html(' ' + p.solution).attr('class', 'error')
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
				}, 80, 'easeInSine')
				.animate({
					'display': 'none'
				}, 0);
 		}

 		function showPointIncrease() {
 			var self = this;
 			var curPoints = parseInt(pointsEl.innerHTML, 10),
 				endPoints = Math.round(game.points(game.me()._id));
 				inc = 1, dur = 19,
 				delta = endPoints - curPoints;

 			if (delta < 0)
 				throw new Error("negative delta");

			while(dur < 20) {
				inc++;
				dur = 500 / (delta / inc);
			}

			var stop = (function stop() {
	 			self.pointsInterval && clearInterval(self.pointsInterval);
	 			self.pointsInterval = null;
	 			return stop;
	 		})();

	 		self.pointsInterval = setInterval(function() {
 				if(curPoints < endPoints) {
					curPoints += inc;
					pointsEl.innerHTML = curPoints;
					// XXX Switch to jQuery for setTimeout
				} else {
					routeSession.set('myPoints', endPoints);
					stop();
				}
	 		}, dur);
 		}

 		function answerCurrent() {
			var p = game.currentProblem();
			if(! p) return;

			var outcome = game.answer(curZebra.answer());

			card = _.clone(Cards.findOne(p.card_id));
			
			card.type = 'card';
			event({ name: 'complete', time: p.time },
				card,
				{
					adverbs: outcome ? 'correctly' : 'incorrectly',
					groupId: game.id
				}
			);

			game.nextProblem();

			outcome ? 
				showPointIncrease.call(this) 
				: showCorrectAnswer.call(this, p);

			focusAnswer();
 		}

 		function focusAnswer() {
 			Meteor.defer(function() {
	 			$('.answer').focus();
	 		});
 		}

 		Template.play_view.events({
			'click': function(e, template) {
				focusAnswer();
			},
			'click .quit-button': function() {
				game.quit();
				route('/goat');
			},
			'click #continue-button': function(e, template) {
				answerCurrent.call(template);
			},
			'keypress input': function(e, template) {
				if(e.which === 13 && game.state() !== 'play.waiting') {
					answerCurrent.call(template);
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
			var timer = makeTimer(
				function() { return game.timeToPlay(); },
				function() { return self.timer_el; }
			);
			game.when('play.waiting', timer);
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


		Template.error_scroll.helpers({
			scrolls: function() {
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
			'click .error-scroll': function(e){
				routeSession.set('review-scroll', this);
				ui.get('.dialog').closable().overlay().center().show();
			}
		});

 		Template.solution_dialog.rendered = _.bind(u.valign, null, '#problem');
		Template.solution_dialog.helpers({
			html: function(ctx) { 
				var s = routeSession.get('review-scroll');
				curZebra = new Zebra(s.zebra);
				game.zebra = curZebra;
				return curZebra.render(s.assignment);
			},
			solution: function(ctx) {
				var s = routeSession.get('review-scroll');
				if(! curZebra.showSolution(s.solution))
					return s.solution;
			}
		});

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