$.fn.extend({
	    animateInsert: function(type, container, callback, endCoords){
    	callback = callback || function(){};
		var offset = this.offset();

		var stage = $('<div class="stage" style="position: absolute; z-index: 99; overflow: hidden;"></div>');

		stage.width($(window).width()).height($(window).height());

    	$('body').prepend(stage);

    	var new_el = this.clone().attr('style','').css('visibility', 'hidden');
    	(container)[type](new_el);

    	this.css({'position': 'absolute'}).css(transformPrefix, 'translate3d(' + offset.left + 'px, ' + offset.top + 'px, 0)').prependTo(stage);

    	var new_offset = new_el.offset();	    	
    	
    	var that = this;
		setTimeout(function(){    			
			if(endCoords)
				new_offset = endCoords;

			var rotateY = new_offset.y ? new_offset.y : 0;
			var translateZ = new_offset.z ? new_offset.z : 0;

			that.css(transformPrefix, 'translate3d(' + new_offset.left + 'px, ' + new_offset.top + 'px, ' + translateZ + 'px) rotateY('+ rotateY + 'deg)');
		}, 0);

		this.get(0).addEventListener(transitionEndEvent, finish, false);

		return new_el;

		function finish() {
    		new_el.css('visibility', 'visible');
    		
    		//	Use setTimeout to  assure new_el 
    		//	is visibile before removing animated
    		//	element to prevent flicker in FF.
    		////////////////////////////////////////
			setTimeout(function(){stage.remove()},10);
			callback(new_el);		
		}
    }
});