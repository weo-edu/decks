

function Problem(problem) {
	Emitter.call(this);
	
	this.problem = problem
	this.template = problem.template;
	this.sol = problem.solution;
	this.assignment = null;
}

Problem.prototype = new Emitter;

Problem.prototype.generate = function() {
	var self = this;
	var problemize = new Problemize(this.problem);
	problemize.on('error',function(error) {
		self.emit('error',err);
	})
	this.assignment = problemize.generate();
	return HB.compile(this.template)(this.assignment);
}

Problem.prototype.isSolution = function(sol) {
	return this.getSolution() == sol;
}

Problem.prototype.getSolution = function(sol) {
	var vars = this.assignment;
	var eval_string = '';
	_.each(vars,function(val,name) {
		eval_string += 'var ' + name + ' = ' + val + ';';
	});
	eval_string += this.sol;
	return eval(eval_string);
}
