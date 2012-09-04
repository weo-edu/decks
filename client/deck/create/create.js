route('/deck/create', route.requireUser, function() {
	view.render('my_collection');

	Template.create_menu.events({
		'click #deck-create': function() {
			Decks.insert({username: Meteor.user().username}, function(err,_id) {
				if (err) throw err;
				route('/deck/edit/' + _id);
			});
		},
		'click #card-create': function() {
			Cards.insert({username: Meteor.user().username, problem: {}}, function(err,_id) {
				if (err) throw err;
				route('/card/edit/' + _id + '/back');
			});
		}
	});

});




// route('/deck/edit', route.requireUser, function() {
// 	console.log('user',Meteor.user().username);
// 	Decks.insert({username: Meteor.user().username}, function(err,_id) {
// 		if (err) throw err;
// 		route('/deck/edit/' + _id);
// 	});
// });

route('/deck/edit/:id', route.requireSubscription('decks'),
function(ctx) {

console.log('next');
var deck = Decks.findOne(ctx.params.id);
console.log('deck',deck);

// Template.deck_render.render = function() {
// 	var form = ui.byID('info_form');
// 	return _.extend(deck,form.getFields());
// }

Template.deck_info_form.init_form = function() {
	return {component: 'form', id: 'info_form'}
}

Template.deck_info_form.rendered= function() {
	console.log('rendered');
	var form = ui.byID('info_form');
	if(form) form.setFields(deck);
	gs.upload($(this.find('#image-upload')),function(err,data) {
		// $('#file').attr('img', data.result.path);
  		form.setField('image', "/upload/"+data.result.path);
  	});
}


// Template.deck_edit.preserve(['#deck-edit', '#deck-edit .deck-title']);
// Template.deck_info_form.events = ({
// 	'click #render-link': function() {
// 		var form = ui.byID('info_form');
// 		console.log('save');
// 		Decks.set(deck,form.getFields());
// 		route('/deck/edit/' + deck._id + '/look');
// 	}
// });

Template.deck_edit.events({
	'click #save-deck': function(e) {
		var form = ui.byID('info_form');
		Decks.set(deck, form.getFields());
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

// route('/deck/edit/:id/look', route.requireSubscription('decks'),
// function(ctx) {

// var deck = Decks.findOne(ctx.params.id);

// Template.deck_render.render = function() {
// 	var form = ui.byID('look_form');
// 	return _.extend(deck,form.getFields());
// }

// // Template.deck_look_form.init_form = function() {
// // 	return {component: 'form', id: 'look_form'}
// // }



// // Template.deck_look_form.events = ({
// // 	'click #info-link': function() {
// // 		var form = ui.byID('look_form');
// // 		Decks.set(deck,form.getFields());
// // 		route('/deck/edit/' + deck._id + '/info');
// // 	}
// // });

// 	view.render('deck_edit_look');
// });

