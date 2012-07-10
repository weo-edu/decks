;(function(){
	var types = {
		grid: function(children, deckOuterWidth, decksPerRow){
			var rot = [];
			children.each(function(idx){
				rot[idx] = {};
				rot[idx].x = deckOuterWidth * (idx % decksPerRow);
				rot[idx].y = deckOuterWidth * (Math.floor(idx/decksPerRow));
				rot[idx].z = 0;
			});

			children.parent().height(deckOuterWidth * (Math.ceil(children.length/decksPerRow)));
			return rot;
		},
		fit: function(children){
			return;
		},
		collapse: function(children){
			var rot = [];
			children.each(function(idx){
				rot[idx] = {x: (4 * idx), y: 0, z: (20 * idx)};
			});

			return rot;
		}
	};

	function getTranslation(container, type) {
		type = typeof type !== 'undefined' ? type : 'grid';

		// var idx = el.parent().children(el).index(el);

		var width = container.width();
		var children = container.children();
		var containerWidth = container.width();
		var deckWidth = children.width();
		var decksPerRow = Math.floor(containerWidth / deckWidth);
		var gutter = ((containerWidth - decksPerRow * deckWidth) / (decksPerRow - 1));

		var deckOuterWidth = deckWidth + gutter;

		if(typeof types[type] !== 'function'){
			throw new Error('getTranslation called with invalid type: ' + type);
		}

		return types[type](children, deckOuterWidth, decksPerRow);
	}



	function deal(container, dur, type, callback) {
		callback = callback || function(){};

		var idx = 0;
		var num_cards = container.children().length;
		var rot = getTranslation(container, type);

		if(rot.length == 0) {
			callback();
			return;
		}
					
		var dealInterval = setInterval(function(){

			var el = container.children().eq(idx);
			
			el.css(transformPrefix, 'translate3d(' + rot[idx].x + 'px,'+ rot[idx].y +'px,' + rot[idx].z +'px)');
			el.css('z-index', 1);
			idx++;
			
			if(idx >= num_cards) {
				clearInterval(dealInterval);
				callback();
			}

		}, (dur / num_cards));
	}

	window.deal = deal;
})();