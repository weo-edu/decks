;(function($){
	Meteor.defer(function(){
		$.fn.extend({
			layout: function(options) {
				this.css({
					// display: 'none',
					overflow: 'hidden'
				});

				var defaults = {
					rows: 1,
					cols: 4
				}
				var options =  $.extend(defaults, options);

				var containerWidth = this.innerWidth();
				var slider = this.children();
				var items = slider.children();
				var numItems = items.length;
				var numSlides = Math.ceil(numItems / options.cols);
				var itemWidth = items.outerWidth();

				var gutter = (containerWidth - (itemWidth * options.cols)) / (options.cols * 2);

				items.css({
					margin: gutter
				});

				slider.width((containerWidth*numSlides)/options.rows);


				// setTimeout ensures elements positioned before displayed.
				// var self = this;
				// setTimeout(function(){self.show()}, 0);

			}
		});
	});

})(jQuery);