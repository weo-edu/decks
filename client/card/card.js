//////////////////////////////////
////////////////XXX add iteration option to uikit
// route('/card/create', route.requireUser,function() {
// 	Cards.insert({username: Meteor.user().username, problem: {}}, function(err,_id) {
// 		if (err) throw err;
// 		route('/card/edit/' + _id + '/back');
// 	});
// });

route('/card/edit/:id/back', route.requireSubscription('cards'),
function(ctx) {

var card = {};
card.rules_form = null;


card.db = function() {
	return Cards.findOne(ctx.params.id);
}

card.errorCheck = function() {
	var self = this;
	var edited = self.db();
	edited.problem.rules = self.edited_rules;
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


// Template.solution.helpers({
// 	'solution': function() {
// 		var problemized = routeSession.get('cur_problem');
// 		if(problemized) 
// 			return problemized.solution ? problemized.solution : ''; 
// 	}
// });

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

Template.card_info_form.rendered = function() {
	var form = ui.byID('back_form');
	form.setFields(card.db().problem);
	ui.autorun(function() {
		Cards.update(ctx.params.id, {$set: {problem: form.getFields()}});
	});

	ui.autorun(function() {
		Cards.update(ctx.params.id, {$set: {'problem.rules': routeSession.get('rules')}});
	});


}

Template.card_info_form.helpers({
	form_init: function() {
		return {id: 'back_form', component: 'form'}
	}
});

Template.card_info_form.events({
	'click #render-link': function() {
		var form = ui.byID('info_form');
		Decks.set(deck,form.getFields());
		route('/card/edit/' + card._id + '/look');
	}
});

// Template.rules_form.events({
// 	'click #add-rule': function(evt, template) {
// 		// var dialog = ui.get('.dialog');
// 		// dialog
// 		// 	.relative('#add-rule', {top: -1, left: 0})
// 		// 	.show();
// 		// var form_html = dialog.find('.form');
// 		// if (form_html) {
// 		// 	var form = ui.get(dialog.find('.form'));
// 		// 	form.setField('rule', '');
// 		// 	form.set('error', '');

// 		// }
// 		// card.newRule();

// 	},

// 	'click .rule': function(evt, template) {
// 		var dialog = ui.get('.dialog');
// 		dialog
// 			.relative($(evt.target), {top: 0, left: 0})
// 			.show();
		

// 		var form_html = dialog.find('.form');
// 		if (form_html) {
// 			var form = ui.get(dialog.find('.form'));
// 			form.setField('rule',card.edited_rules[card.editing_rule_idx]);
// 			form.set('error', '');
// 		}

// 		card.editRule((evt.target).index());
// 	}
// });

// Template.add_rule_dialog.created = function() {
// 	this.rule_idx = null;
// }

// Template.add_rule_dialog.error = function(opts) {
// 	var form = opts.template;
// 	return form.get('error') || '';
// }

Template.rules_form.created = function() {
	card.rules_form = this;
	routeSession.set('rules', routeSession.get('rules') || card.db().problem.rules || []);
}

Template.rules_form.helpers({
	'rules': function(opts) {
		return routeSession.get('rules');
		// var template = opts.template;
		// return template.get('rules');
	},
	'error': function(opts) {
		// var form = opts.template;
		return routeSession.get('error') || '';
	}
});

// Template.rules_form.created = function() {
// 	// this.rule_idx = null;
// }

// Template.rules_form.error = function(opts) {
// 	var form = opts.template;
// 	return form.get('error') || '';
// }


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
		route('/card/edit/' + card.db()._id + '/front');
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
	'.new-rule[id]': function(node) { console.log(node.id); return node.id; }
});

view.render('card_edit_info');
});

route('card/edit/:id/front', route.requireSubscription('cards'), function(ctx) {

	view.render('card_front');
});

