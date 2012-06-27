;(function(){
	var all;
	var ready;
	var view;

	function route(path, fn){
		var args = _.toArray(arguments);
		if(typeof fn === 'function'){
			if(ready){
				args = args.slice(1);
				args.unshift(ready);
				args.unshift(path);
			}

			if(all)
				args.push(all);

		}

		return page.apply(null, args);
	}

	route.all = function(fn){ all = fn; };
	route.ready = function(fn){ ready = fn; };
	route.start = page.start;
	route.show  = page.show;


	route.all(function(ctx,next) {
	  var action = ctx.params.action || 'index';
	  Session.set('view', ctx.view + '_' + ctx.params.action);
	});

	route.ready(function(ctx,next) {
		if(view) view.destroy();
		view = View();

		ctx.view = view;
	  $(document).ready(next);
	});


	window.route = route;
})();