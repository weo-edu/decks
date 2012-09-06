Template.create_menu.events({
	'click #deck-create': function() {
		Decks.insert({username: Meteor.user().username, type: 'deck'}, function(err,_id) {
			if (err) throw err;
			route('/deck/edit/' + _id);
		});
	},
	'click #card-create': function() {
		Cards.insert({username: Meteor.user().username, problem: {}, type: 'card'}, function(err,_id) {
			if (err) throw err;
			route('/card/edit/' + _id);
		});
	},
	'click #my-collection': function() {
		route('/deck/create');
	}
});
	



route('/deck/create', function(){

	Template.edit_collection.rendered = function() {
		console.log(this);
	}

	Template.my_decks.events({
		'click .deck-container': function(e) {
			var dialog = ui.get('.dialog');
	 		dialog.set('currentDeck', this);
	 		dialog.closable().overlay().center().show();
	 	}
	});

	Template.my_cards.events({
		'click .deck-container': function(e) {
			var dialog = ui.get('.dialog');
	 		dialog.set('currentDeck', this);
	 		dialog.closable().overlay().center().show();
	 	}
	});

	Template.my_decks.helpers({
		'decks': function() {
			return Decks.find({});
		}
	});

	Template.my_cards.helpers({
		'cards': function() {
			return Cards.find({});
		}
	});

	Template.collection_more.helpers({
		'card': function() {
			var dialog = ui.get('.dialog');
			return dialog.get('currentDeck');
		},
		'isDeck': function() {
			return this.type === 'deck';
		}
	});

	Template.collection_more.events({
		'click .delete-button': function() {
			// if(this.type === 'card') {
			// 	console.log('delete card', this);
			// 	Cards.remove(this._id);
			// }
			// else 
			if(this.type === 'deck')
				Decks.remove(this._id);

			ui.get('.dialog').hide();
		},
		'click .edit-button': function() {
			route('/' + this.type + '/edit/' + this._id);
		}
	});

	view.render('edit_collection');

});



route('/deck/edit/:id', route.requireSubscription('decks'),
function(ctx) {

var deck = Decks.findOne(ctx.params.id);
console.log('deck',deck);


Template.deck_info_form.init_form = function() {
	return {component: 'form', id: 'info_form'}
}

Template.deck_info_form.rendered= function() {
	console.log('rendered');
	var form = ui.byID('info_form');
	if(form) form.setFields(deck);
	gs.upload($(this.find('#image-upload')),function(err,data) {
  		form.setField('image', "/upload/"+data.result.path);
  	});

	ui.autorun(function() {
		Decks.update(ctx.params.id, {$set: form.getFields()});
	});
}


Template.deck_edit.events({
	'click #save-deck': function(e) {
		route('/deck/edit/' + ctx.params.id + '/select-cards');
	}
});

Template.deck_edit.helpers({
	'deck': function() {
		var form = ui.byID('info_form');
		return form.getFields();
	}
});

	view.render('deck_edit_info');

});




route('/deck/edit/:id/select-cards', route.requireSubscription('decks'),
function(ctx) {
	
	var deck = Decks.findOne(ctx.params.id);

	Template.deck_selected_cards.helpers({
		'deck': function() {
			return deck;
		},
		'deck-cards': function() {
			deck = Decks.findOne(ctx.params.id);
			if(deck.cards)
				return Cards.find(deck.cards);
		}
	});

	Template.deck_selected_cards.events({
		'click .selected-card': function() {
			Decks.update(ctx.params.id, {$pull: {cards: this._id}});
		}
	});

	Template.deck_cards_grid.helpers({
		'cards': function() {
			deck = Decks.findOne(ctx.params.id);
			return Cards.find({_id: {$nin: deck.cards}});
		}
	});

	Template.deck_cards_grid.events({
		'click .card': function() {
			Decks.update(ctx.params.id, {$push: {cards: this._id}});
		}
	});

	

	view.render('deck_cards_select');

});

