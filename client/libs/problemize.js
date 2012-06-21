function Problemize(template) {
	this.template = template;
	this.rules = [];
}

Problemize.prototype.setTemplate = function(template) {
	this.template  = template;
}

Problemize.prototpe.addRule = function(rule) {
	this.rules.push(rule);
}

Problemize.prototype.generateVars = function() {
	var vars = this.findVars();

	_.each(vars,function(var) {
		_.each(rules,function(rule) {

	})
	});
	
}

Problemize.prototype.organize

Problemize.prototype.findVars = function() {
	var vars = [];
	HB.registerHelper('_emit',function(name) {
		vars.push(name);
	});
	HB.compile(template);
	delete HB.helpers['_emit'];
	return vars;
}