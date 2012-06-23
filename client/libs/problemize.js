var card = {
	template: '{{a}}*5+{{b}}',
	rules: [
	'(a*3)+4-7 > 10',
	'a is whole',
	'a+b < 3'
	]
};

Problemize.Problem = function(card){
	this.card = card;
	this.vars = this.findVars();
	return this.collateRules();
}

setTimeout(function(){
	new Problemize(card);
},200);

function Problemize(card) {
	this.problem = new Problemize.Problem(card);
	this.normalizeConstraints();
}

Problemize.Problem.prototype.operators = ['>=', '<=', 'is', '>', '<', '='];


Problemize.Problem.prototype.decomposeRule = function(str){
	var regex = '(' + this.operators.join('|') + ')';
	var toks = new RegExp(regex);
	var parts = str.split(toks);
	if(parts.length != 3){
		throw new Error("Error parsing rule, unable to decompose into left/op/right");
	}

	return {left: parts[0].trim(), op: parts[1].trim(), right: parts[2].trim()};
}

Problemize.Problem.prototype.collateRules = function(){
	var self = this;
	var problem = {vars: {}, constraints: []};

	_.each(this.card.rules, function(val, key){
		var rule = self.decomposeRule(val);
		var varList = rule.left.match(/[a-zA-Z]+/g);
		console.log(rule, varList);

		_.each(varList, function(val, key){
			if(!~self.vars.indexOf(val)){
				console.log(self);
				throw new Error("Rule contains a variable not referenced in the problem template");
			}
		});

		if(varList.length == 1){
			if(!problem.vars[varList[0]])
				problem.vars[varList[0]] = [];

			problem.vars[varList[0]].push(rule);
		}
		else if(varList.length > 1){
			problem.constraints.push(rule);
		}
		else{
			throw new Error("Rules cannot contain zero variables");
		}
	});

	return problem;
}

Problemize.Problem.prototype.findVars = function() {
	var vars = [];
	HB.registerHelper('_emit',function(name) {
		vars.push(name);
	});
	HB.compile(this.card.template)({});
	delete HB.helpers['_emit'];
	return vars;
}

Problemize.prototype.normalizeConstraints = function() {
	_.each(this.problem.vars, function(constraints, v) {
		_.each(constraints,function(constraint, key) {
			if (constraint.op != 'is') {
				constraint.right = invert(constraint.left.replace(v, 'v'))(parseInt(constraint.right));
				constraint.left = v;
				console.log(constraint);
			}
		});
	});
}
/*
var problemDefaults = {
	min: -12,
	max: 100
}
var problem = {
	vars: {
		a:{
			constraints: [
				{left: '(a/3)+2', op: 'is', right: 'whole'}
			]
		}
	}
	constraints:
	[
		{}
	]
};*/

//solve(problem);

function invert(eq){
	var opList = [];
	console.log('inverting', eq);

	var ops = ['', '', '+', '-', '*', '/'];
	calculator.recordVarOp = function(t1, t2, op){
		var inverse = false;
		if(t2 == 'v'){
			t2 = t1;
			inverse = true;
		}

		var o = {op: ops[op], term: t2, invert: inverse};
		opList.push(o);
	}

	calculator.parse(eq);

	console.log('opList', _.clone(opList));
	return function(v){
		var transform;
		while(transform = opList.pop()){
			switch(transform.op){
				case '+':
				v -= transform.term;
				break;
				case '*':
				v /= transform.term;
				break;
				case '-':
				if(transform.invert){
					v = -v;
				}
				v += transform.term;
				break;
				case '/':
				if(transform.invert){
					v = Math.pow(v, -1);
				}
				v *= transform.term;
				break;
			}
		}

		return v;
	}
}

/*
function solve(p){
	_.each(p.vars, function(value, key){
		_.each(value.constraints, function(constraint, key){
			var min = compute(problemDefaults.min, constraint.left);
			var max = compute(problemDefaults.max, constraint.left);

			min = Math.ceil(min);
			max = Math.floor(max);
			console.log('min', min);
			console.log('max', max);	
		})
	})
}

function compute(a, rule){
	return eval(rule);
}


function randInRange(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
/*
	1. Parse rules into json object of unary/binary operators, and rules themselves into left/right/op
	2. Translate whole/natural/counting constraints into integer/rational within range
	3. Find most restrictive range
	4. If integer constraint:
		a. Apply formula(s) to min/max to produce min* / max*
		b. If integer constraint, apply inverse formula(s) to randomly generated value within min* / max*
	5. Solve binary constraints by generating random a/b that satisfy unary constraints
*/
