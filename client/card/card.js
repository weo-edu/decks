route('/card/create', function() {
	var transformPrefix = domToCss(Modernizr.prefixed('transform'));
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



	var watchErrors = function(){
		var update = function(){
			Meteor.defer(function(){
				var err = error.all();
				_.each(err, function(msg, ele){
					if(ele == 'rules')
					{
						_.each(msg, function(mssg, elem){
							var num = $('#rules').children().index() - elem;
							var el = '#rules-' + num.toString();
							if(mssg)
								$(el).addClass('error');
							else
								$(el).removeClass('error');
						})
					}
					else
					{
						var el = '#' + ele;
						if(msg)
							$(el).addClass('error');
						else
							$(el).removeClass('error');
						console.log(msg);
					}
					//console.log(test);	
				}); 
			});
		};
		update();
	}

	var events = {
		'keyup .instant_update' : function(event){
			var el = $(event.target);
			var id = $(event.target).attr('id');
			var val = el.val();

			if (!card.equals(id,val))
			{
				card.set(id,val);
				watchErrors(el, id);
			}
		},
		'click #create' : function(){
			var c = card.all()
			Cards.insert(c, function(){
				console.log(Cards.findOne(c));
			});
			animateCreator(function(){
			});
		},
		'mouseover .error' : function(){
			var el = $(event.target);
			var id = $(event.target).attr('id');
			err_msg = el.parent().children('.error-message');
			console.log(err_msg);
		},
		'click .color-picker-min' : function(){
			$('.color-choose').toggle();
		},
		'click .color-choose' : function() {
			$('.color-choose').toggle();
		}
	};

	Template.card_create.events = events;


	Template.rules.events = {
		'keyup .instant_update': function(event) {
			var el = $(event.target);
			var idx = el.parents('#rules').children().children('.rule-input').index(el);
			var rules = _.clone(card.get('rules'));

			rules[idx] = el.val();
			card.set('rules',rules);
			watchErrors();
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

	Template.deck_preview.events = {
		'click .deck' : function(event){
			el = $(event.target).closest('.deck-container');
			el.removeClass('last-selected')
			el.toggleClass('selected');
			if(el.hasClass('selected'))
			{
				el.parent().children().not('.selected').hide();
				el.css(transformPrefix, 'rotateY(180deg)');
			}
			else
			{ 
				el.addClass('last-selected');
				deal($('.deck-preview'),200, 'grid');
				el.css(transformPrefix, 'rotateY(0deg)');
				el.parent().children().fadeIn(500);
			}
			return false;
		},
		'click .choose-deck' : function(event){
			el = $(event.target).closest('.deck-container');
			el.toggleClass('chosen');
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

	Template.rule_input.idx = function(){
		return $('#rules').children().length;
	}
	Template.deck_preview.deck = function(){
		Meteor.defer(function() {
			$('#colorpicker').farbtastic('#color');
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
			});
		return Decks.find({});
	}

	function animateCreator(){
		//var pt1 = $('#template-preview').position().left;
		//var pt2 = $('#card-preview').position().left;
		var slide = 0;
		$('.display').animate({'left': '-='+slide}, function(){
			$('#deck-preview').show();
		});
		deal($('.deck-preview'),600,'grid');
		$('#template-preview').fadeOut();
		$('.color-picker-min').fadeOut();
	}
	//watchErrors();
	renderView('card_create');
});