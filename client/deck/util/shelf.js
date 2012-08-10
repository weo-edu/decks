;(function(){

	function shelf(container, cols, rows, pad) {
		Meteor.defer(function() {
			cols = cols || 4;
			pad = pad || 0;
			var shelf = container.find('.shelf-wrapper');
			var rowWidth = container.innerWidth() - (pad * 2);
			var items = shelf.children();
			var childWidth = items.outerWidth();
			var numChildren = items.length;
			var itemsPerRow = numChildren;
			var gutter = (rowWidth - (childWidth * cols)) / (cols - 1);

			if(rows) {
				itemsPerRow = numChildren / rows;
				console.log('rows');
			}

			if(pad == 0){
				items.each(function(idx) {
					if(idx%cols == cols - 1)
						$(this).css('margin-right', 0);
					else
						$(this).css('margin-right', gutter);
				});
			}
			else {
				items.each(function(idx) {
					var mod = idx % cols;

					if(mod == 0) 
						$(this).css({'margin-left': pad, 'margin-right': gutter});
					else if (mod == cols - 1)
						$(this).css('margin-right', pad);
					else 
						$(this).css('margin-right', gutter);
				});
			}

			
			container.css('overflow', 'hidden');
			shelf.css('visibility', 'hidden');

			var shelfWidth = container.innerWidth() * (itemsPerRow / cols);

			shelf.width(shelfWidth).height(container.height()).css({'overflow': 'hidden', 'visibility': 'visible'});
		});
	}

	window.shelf = shelf;
})();



Handlebars.registerHelper('shelf',function(template, selector, cols) {
	return Template.shelf({html: Template[template]()});
});