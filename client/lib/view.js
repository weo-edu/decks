function View(){

	var refs = [];

	_.each(Template,function(template,template_name) {
		console.log('template',template_name);
		_.each(['events'].concat(template.attrs),function(attr) {
			console.log('attr',attr);
			template.__defineSetter__(attr,function(value) {
				template['_'+attr] = value;
				refs.push([template_name,attr]);
			})
			template.__defineGetter__(attr,function() {
				return template['_'+attr];
			})
		});
	});

	return function() {
		_.each(refs, function(val, key){
			delete Template[val[0]][val[1]];
			delete Template[val[0]]['_'+val[1]];
		});
	}
}
