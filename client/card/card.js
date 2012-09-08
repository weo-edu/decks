//////////////////////////////////
////////////////XXX add iteration option to uikit
// route('/card/create', route.requireUser,function() {
// 	Cards.insert({username: Meteor.user().username, problem: {}}, function(err,_id) {
// 		if (err) throw err;
// 		route('/card/edit/' + _id + '/back');
// 	});
// });

function isCard(ctx, next) {
	if(Cards.findOne(ctx.params.id) !== undefined)
		next();
	else
		route.redirect('/deck/create');
}


route('/card/edit/:id', route.requireSubscription('cards'), isCard, function(ctx) {
	var card_id = ctx.params.id;
	var card = Cards.findOne(card_id);
	view.render('card_front');

	Template.card_front.destroyed = function(){
		if(isEmptyCard(card_id)) 
			Cards.remove(ctx.params.id);
	}

	Template.card_front_form.init_form = function() {
		return {component: 'form', id: 'info_form'}
	}

	Template.card_front_form.rendered= function() {
		var form = ui.byID('info_form');
		if(form) form.setFields(card);
		gs.upload($(this.find('#image-upload')),function(err,data) {
	  		form.setField('image', "/upload/"+data.result.path);
	  	});

		ui.autorun(function() {
			Cards.update(ctx.params.id, {$set: form.getFields()});
		});
	}

	Template.card_front_preview.helpers({
		'card': function() {
			var form = ui.byID('info_form');
			return form.getFields();
		}
	});

	Template.card_front_preview.events({
		'click #save-card': function() {
			if(isEmptyCard(card_id))
				alert('Fill out this form fool');
			else
				route('/card/edit/' + ctx.params.id + '/problem');
		}
	});

});

route('/card/edit/:id/problem', route.requireSubscription('cards'), isCard,
function(ctx) {

var card_id = ctx.params.id;
var card = Cards.findOne(card_id);

if(isEmptyCard(card_id))
	route.redirect('/card/edit/' + ctx.params.id);
else {
	if(card.poblem === undefined);
		Cards.update(ctx.params.id, {$set: {problem: {}}});
	view.render('card_edit_info');
}

card.rules_form = null;

card.db = function() {
	return Cards.findOne(ctx.params.id);
}

card.errorCheck = function() {
	var self = this;
	var edited = self.db();
	edited.problem.rules = self.edited_rules;
	console.log(self.edited_rules);
	var p = problemize(edited);

	var error = null;
	_.each(p.errors,function(err) {
		if (err.part === 'rule' && 
				(err.idx === self.editing_rule_idx || err.idx === 'all')) {
			error = err.message;
		}
	});

	return error;
}

card.newRule = function() {
	this.edited_rules = _.clone(routeSession.get('rules'));
	this.edited_rules.push('');
	this.editing_rule_idx = this.edited_rules.length-1;
}

card.editRule = function(idx) {
	card.edited_rules = _.clone(routeSession.get('rules'));
	card.editing_rule_idx = idx;
}

card.setEditRules = function() {
	routeSession.set('rules', this.edited_rules);
	this.edited_rules = null;
}

Template.card_preview.helpers({
	problemized: function() {
		var problemized = problemize(card.db());
		routeSession.set('cur_problem', problemized);
		return problemized;
	},
	margin: function() {
		return parseInt(routeSession.get('margin'), 10) + 'px';
	}
});

Template.card_preview.rendered = function() {
	routeSession.set('margin', $('#problem').height() / -
		2);
}

Template.card_info_form.created = function() {
	this.autoSaveSetup = false;
}

Template.card_info_form.rendered = function() {
	var form = ui.byID('back_form');

	form.setFields(card.problem);

	if (!this.autoSaveSetup) {
		this.autoSaveSetup = true;
		ui.autorun(function() {
			Cards.update(ctx.params.id, {$set: {problem: form.getFields()}});
		});

		ui.autorun(function() {
			Cards.update(ctx.params.id, {$set: {'problem.rules': routeSession.get('rules')}});
		});
	}
	


}

Template.card_info_form.helpers({
	form_init: function() {
		return {id: 'back_form', component: 'form'}
	}
});

Template.rules_form.created = function() {
	card.rules_form = this;
	routeSession.set('rules', routeSession.get('rules') || card.db().problem.rules || []);
}

Template.rules_form.helpers({
	'rules': function(opts) {
		return utils.index(_.clone(routeSession.get('rules')));
		// var template = opts.template;
		// return template.get('rules');
	},
	'error': function(opts) {
		// var form = opts.template;
		return routeSession.get('error') || '';
	}
});

Template.rules_form.events({
	'change .set-rule': function(evt, template) {
		updateRules();
	},
	'click .cancel': function(evt) {
		var el = $(evt.currentTarget).prev();
		el.val('');
		updateRules();
	},
	'click #design-card': function() {
		route('/deck/create');
	}
});

function updateRules() {
	routeSession.set('rules', []);
	$('.set-rule').each(function(idx) {
		if($(this).val() !== '') {
			card.newRule();
			routeSession.set('error', '');
			card.edited_rules[card.editing_rule_idx] = $(this).val();
			var error = card.errorCheck();

			if (error) {
				routeSession.set('error',error);
				return;
			} else {
				card.setEditRules();
			}
		}
	});
}

Template.rules_form.preserve({
	'.new-rule[id]': function(node) { return node.id; }
});

});

function isEmptyCard(id) {
	var card = Cards.findOne(id);
	if(!card) return true;

	var keys = _.keys(card);
	keys = _.without(keys,'_id','type', 'username');
	if (_.all(keys, function(key) {return !card[key];}))
		return true;
	else
		return false;
}

