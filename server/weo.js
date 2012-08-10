var app = __meteor_bootstrap__.app;
var require = __meteor_bootstrap__.require;
var express = require('express');
var fs = require('fs');
var path = require('path');

console.log(express.version);

app.post('/upload', function(req,res) {
	console.log('upload',req.files.files[0]);
    var upload = req.files.files[0];
	var file = upload.path;
	var fileSlice = file.slice('/tmp/'.length);
	var ext = upload.name;
	ext = path.extname('./'+ext);
	fs.rename(file, process.cwd()+'/.meteor/upload/'+fileSlice+ext);
	console.log('send');

	res.send({path: fileSlice+ext});
	console.log('finish send');
});

//var s = express.static(process.cwd()+"/.meteor/")
app.get('/upload/*',express.static(process.cwd()+"/.meteor/"));


Meteor.startup(function() {
	Decks.remove({});
	var decks = [
    {
        title: 'word arithmetic',
        render: {
        	image: 'arithmetic-4.png',
        	colorScheme: {
        		primary: 'goldenRod',
        		secondary: 'tomato'
        	}
        },
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
            },
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
            },
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
            }
        ]
    }

	];
	_.each(decks,function(deck) {
		Decks.insert(deck);
	});


	Meteor.publish('Decks', function(){
		var decks = Decks.find({}, {
			// limit: 1
		});
		return decks;
	});
});