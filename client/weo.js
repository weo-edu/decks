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

		var dialog = ui.get(template.find('.dialog'));
		dialog.on('hide', function() { $('#global-search').removeClass('active') });
		
		if(dialog.hasClass('hide')) {
			dialog.closable().show();
			$('#global-search').addClass('active');
		}
	},
	'blur #global-search': function(evt, template) {
		if(!routeSession.get('global-filter')) {
			ui.get(template.find('.dialog')).hide();
		}
	}
});

Template.global_search.helpers({
	results: function() {
		if (!routeSession.get('global-filter'))
				return;
		return Decks.find({'search.keywords': routeSession.get('global-filter')});
	}
});

// Template.global_search.events({

// });

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

