function Problemize(card) {
	this.problem = this.parse(card);
}

Problemize.prototype.generate = function(){
	
}

Problemize.prototype.generateVars = function() {
	/*var vars = this.findVars();

	_.each(vars,function(var) {
		_.each(rules,function(rule) {

	})
	});
	*/
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


Problemize.prototype.operators = ['>=', '<=', 'is', '>', '<', '='];


Problemize.prototype.tokenize = function(ruleText){
	var regex = '(' + this.operators.join('|') + ')';
	var toks = new RegExp(regex);
	console.log(regex);
	console.log(ruleText.split(toks));
}

//Problemize.prototype.tokenize('a*3 is whole');

Problemize.prototype.makeOdd = function(n){
	return n | 1;
}

Problemize.prototype.makeEven = function(n){
	return n & 0xFFFFFFFE;
}

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
};

//solve(problem);

var eq = '10/v+17';
var a = 7;


var ops = ['', '', '+', '-', '*', '/'];


calculator.opList = [];
function recordVarOp(t1, t2, op){
	var inverse = false;
	if(t2 == 'v'){
		t2 = t1;
		inverse = true;
	}

	console.log(t1, t2, ops[op]);
	var o = {op: ops[op], term: t2, invert: inverse};
	console.log(o);
	calculator.opList.push(o);
}

calculator.parse(eq);
var res = calculator.parse(eq.replace('v', a));
console.log(a);
console.log(inverseFunc(res));


function inverseFunc(v){
	var transform;
	while(transform = calculator.opList.pop()){
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
}
*/
/*
	1. Parse rules into json object of unary/binary operators, and rules themselves into left/right/op
	2. Translate whole/natural/counting constraints into integer/rational within range
	3. Find most restrictive range
	4. If integer constraint:
		a. Apply formula(s) to min/max to produce min* / max*
		b. If integer constraint, apply inverse formula(s) to randomly generated value within min* / max*
	5. Solve binary constraints by generating random a/b that satisfy unary constraints
*/
