

var easing = 'easeInOutExpo';
var dojoRenderer = view.renderer('dojoRender', {
	tome_view: {
		in: function(cb) {
			console.log('in');
			var el = $('#tome-view');
			el.css('top', -$(window).height());
			el.animate({
				top: '0'
			}, 300, easing, cb);
		}, 
		out: function(cb) {
			var $el = $('#tome-view');
			$el.animate({
				top: -$(window).height()
			}, 300, easing, cb);
		}
	}
});
var navRenderer = view.renderer('navRender');

var dojo = {};

dojo.render = function(name, nav) {
	if (view.rendered() !== 'dojo_view') {
		view.render('dojo_view');
	}
	
	dojoRenderer.render(name);
	nav = nav || 'dojo_browse_nav';
	if (navRenderer.rendered() !== nav)
		navRenderer.render(nav);
}

Template.dojo_view.created = function() {
	this.doResize = function(){
		var height = $(window).height() - $('#nav').height();
		$('#browse-view').outerHeight(height, true);
	}
}

Template.dojo_view.rendered = function() {
	if (this.firstRender) {
		this.doResize();
		$(window).resize(this.doResize);
	}
}

Template.dojo_view.destroyed = function() {
	$(window).unbind('resize', this.doResize);
}

Template.dojo_view.helpers({
	page: function() {
		return Session.get('dojo-page');
	},
	nav: function() {
		return Session.get('dojo-nav');
	}
});
