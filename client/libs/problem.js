

function Problem(problem) {
	this.template = problem.template
	this.vars = {};
	this.vars_idx = 0;
	this.sol = problem.solution;
}

Problem.prototype.generate = function() {
	var self = this;

	HB.registerHelper('range',function(start, end, ctx) {
		start = parseInt(start);
		end = parseInt(end);
		var v = Math.floor((Math.random()*end)+start);
		self.vars[String.fromCharCode(self.vars_idx+97)] = v;
		self.vars_idx++;
		return ''+v;
	});

	var template = HB.compile(this.template);
	this.question = template({});
	return this.question;
}

Problem.prototype.isSolution = function(sol) {
	var vars = this.vars;
	return eval(this.sol) == sol;
}