/*
route('/card/create', function() {
	var transformPrefix = domToCss(Modernizr.prefixed('transform'));

	var error = new Reactive.Store('error',{
		template:'',
		solution:'',
		rules:[]
	});

	var watchErrors = function(){
		var update = function(){
			Meteor.defer(function(){
				var err = error.all();
				_.each(err, function(msg, ele){
					if(ele == 'rules')
					{
						$('#rules').children().children().children('.error').removeClass('error');
						_.each(msg, function(mssg, elem){
							var num = $('#rules').children().index() - elem;
							var el = '#rules-' + num.toString();
							$(el).addClass('error');
						})
					}
					else
					{
						var el = '#' + ele;
						$(el).addClass('error');
					}
				}); 
			});
		};
		update();
	}


	function instantUpdate(event){
		var el = $(event.target);
			var id = $(event.target).attr('id');
			var val = el.val();


			if (!card.equals(id,val))
			{
				if(id == 'name')
					card.set('name', val);
				else if(id == 'tags')
				{
					val = val.split(',');
					_.each(val, function(el, idx){
						val[idx] = el.trim();
					});
					card.set(id, val);
				}
				else{
					problem.set(id,val);
					card.set('problem',problem.all());
					watchErrors(el, id);
				}
			}
	}


	var events = {

	'click .button' : function(event){
			var tar = $(event.target).closest('.input-area')
			if(validate())
				switchPages(tar);
		},
		'click #upload' : function(){
			$('#file').click();
		}
	};

	Template.template_preview.events = {
		'click #create' : function(event){
			if(validate())
				Cards.insert(card.all(), function(err, id){
					if(!err)
					{
						alert('Succesful Creation');
						var to_reset = [card, problem, error]
						reset(to_reset);
					}
				})
		}
	}

	Template.card_create.events = events;


	Template.rules_form.events = {
		// 'keyup .instant_update': function(event) {
		// 	var el = $(event.target);
		// 	var idx = el.closest('#rules').children().children().children('.rule-input').index(el);
		// 	var rules = _.clone(problem.get('rules'));

		// 	rules[idx] = el.val();
		// 	problem.set('rules',rules);
		// 	card.set('problem',problem.all())
		// 	watchErrors();
		// 	return false;
		// },
		'click #add-rule': function(event) {
			$('#rules').prepend(Meteor.ui.render(function() {
				return Template.rule_input();
			}));
			if($('#rules').height() <= $('#rule-container').height())
				$('#bottom-button').css('top', $('#rules').height());
		}
	}



	function getCard(){
		var c = card.all();
		var prob = problem.all();
		var p = problemize(prob);
		c.question = p.html;
		c.answer = p.solution;

	}

	Template.front.card = function(){
		return ui.get('card_look_info').getFields();
	}

	Template.back.card = function(){
		var c = ui.get('card_input_info').getFields();
		var p = problemize(c);
		c.question = p.html;
		c.answer = p.solution;
		var e = {
			template: '',
			solution: '',
			rules: _.map(c.rules,function(rule) {return '';})
			};

	_.each(p.errors,function(err) {
		if (err.part == 'rule') {
			console.log('rule error',err.idx);
			e.rules[err.idx] = err.message;
		}
			
		else
			e[err.part] = err.message;
		});

		_.each(e,function(val,key) {
			error.set(key,val);
		})

		watchErrors();
 
		return c;
	}

	// Template.front.card = function(){
	// 	return getCard();
	// }

	Template.rule_input.idx = function(){
		return $('#rules').children().length;
	}

	Template.rule_input.idx_adj = function(){
		return $('#rules').children().length + 1;
	}

	Template.card_create.defer = function(){
		Meteor.defer(function() {
			//floatingObj('10px', 1500, 'easeInOutSine', $('.deck-shadow'));
			// $('.color-change').change(function(){
			// 	var name = $(this).attr('name');
			// 	var val = $(this).val();
			// 	card.set(name, val)
			// });
			// var picker = $.farbtastic('#colorpicker');
			// picker.linkTo(onColorChange);
			// function onColorChange(color){
			// 	card.set('main-color',color);
			// }
			console.log('file', $('#file'));
			$('#card_load').fileupload({
		    	url: "/upload",
		    	type: "POST",
		    	dataType: 'json',
		    	multipart: true,
		    	done: function(e,data) {
		    		console.log('done');
		    		ui.get('card_image').value("upload/"+data.result.path)
			    }
		    });
			});
		return 'done';
	}
	view.render('card_create');
});*/
