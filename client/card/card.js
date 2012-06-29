route('/card/create',function(ctx) {
	Session.set('view','card_create');
	var session = new _Session();
	var card;
	var last_success;
	var view = ctx.view;
	var rules = []
	var error_message;
	console.log('card create');
	var events = {
		'click #create' : function(){
			console.log(session.get('card'));
		},
		'focus .instant_update' : function(){
			$(event.target.nextElementSibling).fadeIn();
			$(event.target.nextElementSibling).css('background-color', 'green');
			card = getValues();
			testCard(false,event);
		},
		'keyup .instant_update' : function(event){
			var success = true;
			card = getValues();
			if(testCard(false, event))
			{
				last_success = getCard();
				session.set('card', card);
				$(event.target.nextElementSibling).css('background-color', 'green');
			}
		},
		'focusout .instant_update' : function(event){
			//$(event.target.parentElement + " .error").remove();
			$(event.target.nextElementSibling).fadeOut();
			card = getValues();
			if(!_.isEqual(session.get('card'), card))
			{
				testCard(true, event);
			}
			//session.set('card', card);
		},
		'keyup #rules' : function(event){
			removeError($("#rules"));
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
				$(event.target.nextElementSibling).css('background-color', 'red');
			}
			if(success)
			{
				$(event.target.nextElementSibling).css('background-color', 'green');
				rules.pop();
			}
			if(event.keyCode == 13)
			{	
				if(success)
				{
					rules.push($('#rules').val());
					session.set('card', card);
					$('#rules_list').append('<li>'+rules[rules.length-1]+'<span class="remove">-</span></li>');
					$("#rules").val('');
					$("#rules").focus();
					console.log(session.get('card'));
				}
				else{
					error_message = "Invalid rule";
					if(!$(event.target.parentElement).has('.error').length)
					{
						var error = "<label class='error'>"+error_message+"</label>"
						$(error).insertAfter($(event.target.nextElementSibling));
					}
				}
			}
		},
		'focusout #rules' : function(event) {
			$(event.target.nextElementSibling).fadeOut();
		},
		'focus #rules' : function(event)
		{
			$(event.target.nextElementSibling).css('background-color', 'green')
			$(event.target.nextElementSibling).fadeIn();
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

	function testCard(for_color, event){
		try{
			card = getCard();
			session.set('card', card);
			$(".error").remove();
			return true;
		}
		catch(err)
		{
			errorSwitch(err, for_color, event)
			return false;
		}
	}
	function errorSwitch(err, for_color, event)
	{
		switch(errorAssign(err, for_color))
		{
			case "template":
				try
				{
					if($(event.target).is($('#template')))
						$(event.target).next().css('background-color', 'red');
					card = getValues();
					card.template = last_success.template;
					getCard(card);
					removeError($('#solution'));
				}
				catch(err)
				{
					if($(event.target).is($('#solution')))
						$(event.target).next().css('background-color', 'red');
					errorAssign(err, for_color);
				}
			break;
			case "solution":
				try
				{
					if($(event.target).is($('#solution')))
						$(event.target).next().css('background-color', 'red');
					card = getValues();
					card.solution = last_success.solution;
					getCard(card);
					removeError($('#template'));
				}
				catch(err)
				{
					if($(event.target).is($('#template')))
						$(event.target).next().css('background-color', 'red');
					errorAssign(err,for_color);
					//$('#template').next().css('background-color', 'red');
				}
			break;
			default:
			break;
		}
	}
	function errorMessage(target, message)
	{
		var tar = target.parent();
		if(!$(tar).has('.error').length)
		{
			var error = "<label class='error'>"+error_message+"</label>"
			$(tar).append(error);
		}
	}
	function removeError(target)
	{
		var tar = target.parent();
		var tar_ball = target.next();
		if(tar.has($('.error')))
		{
			tar.children('.error').remove();
		}
		$(tar_ball).css('background-color', 'green');
	}
	function errorAssign(error, send_error)
	{
		var error_messagel;
		var err = error;
		var patt1 = / token: /
		var patt2 = /end of input/
		var patt3 = /not defined/
		var patt4 = /of undefined/
		if(patt1.test(err.message))
			{
				if(send_error)
				{
					error_message = "Invalid template";
					errorMessage($("#template"), error_message);
				}
				return "template";
			}
			else if(patt2.test(err.message) || patt3.test(err.message) || patt4.test(err.message))
			{
				if(send_error)
				{
					error_message = "Invalid solution";
					errorMessage($("#solution"), error_message);
				}
				return "solution";
			}
			else
			{
				if(send_error)
				{
					error_message = err.message;
					errorMessage($(event.target), error_message);
				}
				return "else";
			}
	}
	function getValues(){
		var update_card = {};
		update_card.name = $('#card_name').val();
		update_card.graphic = $('#list').val();
		update_card.template = $("#template").val();
		update_card.solution = $("#solution").val();
		update_card.rules = rules;
		return update_card;
	}
	function getCard(fix_card){
		if(fix_card)
			var update_card = fix_card;
		else
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