route('/card/create', function() {
	var transformPrefix = domToCss(Modernizr.prefixed('transform'));
	var card = new Reactive.Store('card', {
		name:'',
		graphic: null,
		problem:{},
		'main-color':'',
		'sec-color':'',
		tags:[]
	});
	var problem = new Reactive.Store('problem', {
		template: 'Template',
		solution: '',
		rules: []
	})
	var error = new Reactive.Store('error', {
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
		'keyup .instant_update' : function(event){
			instantUpdate(event);
		},
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


	Template.rules.events = {
		'keyup .instant_update': function(event) {
			var el = $(event.target);
			var idx = el.closest('#rules').children().children().children('.rule-input').index(el);
			var rules = _.clone(problem.get('rules'));

			rules[idx] = el.val();
			problem.set('rules',rules);
			card.set('problem',problem.all())
			watchErrors();
			return false;
		},
		'click #add-rule': function(event) {
			$('#rules').prepend(Meteor.ui.render(function() {
				return Template.rule_input();
			}));
			if($('#rules').height() <= $('#rule-container').height())
				$('#bottom-button').css('top', $('#rules').height());
			var rules = problem.get('rules');
			rules.unshift('');
			problem.set('rules', rules)
			card.set('problem', problem.all());
		}
	}



	function getCard(){
		var c = card.all();
		var prob = problem.all();
		var p = problemize(prob);
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

 
		return c;
	}


	Template.back.card = function(){
		return getCard();
	}

	Template.front.card = function(){
		return getCard();
	}

	Template.rule_input.idx = function(){
		return $('#rules').children().length;
	}

	Template.rule_input.idx_adj = function(){
		return $('#rules').children().length + 1;
	}

	Template.card_create.defer = function(){
		Meteor.defer(function() {
			//floatingObj('10px', 1500, 'easeInOutSine', $('.deck-shadow'));
			$('.color-change').change(function(){
				var name = $(this).attr('name');
				var val = $(this).val();
				card.set(name, val)
			});
			// var picker = $.farbtastic('#colorpicker');
			// picker.linkTo(onColorChange);
			// function onColorChange(color){
			// 	card.set('main-color',color);
			// }
			console.log('file', $('#file'));
			$('#file').fileupload({
		    	url: "/upload",
		    	type: "POST",
		    	dataType: 'json',
		    	multipart: true,
		    	done: function(e,data) {
		    		console.log('done');
		    		$('#file').attr('img', data.result.path);
		    		card.set("graphic","upload/"+data.result.path);
			    }
		    });
			});
		return 'done';
	}
	view.render('card_create');
});
