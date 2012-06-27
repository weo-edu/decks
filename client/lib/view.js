function View(){
	var refs = [];

	var view = function(tmpl, attr, val){
		refs.push([tmpl,attr]);
		Template[tmpl][attr] = val;
	};
	view.destroy = function() {
		_.each(refs, function(val, key){
			delete Template[val[0]][val[1]];
		});
	}
	return view;
}
