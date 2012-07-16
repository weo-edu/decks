;(function(){
	var types = {
		grid: function(children, deckOuterWidth, decksPerRow, width){
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
		fit: function(children, deckOuterWidth, decksPerRow, width, deckWidth){

			var rot = [];
			var num_cards = children.length
			var spacing = (width - deckWidth) / (num_cards - 1);

			if(spacing > deckWidth - 50)
				spacing = deckWidth / 2;

			children.each(function(idx){
				rot[idx] = {x: (spacing * idx), y: 0, z: -idx * 0.01};

			});

			return rot;
		},
		collapse: function(children){
			var rot = [];
			children.each(function(idx){
				rot[idx] = {x: (2 * idx), y: 0, z: (3 * idx)};
			});

			return rot;
		}
	};

	function getTranslation(container, type) {
		type = typeof type !== 'undefined' ? type : 'grid';

		var children = container.children();
		var containerWidth = container.width();
		var deckWidth = children.not('.last-selected').width();
		var decksPerRow = Math.floor(containerWidth / deckWidth);
		var gutter = ((containerWidth - decksPerRow * deckWidth) / (decksPerRow - 1));

		var deckOuterWidth = deckWidth + gutter;

		if(typeof types[type] !== 'function'){
			throw new Error('getTranslation called with invalid type: ' + type);
		}

		return types[type](children, deckOuterWidth, decksPerRow, containerWidth, deckWidth);
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

		return rot;
	}

	function featureCard(card, callback) {
		callback = callback || function(){};

		var container = card.parent();
		var idx = container.children().index(card);
		var num_cards = container.children().length;
		var rot = getTranslation(container, 'fit');

		for(var i = 0; i < num_cards; i++)
		{
			var offset = Math.abs(idx - i);
			var turnY = i == idx ? 0 : Math.abs((50 + (offset * -5))) * (i < idx ? 1 : -1);
			var z = i == idx ? 0 : -100;
			var el = container.children().eq(i);

			el.css(transformPrefix, 'translate3d(' + rot[i].x + 'px,'+ rot[i].y +'px,' + z +'px) rotateY(' + turnY + 'deg)');
		}

		callback();

		return card;
	}

	window.featureCard = featureCard;
	window.deal = deal;
})();