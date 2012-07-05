;(function(){
	var all;
	var ready;
	var base = '/' + __meteor_runtime_config__.METEOR_SUBAPP_PREFIX + 'decks';

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
	route.start = function(){
		if(__meteor_runtime_config__ && __meteor_runtime_config__.METEOR_SUBAPP_PREFIX)
			page.base(base);

		page.start();
	};

	route.show  = page.show;

	route.ready(function(ctx,next) {
		$(document).ready(next);
	});

	route.redirect = function(path) {
		setTimeout(function() {
			page(path)
		}, 0);
	}


	window.route = route;
})();