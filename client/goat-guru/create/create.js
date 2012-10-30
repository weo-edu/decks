/**
 * Tome Create
 */

route('/tome/:username/:id/edit', 
	route.requireSubscription(
		'deckByName',
		function(ctx) {
			return ctx.params.username;
		},
		function(ctx) {
			return parseInt(ctx.params.id);
		}
	), 
	function(ctx) {

	// username namespace unique id
	var id = parseInt(ctx.params.id);
	var username = ctx.params.username;

	var deck = Decks.findOne({creatorName: username, id: id});

	// gloabl unique id
	var deck_id = deck._id;

	Meteor.subscribe('cards', deck.cards);

	routeSession.set('active', 'info');

	Template.create.helpers({
		active: function(name) {
			return routeSession.get('active');
		}
	});

	Template.tome_create_header.helpers({
		'title': function() {
			return Decks.findOne(deck_id).title || 'Untitled';
		}
	});

	Template.tome_create_header.events({
		'click .scroll-info-nav.tabs li': function(evt) {
			routeSession.set('active', $(evt.currentTarget).attr('id'));
		},
		'click #done': function() {
			route('/inventory');
		},
		'click #delete': function() {
			if(confirm('Are you sure you want to delete this tome?')) {
				route('/inventory');
				Decks.remove(deck_id);	
			}
		},
		'click #publish': function(e) {
			if(isDeckComplete() === true) {
				if(confirm('Are you sure you want to publish? Once this is done you will not be able to delete or edit this tome.')) {
					Decks.update(deck_id, {$set: {status: 'published'}})
					route('/inventory');	
				}
			} else {
				alert(isDeckComplete());
			}
		}
	});

	Template.form_dialog.form = function() {
		var form = ui.get('.dialog').get('form');
		return Template[form]({});
	}

	//XXX find somewhere else for this to go (maybe Decks)
	function keywordsForDeck(deckId) {
		var deck = Decks.findOne(deckId);
		var keywords = nlp.keywords(
			(deck.tags || '') + 
			' ' + 
			(deck.title || '')  + 
			' ' + 
			(deck.description || '') +
			' ' + 
			(deck.creatorName || '')
		);
		Decks.update(deckId, {$set: {'search.keywords': keywords}});
	}

	Template.form_dialog.events = {
		'click .cancel': function(evt,template) {
			var dialog = ui.get(template.find('.dialog'));
			dialog.hide();
		},
		'click .save': function(evt,template) {
			var form = ui.get(template.find('.form'));
			var key = $(template.find('input')).attr('name') || $(template.find('textarea')).attr('name');
			var vals = form.getFields();
			if (_.keys(vals).length === 1) {
				vals = vals[_.keys(vals)[0]];
			} else if (_.keys(vals).length === 0) {
				throw new Error('no values for form');
			}
			var set = {};
			set[key] = vals;
			set['updated'] = +new Date();
			Decks.update(deck_id,  {$set: set});
			keywordsForDeck(deck_id);
			var dialog = ui.get(template.find('.dialog'));
			dialog.hide();
		}
	}

	Template.tome_info_form.rendered= function() {
		gs.upload($(this.find('#image-upload')), function(err,data) {
			Decks.update(deck_id, {$set:  {image: "/upload/"+data.result.path}});
		});
	}

	Template.tome_info_form.events({
		'click .input': function(e) {
			var name = $(e.currentTarget).attr('id');
			var dialog = ui.get('.dialog');
			dialog.set('form', name + '_form');
			dialog.modal()
				.relative('#' + name, {top: 0, left: 0})
				.show();
		},
		'click .big-tome': function() {
			$('#image-upload').click();
		}
	});

	var res = {
		title: 'Untitled',
		cardsPerGame: 'The number of cards each player must select',
		tags: 'Example: Addition, Single Digit, Easy...',
		description: 'Provide a more detailed description of this tome so people know what to expect'
	}

	Template.tome_info_form.helpers({
		hasProperty: function(name) {
			var prop = Decks.findOne(deck_id)[name];
			return prop ? prop : '<span style="color: #999">' + res[name] + '</span>';
		},
		tome: function() {
			return Decks.findOne(deck_id, {fields: ['image']});
		}
	});

	Template.scroll_view.helpers({
		scrollsInTome: function() {
			var deck = Decks.findOne(deck_id);
			if(deck.cards)
				return Cards.find(deck.cards, {sort: {title: 1}});
		}
	});

	Template.scroll_view.events({
		'click .scroll-info-view': function() {
			Decks.update(deck_id, { $pull: { cards: this._id } });
		}
	});

	Template.scroll_select.events({
		'click .scroll-info-view': function(e) {
			$(e.currentTarget).hasClass('in-tome') 
				? Decks.update(deck_id, { $pull: { cards: this._id } })
				: Decks.update(deck_id, { $push: { cards: this._id } });
		},
		'keyup .create-filter': function(evt) {
			var search = $(evt.target).val();
			routeSession.set('filter', search);
			Meteor.get('cardSearch', search);
		}
	});

	Template.scroll_select_results.helpers({
		scrolls: function() {
			if (!routeSession.get('filter'))
				return;
			return Cards.find({status: 'published', 'search.keywords': routeSession.get('filter') }, {sort: {plays: -1}});
		}
	});

	Template.scroll_info_view.helpers({
		points: function() {
			return Math.round(Stats.points(Stats.regrade(this._id)));
		},
		hasPlays: function() {
			return this.plays || 0;
		},
		scrollsInTome: function() {
			var deck = Decks.findOne(deck_id);
			if(deck.cards)
				return deck.cards.indexOf(this._id) === -1 && this.status ? '' : 'in-tome'
		}
	})

	Template.create.destroyed = function() {
		isEmptyDeck(deck_id) && Decks.remove(ctx.params.id);
	}

	dojo.render('create');

	function isDeckComplete() {
		var deck = Decks.findOne(deck_id);
		if(!deck.title)
			return 'Please add a title.';
		else if(!deck.image)
			return 'Please upload an image for this tome.';
		else if(!deck.cardsPerGame)
			return 'Please add the number of scrolls per game.';
		else if(!deck.tags) 
			return 'Please add the categories that this tome falls into.';
		else if(!deck.description)
			return 'Please add a short descirption of this tome.';
		else if(!deck.cards || deck.cards.length <= 0)
			return 'Please add at least 1 scroll to this tome.';
		else
			return true;
	}

	function isEmptyDeck(id) {
		var deck = Decks.findOne(id);
		if(!deck) return true;

		var keys = _.keys(deck);
		keys = _.without(keys,'_id','type', 'creator', 'status');
		if (_.all(keys, function(key) {return !deck[key];}))
			return true;
		else
			return false;
	}

});

