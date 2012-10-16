route('/create/tome/:id', route.requireSubscriptionById('Deck'), function(ctx) {
	var deck_id = ctx.params.id;
	var deck = Decks.findOne(ctx.params.id);

	Template.form_dialog.form = function() {
		console.log('form dialog helper');
		var dialog = ui.get('.dialog');
		var form = dialog.get('form');
		console.log(form);
		return Template[form]({});
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

			Decks.update(deck_id,  {$set: set});
			var dialog = ui.get(template.find('.dialog'));
			dialog.hide();
		}
	}

	Template.tome_info_form.rendered= function() {
		gs.upload($(this.find('#image-upload')), function(err,data) {
			console.log("/upload/"+data.result.path);
			Decks.update(deck_id, {$set:  {image: "/upload/"+data.result.path}});
		});
	}

	Template.tome_info_form.events({
		'click .input': function(e) {
			var name = $(e.currentTarget).attr('id');
			var dialog = ui.get('.dialog');
			console.log(name + '_form');
			dialog.set('form', name + '_form');
			dialog.modal()
				.relative('#' + name, {top: 0, left: 0})
				.show();
		},
		'click .tome-scroll': function() {
			Decks.update(deck_id, { $pull: { cards: this._id } });
		},
		'click .big-tome': function() {
			$('#image-upload').click();
		}
	});

	var res = {
		title: 'Title',
		cardsPerGame: 'The number of cards each player must select',
		tags: 'Examples: Addition, Single Digit, Easy...',
		description: 'Provide a more detailed description of this tome so people know what to expect'
	}

	Template.tome_info_form.helpers({
		scrollsInTome: function() {
			var deck = Decks.findOne(deck_id);
			if(deck.cards)
				return Cards.find(deck.cards, {sort: {title: 1}});
		},
		points: function() {
			return Math.round(Stats.points(Stats.regrade(this._id)));
		},
		hasProperty: function(name) {
			var prop = Decks.findOne(deck_id)[name];
			return prop ? prop : '<span style="color: #999">' + res[name] + '</span>';
		},
		tome: function() {
			return Decks.findOne(deck_id, {fields: ['image']});
		}
	})
	
	Template.create.destroyed = function() {
		var thisDeck = Decks.findOne(deck_id);
		if(isEmptyDeck(deck_id))
			Decks.remove(ctx.params.id);
		else if(!thisDeck.cards)
			Decks.update(deck_id, {$set: {status: 'draft'}});
		else if(thisDeck.cards.length === 0)
			Decks.update(deck_id, {$set: {status: 'draft'}});
	}

	Template.scroll_select.helpers({
		scrolls: function() {
			return Cards.find({}, {sort: {title: 1}});
		},
		scrollsNotInTome: function() {
			var deck = Decks.findOne(deck_id);
			if (!deck.cards)
				return true;
			else
				return deck.cards.indexOf(this._id) === -1 && this.status === 'published';
		},
		points: function() {
			return Math.round(Stats.points(Stats.regrade(this._id)));
		}
	});

	Template.scroll_select.events({
		'click .available-scroll': function() {
			Decks.update(deck_id, { $push: { cards: this._id } });
		}
	});

	view.render('create');

});

function isEmptyDeck(id) {
	var deck = Decks.findOne(id);
	if(!deck) return true;

	var keys = _.keys(deck);
	keys = _.without(keys,'_id','type', 'username');
	if (_.all(keys, function(key) {return !deck[key];}))
		return true;
	else
		return false;
}


// route('/deck/create', function(){
// 	Template.my_collection.events({
// 		'click .deck-container': function(e) {
// 			var dialog = ui.get('.dialog');
// 	 		dialog.set('currentDeck', this);
// 	 		dialog.closable().overlay().center().show();
// 	 	}
// 	});


// 	Template.my_collection.helpers({
// 		'decks': function() {
// 			return Decks.find({});
// 		},
// 		'isPublished': function() {
// 			if(this.status !== 'published')
// 				return 'draft'
// 			else
// 				return '';
// 		},
// 		'cards': function() {
// 			return Cards.find({});
// 		}
// 	});

// 	Template.collection_more.helpers({
// 		'card': function() {
// 			var dialog = ui.get('.dialog');
// 			return dialog.get('currentDeck');
// 		},
// 		'isDeck': function() {
// 			return this.type === 'deck';
// 		}
// 	});

// 	Template.collection_more.events({
// 		'click .delete-button': function() {
// 			if(this.type === 'deck')
// 				Decks.remove(this._id);

// 			ui.get('.dialog').hide();
// 		},
// 		'click .edit-button': function() {
// 			route('/' + this.type + '/edit/' + this._id);
// 		}
// 	});

// 	view.render('edit_collection');
// });



// route('/create/tome/:id', route.requireSubscriptionById('Deck'), function(ctx) {
// 	var deck_id = ctx.params.id;
// 	var deck = Decks.findOne(ctx.params.id);

// 	view.render('create');

