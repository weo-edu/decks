function validate(){
	var to_check = $('.active .validate');
	var rtrn;
	_.each(to_check, function(el, id){
		el = $(el);
		if(el.attr('id') == 'file')
		{
			if(!el.attr('img'))
			{
				el.addClass('error');
				el.siblings('.upload').addClass('error');
			}
			else
			{
				el.removeClass('error');
				el.siblings('.upload').removeClass('error');
			}
		}
		else if(el.attr('id') == 'init-select')
			if(el.val() == 'Select')
				el.addClass('error');
			else
				el.removeClass('error');
		else
		{
			if(!el.val())
			{
				el.addClass('error');
			}
			else
				el.removeClass('error');
		}
	});
	if(to_check.hasClass('error'))
		return false;
	else return true;
}

// lets make this more meteory
function switchPages(tar){
	var move = $(tar).width();
	var move_in = $('.input-area').not(tar);
	$(tar).animate({left:-move}, 900, 'easeOutExpo', function(){
		$(move_in).toggleClass('active').animate({left:'0px'}, 900, 'easeOutExpo', function(){
			$('#card').toggleClass('flip');
		});
		$(this).toggleClass('active').css('left', '-800px');
	})
}

function reset(obj){
	
	switchPages('.active');
	_.each(obj, function(el){
		el.clear();
	})
	$('input').val('');
	$('textarea').val('')
	$('input').removeClass('error');
} 