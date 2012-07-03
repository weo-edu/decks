route('/card/create',function(ctx) {
	console.log('card create');
	var session = new _Session();
	var card = new _Session({
		template: '',
		solution: '',
		graphic: null,
		rules: []
	});
	var error = new _Session({
		template: '',
		solution: '',
		rules: []
	});

	var last_success;
	var rules = []
	var error_message;

	Meteor.defer(function() {
		console.log('file', $('#file'));
		$('#file').fileupload({
	    	url: "/upload",
	    	type: "POST",
	    	dataType: 'json',
	    	multipart: true,
	    	done: function(e,data) {
	    		console.log('done');
	    		card.set("graphic","/upload/"+data.result.path);
		    }
	    });
	})

	var events = {
		'keyup .instant_update' : function(event){
			var el = $(event.target);
			var id = $(event.target).attr('id');
			var val = el.val();

			if (!card.equals(id,val))
				card.set(id,val);
		}
	};

	Template.card_create.events = events;


	Template.rules.events = {
		'keyup .instant_update': function(event) {
			var el = $(event.target);
			var idx = el.parent().children(".rule-input").index(el);
			console.log(idx);
			var rules = _.clone(card.get('rules'));
			console.log('rules',rules);
			rules[idx] = el.val();
			card.set('rules',rules);
			return false;
		},
		'click #add-rule': function() {
			$('#rules').prepend(Meteor.ui.render(function() {
				return Template.rule_input();
			}));
			var rules = card.get('rules');
			rules.unshift('');
			card.set('rules',rules);
		}
	}
	
	Template.card_play.card = function(){
		var c = card.all();
		console.log('c',c);
		var p = problemize(c);
		c.question = p.html;
		c.answer = p.solution;
		var e = {
			template: '',
			solution: '',
			rules: _.map(c.rules,function(rule) {return '';})
		};

		console.log('e',e);

		_.each(p.errors,function(err) {
			console.log(err.stack);
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

 
		return c;
	}

	Template.template_errors.error = function() {
		return error.get('template');
	}

	Template.solution_errors.error = function() {
		return error.get('solution');
	}
	Template.rules_errors.rules_errors = function() {
		return error.get('rules');
	}
	renderView('card_create');
});