var easing = 'easeInQuad';
var dojoRenderer = view.renderer('dojoRender', {
	tome_view: {
		in: function(cb) {
			var el = $('#tome-view .tome-center');
			var bL = $('#tome-view .buddy-list');
			var height = $(window).height()
			el.css('top', -height );
			bL.css('top', 0);
			el.animate({
				top: '0'
			}, 300, easing, function() {
				bL.show();
				cb();
			});
		}, 
		out: function(cb) {
			var el = $('#tome-view .tome-center');
			var bL = $('#tome-view .buddy-list');
			var height = $(window).height()
			el.parent().parent().css({'z-index': 98});
			el.animate({
				top: -height
			}, 300, easing, function() {
				bL.css('top', -height);
				cb();
			});
		}
	}
});
var navRenderer = view.renderer('navRender');

var dojo = {};

dojo.render = function(name, nav) {
	if (view.rendered() !== 'dojo_view')
		view.render('dojo_view');

	nav = nav || 'dojo_browse_nav';
	if (navRenderer.rendered() !== nav)
		navRenderer.render(nav);

	dojoRenderer.render(name);
}

Template.dojo_view.created = function() {
	this.doResize = function(){
		var height = $(window).height() - $('#nav').height();
		$('.dojo').outerHeight(height, true);
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
