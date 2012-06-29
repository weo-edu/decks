;(function(){
	var all;
	var ready;
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

	route.ready(function(ctx,next) {
		console.log('ready')
	 $(document).ready(next);
	});

	route.redirect = function(path) {
		setTimeout(function() {
			page(path)
		},0);
	}


	window.route = route;
})();