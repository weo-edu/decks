Template.create_menu.events({
	'click #deck-create': function() {
		Decks.insert({username: Meteor.user().username, type: 'deck'}, function(err,_id) {
			if (err) throw err;
			route('/deck/edit/' + _id);
		});
	},
	'click #card-create': function() {
		Cards.insert({username: Meteor.user().username, type: 'card'}, function(err,_id) {
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

	}

	Template.my_collection.events({
		'click .deck-container': function(e) {
			var dialog = ui.get('.dialog');
	 		dialog.set('currentDeck', this);
	 		dialog.closable().overlay().center().show();
	 	}
	});

	// Template.my_cards.events({
	// 	'click .deck-container': function(e) {
	// 		var dialog = ui.get('.dialog');
	//  		dialog.set('currentDeck', this);
	//  		dialog.closable().overlay().center().show();
	//  	}
	// });

	Template.my_collection.helpers({
		'decks': function() {
			return Decks.find({});
		},
		'isPublished': function() {
			if(this.status === 'published')
				return '';
			else
				return 'draft';

		},
		'cards': function() {
			return Cards.find({});
		}
	});

	// Template.my_cards.helpers({
		
	// });

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



route('/deck/edit/:id', route.requireSubscription('decks'), isDeck,
function(ctx) {

var deck_id = ctx.params.id;
var deck = Decks.findOne(ctx.params.id);

view.render('deck_edit_info');

Template.deck_info_form.init_form = function() {
	return {component: 'form', id: 'info_form'}
}

Template.deck_info_form.created = function() {

	ui.onID('info_form', function(form) {
		form.onSet('tags', function(tags) {
			if (_.isArray(tags))
				return tags.join(', ');
			else
				return tags;
		});
		form.onGet('tags', function(tags) {
			if (!tags) return;
			return _.map(tags.split(','), function(tag) {
				return tag.trim();
			});
		});
		
	});
	
}

Template.deck_info_form.rendered= function() {
	var form = ui.byID('info_form');
	gs.upload($(this.find('#image-upload')),function(err,data) {
		form && form.setField('image', "/upload/"+data.result.path);
	});

	if (this.firstRender)  {
		form.setFields(deck);
		ui.autorun(function() {
			Decks.update(ctx.params.id, {$set: form.getFields()});
		});
	}
		


}

Template.deck_info_form.destroyed = function() {

}

Template.deck_edit_info.created = function() {
	// this.onDestroy(function() {
	// 	console.log('instance destroyed');
	// });
}
Template.deck_edit_info.destroyed = function() {
	if(isEmptyDeck(deck_id))
		Decks.remove(ctx.params.id);
}

Template.deck_edit.events({
	'click #save-deck': function(e) {
		if(isEmptyDeck(deck_id))
			alert('Please fill out the form before you continue');
		else 
			route('/deck/edit/' + ctx.params.id + '/select-cards');
	}
});

Template.deck_edit.helpers({
	'deck': function() {
		var form = ui.byID('info_form');
		return form.getFields();
	}
});

});




route('/deck/edit/:id/select-cards', route.requireSubscription('decks'), isDeck,
function(ctx) {
	
	var deck_id = ctx.params.id;
	var deck = Decks.findOne(deck_id);

	if(isEmptyDeck(deck_id))
		route.redirect('/deck/edit/' + ctx.params.id);
	else
		view.render('deck_cards_select');

	
	

	Template.deck_cards_select.destroyed = function() {
		if(isEmptyDeck(deck_id)) 
			Decks.remove(ctx.params.id);
	}

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
		'click .deck': function() {

		},
		'click .selected-card': function() {
			Decks.update(ctx.params.id, {$pull: {cards: this._id}});
		}
	});

	Template.deck_cards_grid.helpers({
		'cards': function() {
			// var deck = Decks.findOne(ctx.params.id);
			return Cards.find();
		},
		'notInDeck': function() {
			var deck = Decks.findOne(ctx.params.id);
			if (!deck.cards)
				return true;
			else
				return deck.cards.indexOf(this._id) === -1 && this.status === 'published';
		}
	});

	Template.deck_cards_grid.events({
		'click .card': function() {
			Decks.update(ctx.params.id, {$push: {cards: this._id}});
		}
	});

	Template.deck_cards_select.events({
		'click #save-button': function() {
			route.redirect('/deck/edit/' + deck_id);
		},
		'click #save-deck.publish': function() {
			Decks.update(deck_id, {$set: {status: 'published'}});
			route.redirect('/deck/create');
		}
	});

});


function isDeck(ctx, next) {
	if(Decks.findOne(ctx.params.id) !== undefined)
		next();
	else
		route.redirect('/deck/create');
}

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


