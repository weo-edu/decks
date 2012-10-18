route('/create/tome/:id', route.requireSubscriptionById('decks'), function(ctx) {
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
