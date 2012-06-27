

function Problem(problem) {
	this.problemize = new Problemize(problem);
	this.template = problem.template;
	this.sol = problem.solution;
	this.assignment = null;
}

Problem.prototype.generate = function() {
	this.assignment = this.problemize.generate();
	console.log(this.template);
	console.log(this.assignment);
	return HB.compile(this.template)(this.assignment);
}

Problem.prototype.isSolution = function(sol) {
	var vars = this.assignment;
	var eval_string = '';
	_.each(vars,function(val,name) {
		eval_string += 'var ' + name + ' = ' + val + ';';
	});
	eval_string += this.sol;
	return eval(eval_string) == sol;
}

