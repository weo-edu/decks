route('/card/create',function(ctx) {

	var session = new _Session();
	var card = new _Session();
	card.set('template','');
	card.set('solution','');
	var error = new _Session();

	var last_success;
	var rules = []
	var error_message;

	var state = {FIELD: null}

	var events = {
		'focus .instant_update' : function(){
			var id = $(event.target).attr('id');
			$('#'+id+'-light').fadeIn();

		},
		'keyup .instant_update' : function(event){
			var el = $(event.target);
			var id = $(event.target).attr('id');
			var val = el.val();
			state.FIELD = id;

			if (!card.equals(id,val))
				card.set(id,val);
		},
		'focusout .instant_update' : function(event){
			//$(event.target.parentElement + " .error").remove();
			var id = $(event.target).attr('id');
			$('#'+id+'-light').fadeOut();

		},
		'keyup #rules' : function(event){
			event.stopPropogation();

		
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

		},
		'insert .create' : function(evt){
	    $('#file').fileupload({
	    	url: "/upload",
	    	type: "POST",
	    	dataType: 'json',
	    	multipart: true,
	    	done: function(e,data) {
	    		card.set("graphic","/upload/"+data.result.path);
		    }
	    });
		}
	};

	Template.card_create.events = events;

	
	Template.card_play.card = function(){
		var c = card.all();
		console.log(c);
		try {
			c.problem = new Problem(c);
			c.question = c.problem.generate();
			c.answer = c.problem.getSolution();
		} catch (e) {
			console.log(e);
		}
		
 
		return c;
	}

	Template.card_create.error = function() {
		return error.all();
	}
	renderView('card_create');
});