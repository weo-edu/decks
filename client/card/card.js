route('/card/create',function(ctx) {
	console.log('card create');
	var session = new _Session();
	var card = new _Session({
		card_name:'Name',
		template: 'Template',
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
		},
		'click #create' : function(){
			var c = card.all()
			Cards.insert(c, function(){
				console.log(Cards.findOne(c));
			});
			animateCreator();
		}
	};

	Template.card_create.events = events;


	Template.rules.events = {
		'keyup .instant_update': function(event) {
			var el = $(event.target);
			//var idx = el.parent().children(".rule-input").index(el);
			var idx = el.parents('#rules').children().children('.rule-input').index(el);
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
	
	Template.template_errors.events = {
		'mouseover .error-light-red' : function (event) {
			$('#template-error-message').css('display','inline-block');
		},
		'mouseout .error-light-red' : function() {
			$('#template-error-message').fadeOut('fast');
		}
	}

	Template.solution_errors.events = {
		'mouseover .error-light-red' : function (event) {
			$('#solution-error-message').css('display','inline-block');
		},
		'mouseout .error-light-red' : function() {
			$('#solution-error-message').fadeOut('fast');
		}
	}

	Template.rules_errors.events = {
		'mouseover .error-light-red' : function (event) {
			var el = $(event.target).parent().children('#rules-error-message');
			var light = $(event.target).parent().children('.error-light-red');
			var cssObj = {
				'display': 'block',
				'top': $(light).position().top,
				'left': $(light).position().left + $(light).width()
			}
			$(el).css(cssObj);
		},
		'mouseout .error-light-red' : function() {
			var el = $(event.target).parent().children('#rules-error-message');
			$(el).fadeOut('fast');
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

	Template.deck_list.deck = function(){
		return Decks.find({});
	}

	Template.template_errors.error = function() {
		return error.get('template');
	}

	Template.solution_errors.error = function() {
		return error.get('solution');
	}
	Template.rules_errors.rules_errors = function() {
		console.log(error.get('rules'));
		return error.get('rules');
	}
	function animateCreator(){
		var pt1 = $('#template-preview').position().left;
		var pt2 = $('#card-preview').position().left;
		var slide = pt2-pt1;
		$('.display').animate({'left': '-='+slide});
	}
	renderView('card_create');
});