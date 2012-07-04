var app = __meteor_bootstrap__.app;
var require = __meteor_bootstrap__.require;
var express = require('express');
var fs = require('fs');
var path = require('path');


app.post('/upload', function(req,res) {
	var file = req.files.file.path;
	var fileSlice = file.slice('/tmp/'.length);
	var ext = req.files.file.name;
	ext = path.extname('./'+ext);
	fs.rename(file, process.cwd()+'/.meteor/upload/'+fileSlice+ext);
	console.log('send');

	res.send({path: fileSlice+ext});
	console.log('finish send');
});

var s = express.static(process.cwd()+"/.meteor/")
app.get('/upload/*',function(req,res,next) {
	return s(req,res,next);
});


Meteor.startup(function() {
	Decks.remove({});
	var decks = [
		{
			name: 'arithmetic',
			graphic: 'arithmetic.png',
			cards: [
				{
					name: 'addition',
					graphic: 'addition.gif',
					problem: {
						template: '\\[{{a}} + {{b}}\\]',
						solution: 'a + b',
						rules: [
							'a is integer',
							'b is integer',
							'a < b',
							'b > 5'
						]
					}
				},
				{
					name: 'subtraction',
					graphic: 'subtraction.jpeg',
					problem: {
						template: '\\[{{a}} - {{b}} \\]',
						solution: 'a - b',
						rules: [
							'a is integer',
							'b is integer',
							'a > b',
							'b < 2'
						]
					}
				},
				{
					name: 'multiplication',
					graphic: 'multiplication.jpg',
					problem: {
						template: '\\[{{a}} \\times {{b}} \\]',
						solution: 'a * b',
						rules: [
							'a is integer',
							'b is integer',
							'a > 2',
							'a < 6'
						]
					}
				}
			]
		},
		{
			name: 'arithmetic',
			graphic: 'arithmetic-3.jpeg',
			cards: [
				{
					name: 'addition',
					graphic: 'addition.gif',
					problem: {
						template: '\\[{{a}} + {{b}}\\]',
						solution: 'a + b',
						rules: [
							'a is integer',
							'b is integer',
							'a < b',
							'b > 5'
						]
					}
				},
				{
					name: 'subtraction',
					graphic: 'subtraction.jpeg',
					problem: {
						template: '\\[{{a}} - {{b}} \\]',
						solution: 'a - b',
						rules: [
							'a is integer',
							'b is integer',
							'a > b',
							'b < 2'
						]
					}
				},
				{
					name: 'multiplication',
					graphic: 'multiplication.jpg',
					problem: {
						template: '\\[{{a}} \\times {{b}} \\]',
						solution: 'a * b',
						rules: [
							'a is integer',
							'b is integer',
							'a > 2',
							'a < 6'
						]
					}
				}
			]
		},
		{
			name: 'arithmetic',
			graphic: 'word_arithmetic.jpeg',
			cards: [
				{
					name: 'addition',
					graphic: 'addition.gif',
					problem: {
						template: '\\[{{a}} + {{b}}\\]',
						solution: 'a + b',
						rules: [
							'a is integer',
							'b is integer',
							'a < b',
							'b > 5'
						]
					}
				},
				{
					name: 'subtraction',
					graphic: 'subtraction.jpeg',
					problem: {
						template: '\\[{{a}} - {{b}} \\]',
						solution: 'a - b',
						rules: [
							'a is integer',
							'b is integer',
							'a > b',
							'b < 2'
						]
					}
				},
				{
					name: 'multiplication',
					graphic: 'multiplication.jpg',
					problem: {
						template: '\\[{{a}} \\times {{b}} \\]',
						solution: 'a * b',
						rules: [
							'a is integer',
							'b is integer',
							'a > 2',
							'a < 6'
						]
					}
				}
			]
		},
		{
			name: 'arithmetic',
			graphic: 'arithmetic-2.jpeg',
			cards: [
				{
					name: 'addition',
					graphic: 'addition.gif',
					problem: {
						template: '\\[{{a}} + {{b}}\\]',
						solution: 'a + b',
						rules: [
							'a is integer',
							'b is integer',
							'a < b',
							'b > 5'
						]
					}
				},
				{
					name: 'subtraction',
					graphic: 'subtraction.jpeg',
					problem: {
						template: '\\[{{a}} - {{b}} \\]',
						solution: 'a - b',
						rules: [
							'a is integer',
							'b is integer',
							'a > b',
							'b < 2'
						]
					}
				},
				{
					name: 'multiplication',
					graphic: 'multiplication.jpg',
					problem: {
						template: '\\[{{a}} \\times {{b}} \\]',
						solution: 'a * b',
						rules: [
							'a is integer',
							'b is integer',
							'a > 2',
							'a < 6'
						]
					}
				}
			]
		},
		{
			name: 'arithmetic',
			graphic: 'arithmetic-3.jpeg',
			cards: [
				{
					name: 'addition',
					graphic: 'addition.gif',
					problem: {
						template: '\\[{{a}} + {{b}}\\]',
						solution: 'a + b',
						rules: [
							'a is integer',
							'b is integer',
							'a < b',
							'b > 5'
						]
					}
				},
				{
					name: 'subtraction',
					graphic: 'subtraction.jpeg',
					problem: {
						template: '\\[{{a}} - {{b}} \\]',
						solution: 'a - b',
						rules: [
							'a is integer',
							'b is integer',
							'a > b',
							'b < 2'
						]
					}
				},
				{
					name: 'multiplication',
					graphic: 'multiplication.jpg',
					problem: {
						template: '\\[{{a}} \\times {{b}} \\]',
						solution: 'a * b',
						rules: [
							'a is integer',
							'b is integer',
							'a > 2',
							'a < 6'
						]
					}
				}
			]
		},
		{
			name: 'arithmetic',
			graphic: 'arithmetic-4.png',
			cards: [
				{
					name: 'addition',
					graphic: 'addition.gif',
					problem: {
						template: '\\[{{a}} + {{b}}\\]',
						solution: 'a + b',
						rules: [
							'a is integer',
							'b is integer',
							'a < b',
							'b > 5'
						]
					}
				},
				{
					name: 'subtraction',
					graphic: 'subtraction.jpeg',
					problem: {
						template: '\\[{{a}} - {{b}} \\]',
						solution: 'a - b',
						rules: [
							'a is integer',
							'b is integer',
							'a > b',
							'b < 2'
						]
					}
				},
				{
					name: 'multiplication',
					graphic: 'multiplication.jpg',
					problem: {
						template: '\\[{{a}} \\times {{b}} \\]',
						solution: 'a * b',
						rules: [
							'a is integer',
							'b is integer',
							'a > 2',
							'a < 6'
						]
					}
				}
			]
		},
		{
			name: 'word arithmetic',
			graphic: 'word_arithmetic.jpeg',
			cards: [
				{
					name: 'word addition',
					graphic: 'addition.gif',
					problem: {
						template: 'What is {{a}} plus {{b}}?',
						solution: 'a + b'
					}
				},
				{
					name: 'word subtraction',
					graphic: 'subtraction.jpeg',
					problem: {
						template: 'What is {{a}} minus {{b}}?',
						solution: 'a - b'
					}
				},
				{
					name: 'word multiplication',
					graphic: 'multiplication.jpg',
					problem: {
						template: 'What is {{a}} times {{b}}?',
						solution: 'a * b'
					}
				}
			]
		}
	]
	_.each(decks,function(deck) {
		Decks.insert(deck);
	})
});