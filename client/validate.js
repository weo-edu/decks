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



function reset(obj){
	
	switchPages('.active');
	_.each(obj, function(el){
		el.clear();
	})
	$('input').val('');
	$('textarea').val('')
	$('input').removeClass('error');
} 