/**
 * Scroll Create
 */
var editor;
route('/scroll/:username/:id/edit', 
	route.requireSubscription(
		'cardByName',
		function(ctx) {
			return ctx.params.username;
		},
		function(ctx) {
			return parseInt(ctx.params.id);
		}
	), 
	function(ctx) {
	var username = ctx.params.username;
	// username namespaced unique id
	var id = parseInt(ctx.params.id);
	var card = Cards.findOne({creatorName: username, id: id});

	// global uniqu id
	var card_id = card._id;

	routeSession.set('active', 'info');

	//XXX clean this up
	//var editor = null;
	var emitter = new Emitter();
	function onEditor(cb) {
		if (editor)
			cb(editor);
		else
			emitter.once('editor', cb);
	}

	Template.scroll_editor.rendered = function() {
		if (this.firstRender) {
			scroad('/ace/ace.js', function() {
				var card = Cards.findOne(card_id);
				editor = ace.edit("ace-editor");
				emitter.emit('editor', editor);
				editor.setTheme("ace/theme/textmate");
				var session = editor.getSession();
				session.setMode("ace/mode/markdown");
				session.setTabSize(2);
				session.setUseWrapMode(true);
				session.setValue(card.zebra || "");
				setEditorHeight();
				$('#ace-editor').css({fontSize:'15px'});
				
			});
		}
	}
	
	function setEditorHeight() {
		$('#ace-editor').css({height: $(window).height() - 170});
	}
	
	Template.create_scroll.created = function() {
		onEditor(function(editor) {
			$(window).resize(setEditorHeight);
		});
	}

	Template.create_scroll.destroyed = function(){
		if(isEmptyCard(card_id)) 
			Cards.remove(ctx.params.id);
		Cards.update(card_id, {$set: {zebra: editor.getValue()}});
		$(window).unbind('resize', setEditorHeight);
	}

	Template.create_scroll.helpers({
		active: function(name) {
			return routeSession.get('active');
		}
	});

	var res = {
		title: 'Untitled',
		grade: 'Estimate the grade level of this scroll',
		tags: 'Example: Addition, Single Digit, Easy...',
		description: 'Provide a more detailed description of this scroll so people know what to expect'
	}

	Template.scroll_create_info.helpers({
		hasProperty: function(name) {
			var prop = Cards.findOne(card_id)[name];
			return prop ? prop : '<span style="color: #888">' + res[name] + '</span>';
		}
	})

	Template.scroll_create_header.helpers({
		'title': function() {
			return Cards.findOne(card_id).title || 'Untitled';
		}
	});

	Template.scroll_create_header.events({
		'click .scroll-info-nav.tabs li': function(evt) {

			routeSession.set('active', $(evt.currentTarget).attr('id'));
			if (routeSession.get('active') === 'editor') 
				onEditor(function() {
					editor.focus();
				});
			else {
				Cards.update(card_id, {$set: {zebra: editor.getValue()}});
			}
		},
		'click #done': function() {
			route('/inventory');
		},
		'click #delete': function() {
			if(confirm('Are you sure you want to delete this scroll?')) {
				route('/inventory');
				Cards.remove(card_id);
			}
		},
		'click #publish': function() {
			if(isCardComplete() === true) {
				if(confirm('Are you sure you want to publish? Once this is done you will not be able to delete or edit this scroll.')) {
					Cards.update(card_id, {$set: {status: 'published'}})
					route('/inventory');	
				}
			} else {
				alert(isCardComplete());
			}
		}
	});

	var context = null;
	Template.scroll_preview.helpers({
		html: u.attachDefer(function(ctx) {
			context = Meteor.deps.Context.current;

			ctx.template.p = problemize(Cards.findOne(card_id));
			ctx.template.z = new Zebra(ctx.template.p.zebra);
			return ctx.template.z.render(ctx.template.p.assignment);
		}, _.bind(u.valign, null, '#problem')),
		solution: function(ctx) {
			return ctx.template.p.solution;
		}
	});

	Template.scroll_preview.events({
		'keypress': function(e, tmpl) {
			if(e.which === 13) {
				var p = tmpl.p,
					z = tmpl.z;

				var text = verifier(p.solutionText, p.assignment)(z.answer(), p.solution)
						? 'correct' : 'incorrect';

				alert(text);
			}
		},
		'click .generate-button': function() {
			context && context.invalidate();
		}
	})
	
	/**
	 * Info Form
	 */

	Template.form_dialog.form = function() {
		var form = ui.get('.dialog').get('form');
		return Template[form]({});
	}

	//XXX find somewhere else for this to go (maybe Cards)
	function keywordsForCard(cardId) {
		var card = Cards.findOne(cardId);
		var keywords = nlp.keywords(
			(card.tags || '') + 
			' ' + 
			(card.title || '')  + 
			' ' + 
			(card.description || '') +
			' ' + 
			(card.creatorName || '')
		);
		Cards.update(cardId, {$set: {'search.keywords': keywords}});
	}

	Template.form_dialog.events = {
		'click .cancel': function(evt,template) {
			var dialog = ui.get(template.find('.dialog'));
			dialog.hide();
		},
		'click .save': function(evt,template) {
			var form = ui.get(template.find('.form'));
			var key = $(template.find('input')).attr('name') || $(template.find('textarea')).attr('name');
			var vals = form.getFields();
			if (_.keys(vals).length === 1) {
				vals = vals[_.keys(vals)[0]];
			} else if (_.keys(vals).length === 0) {
				throw new Error('no values for form');
			}
			var set = {};
			set[key] = vals;
			set['updated'] = +new Date();
			Cards.update(card_id,  {$set: set});

			keywordsForCard(card_id);

			
			var dialog = ui.get(template.find('.dialog'));
			dialog.hide();
		}
	}

	Template.scroll_create_info.events({
		'click .input': function(e) {
			var name = $(e.currentTarget).attr('id');
			var dialog = ui.get('.dialog');
			dialog.set('form', name + '_form');
			dialog.modal()
				.relative('#' + name, {top: 0, left: 0})
				.show();
		},
		'click .big-tome': function() {
			$('#image-upload').click();
		}
	});


	function isCardComplete() {
		var card = Cards.findOne(card_id);
		if(!card.title)
			return 'Please add a title.';
		else if(!card.grade) 
			return 'Please add the grade level that this scroll falls into.';
		else if(!card.tags) 
			return 'Please add the categories that this scroll falls into.';
		else if(!card.description)
			return 'Please add a short descirption of this scroll.';
		else
			return true;
	}

	function isEmptyCard(id) {
		var card = Cards.findOne(id);
		if(!card) return true;

		var keys = _.keys(card);
		keys = _.without(keys,'_id','type', 'creator', 'status');
		if (_.all(keys, function(key) {return !card[key];}))
			return true;
		else
			return false;
	}


	Template.zebra_info.created = function() {
		$.get('/packages/zebra/zebra.md.html', function(data) {
			routeSession.set('zebra_markdown', data);
		});
	}

	Template.zebra_info.helpers({
		zebra_markdown: function() {
			return routeSession.get('zebra_markdown');
		}
	});

	dojo.render('create_scroll');
});



