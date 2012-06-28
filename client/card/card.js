route('/card/create',function(ctx) {
	Session.set('view','card_create');
	var session = new _Session();
	var card;
	var view = ctx.view;
	var rules = []
	var error_message;
	console.log('card create');
	var events = {
		'click #create' : function(){
			console.log(session.get('card'));
		},
		'keyup .instant_update' : function(){
			var success = true;
			card = getValues();
			try{
				card = getCard();
				$(".error").remove();
			}
			catch(err){
				success = false;
			}
			if(success)
				session.set('card', card);
		},
		'focusout .instant_update' : function(){
			if(!_.isEqual(session.get('card'), card))
			{
				try{
					card = getCard();
					session.set('card', card);
					$(".error").remove();
				}
				catch(err)
				{
					var patt1 = / token: /
					var patt2 = / end of input /
					if(patt1.test(err.message))
						error_message = "Invalid template";
					else if(patt2.test(err.message))
						error_message = "Invalid solution";
					else
						error_message = err.message;
					console.log(error_message);
					if(!$(event.target.parentElement).has('.error').length)
					{
						var error = "<label class='error'> *"+error_message+"</label>"
						$(event.target).after(error);
					}
				}
			}
			session.set('card', card);
		},
		'keyup #rules' : function(event){
			if(event.keyCode == 13)
			{	
				var success = true;
				try{
					rules.push($('#rules').val());
					card = getCard();
				}
				catch(err)
				{
					success = false;
					rules.pop();
					card = getCard();
					error_message = "Invalid rule";
					if(!$(event.target.parentElement).has('.error').length)
					{
						var error = "<label class='error'> *"+error_message+"</label>"
						$(event.target).after(error);
					}
				}
				if(success)
				{
					session.set('card', card);
					$('#rules_list').append('<li>'+$("#rules").val()+'<span class="remove">-</span></li>');
					$("#rules").val('');
					$("#rules").focus();
				}
			}
		},
		'click .remove' : function (event)
		{
			var patt1 = /\b-/;
			$(event.target.parentElement).remove();
			var remove = ($(event.target.parentElement).text().trim().replace(patt1,''));
			//console.log($(event.target.parentElement));
			_.each(rules, function(num, val){
				if(num == remove)
					rules.splice(val, 1);
			})
			card = getCard();
			session.set('card', card);
		}
	};

	Template.card_create.events = events;

	function getValues(){
		var update_card = {};
		update_card.name = $('#card_name').val();
		update_card.graphic = $('#list').val();
		update_card.template = $("#template").val();
		update_card.solution = $("#solution").val();
		update_card.rules = rules;
		return update_card;
	}
	function getCard(){
		var update_card = getValues();
		update_card.problem = new Problem(update_card);
		update_card.question = update_card.problem.generate();
		update_card.answer = update_card.problem.getSolution();
		return update_card;
	}
	
	Template.card_play.card = function(){
		return session.get('card');
	}

});