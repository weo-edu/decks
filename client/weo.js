//XXX you cant subscribe to all cards and decks
//Meteor.subscribe('decks');
//Meteor.subscribe('cards');
Meteor.subscribe('userDecks', Meteor.user()._id);

Template.level_progress.helpers({
	level: function() {
		var user = this.synthetic ? Meteor.user() : Meteor.users.findOne(this._id);
		return user && user.level%60 + 1;
	},
	stage: function(){
		var user = this.synthetic ? Meteor.user() : Meteor.users.findOne(this._id);
		if (!user)
			return
		var stage = Math.ceil((user.level+1)/60)
		if(stage % 2 == 0)
			return 'stage-' + (stage-1) + ' half';
		else 
			return 'stage-' + stage;
	},
	progress: function() {
		var user = this.synthetic ? Meteor.user() : Meteor.users.findOne(this._id);
		if (!user)
			return 0;
		var levelPoints = Stats.levelPoints(user.level) - user.points;
		var levelPointsNeeded = Stats.levelPoints(user.level);
		return (levelPoints / levelPointsNeeded)*100;
	}
});

Template.dojo_browse_nav.events({
	'keyup #global-search': function(evt,template) {
		var search = $(evt.target).val().toLowerCase();
		routeSession.set('global-filter', search);
		Meteor.get('globalSearch', search);

		var d = ui.get(template.find('.dialog'));
		d.on('hide', function() { 
			$('#global-search, .global-search-bar .close').removeClass('active').val(''); 
		});
		
		if(d.hasClass('hide')) {
			d.overlay().show();
			$('#global-search, .global-search-bar .close').addClass('active');
		}
	},
	'blur #global-search': function(evt, template) {
		if(!routeSession.get('global-filter')) {
			ui.get(template.find('.dialog')).hide();
		}
	},
	'click .close': function(evt, template) {
		ui.get(template.find('.dialog')).hide();
	}
});

Template.global_search.rendered = function() {
	var d = ui.get($('#global-search-dialog .dialog'))
	if(!d.hasClass('hide')) {
		d.on('hide', function() { 
			$('#global-search, .global-search-bar .close').removeClass('active').val(''); 
		});
		$('#global-search, .global-search-bar .close').addClass('active');
	}
		
}

Template.global_search.helpers({
	results: function() {
		if (!routeSession.get('global-filter'))
				return;
		return Decks.find({'search.keywords': routeSession.get('global-filter')});
	}
});

Template.global_search.events({
	'click .tome-container': function(){
		ui.get($('#global-search-dialog .dialog')).hide();
		route('/tome/' + this.creatorName + '/' + this.id);
	}
})

function animateBg() {
	var sun = document.getElementById('sun'),
		deg = 0;
	
	Meteor.defer(function(){
		sun.addEventListener(transitionEndEvent, rotateSun);	
		rotateSun();	
	})

	function rotateSun() {
		deg +=360;
		$(sun).css(transitionPrefix, 'all 200s linear');
		$(sun).css(transformPrefix, 'rotate(' + deg + 'deg)');
	}	
}

// -- Problem Preview Dialog Start -- //


function previewDialog(card) {
	routeSession.set('scroll-preview', card);
	ui.get($('#scroll-preview .dialog')).closable().overlay().center().show();
}

var context = null;
Template.view_scroll_dialog.helpers({
	html: utils.attachDefer(function(ctx) {
		context = Meteor.deps.Context.current;
		console.log(ctx.template);

		var card = routeSession.get('scroll-preview');
		ctx.template.p = problemize(Cards.findOne(card._id));
		ctx.template.z = new Zebra(ctx.template.p.zebra);
		return ctx.template.z.render(ctx.template.p.assignment);
	}, _.bind(u.valign, null, '#problem')),
	solution: function(ctx) {
		return ctx.template.p.solution;
	}
});

Template.view_scroll_dialog.events({
	'keypress': function(e) {
		var tmpl = ui.get($('#scroll-preview .dialog'));
		if(e.which === 13) {
			var p = tmpl.p,
				z = tmpl.z;

			var text = verifier(p.solutionText, p.assignment)(z.answer(), p.solution)
					? 'correct' : 'incorrect';

			alert(text);
		}
	},
	'click .generate-button': function() {
		context && context.invalidate();
	}
})

// -- Problem Preview End -- //