// 	Template.tome_info_form.init_form = function() {
// 		return {component: 'form', id: 'info_form'}
// 	}

// 	Template.tome_info_form.created = function() {

// 		ui.onID('info_form', function(form) {
// 			form.onSet('tags', function(tags) {
// 				if (_.isArray(tags))
// 					return tags.join(', ');
// 				else
// 					return tags;
// 			});
// 			form.onGet('tags', function(tags) {
// 				if (!tags) return;
// 				return _.map(tags.split(','), function(tag) {
// 					return tag.trim();
// 				});
// 			});
			
// 		});
		
// 	}

// 	Template.tome_info_form.rendered= function() {
// 		var form = ui.byID('info_form');
// 		gs.upload($(this.find('#image-upload')),function(err,data) {
// 			form && form.setField('image', "/upload/"+data.result.path);
// 		});

// 		if (this.firstRender)  {
// 			form.setFields(deck);
// 			ui.autorun(function() {
// 				Decks.update(ctx.params.id, {$set: form.getFields()});
// 			});
// 		}
// 	}

// 	Template.create.destroyed = function() {
// 		var thisDeck = Decks.findOne(deck_id);
// 		if(isEmptyDeck(deck_id))
// 			Decks.remove(ctx.params.id);
// 		else if(!thisDeck.cards)
// 			Decks.update(deck_id, {$set: {status: 'draft'}});
// 		else if(thisDeck.cards.length === 0)
// 			Decks.update(deck_id, {$set: {status: 'draft'}});

// 	}

// 	Template.tome_preview.events({
// 		'click #save-deck': function(e) {
// 			if(isEmptyDeck(deck_id))
// 				alert('Please fill out the form before you continue');
// 			else 
// 				route('/deck/edit/' + ctx.params.id + '/select-cards');
// 		}
// 	});

// 	Template.tome_preview.helpers({
// 		'deck': function() {
// 			var form = ui.byID('info_form');
// 			return form.getFields();
// 		}
// 	});
// });


// route('/deck/edit/:id/select-cards', route.requireSubscriptionById('Deck'), function(ctx) {
// 	var deck_id = ctx.params.id;
// 	var deck = Decks.findOne(deck_id);

// 	if(isEmptyDeck(deck_id))
// 		route.redirect('/deck/edit/' + ctx.params.id);
// 	else
// 		view.render('deck_cards_select');


// 	Template.deck_cards_select.destroyed = function() {
// 		var thisDeck = Decks.findOne(deck_id);
// 		if(isEmptyDeck(deck_id))
// 			Decks.remove(ctx.params.id);
// 		if(!thisDeck.cards)
// 			Decks.update(deck_id, {$set: {status: 'draft'}});
// 		else if(thisDeck.cards.length === 0)
// 			Decks.update(deck_id, {$set: {status: 'draft'}});
// 	}

// 	Template.deck_selected_cards.helpers({
// 		'deck': function() {
// 			return deck;
// 		},
// 		'deck-cards': function() {
// 			deck = Decks.findOne(ctx.params.id);
// 			if(deck.cards)
// 				return Cards.find(deck.cards);
// 		}
// 	});

// 	Template.deck_selected_cards.events({
// 		'click .deck': function() {

// 		},
// 		'click .selected-card': function() {
// 			Decks.update(ctx.params.id, { $pull: { cards: this._id } });
// 		}
// 	});

// 	Template.deck_cards_grid.helpers({
// 		'cards': function() {
// 			return Cards.find();
// 		},
// 		'notInDeck': function() {
// 			var deck = Decks.findOne(ctx.params.id);
// 			if (!deck.cards)
// 				return true;
// 			else
// 				return deck.cards.indexOf(this._id) === -1 && this.status === 'published';
// 		}
// 	});

// 	Template.deck_cards_grid.events({
// 		'click .card': function() {
// 			Decks.update(ctx.params.id, { $push: { cards: this._id } });
// 		}
// 	});

// 	Template.deck_cards_select.events({
// 		'click #save-button': function() {
// 			route.redirect('/deck/edit/' + deck_id);
// 		},
// 		'click #save-deck.publish': function() {
// 			var thisDeck = Decks.findOne(deck_id);
// 			if(!thisDeck.cards)
// 				Decks.update(deck_id, {$set: {status: 'draft'}});
// 			else if(thisDeck.cards.length === 0) {
// 				alert('you need to assign cards to a deck before you publish it');
// 				Decks.update(deck_id, {$set: {status: 'draft'}});
// 			}
// 			else 
// 				Decks.update(deck_id, {$set: {status: 'published'}});
// 			route.redirect('/deck/create');
// 		}
// 	});

// });

// function isEmptyDeck(id) {
// 	var deck = Decks.findOne(id);
// 	if(!deck) return true;

// 	var keys = _.keys(deck);
// 	keys = _.without(keys,'_id','type', 'username');
// 	if (_.all(keys, function(key) {return !deck[key];}))
// 		return true;
// 	else
// 		return false;
// }


