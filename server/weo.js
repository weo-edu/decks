var app = __meteor_bootstrap__.app;
var require = __meteor_bootstrap__.require;
var express = require('express');
var fs = require('fs');
var path = require('path');

console.log(express.version);

app.post('/upload', function(req,res) {
	console.log('upload',req.files);
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



var cards = [
                {
                        name: '1\'s',
                        graphic: 'addition.gif',
                        problem: {
                                template: '1 + {{a}}  = ?',
                                solution: '1 + a'
                        }
                },
                {
                        name: '2\'s',
                        graphic: 'addition.gif',
                        problem: {
                                template: '2 + {{a}}  = ?',
                                solution: '2 + a'
                        }
                },
                {
                        name: '3\'s',
                        graphic: 'addition.gif',
                        problem: {
                                template: '3 + {{a}}  = ?',
                                solution: '3 + a'
                        }
                },
                {
                        name: '4\'s',
                        graphic: 'addition.gif',
                        problem: {
                                template: '4 + {{a}}  = ?',
                                solution: '4 + a'
                        }
                },
                {
                        name: '5\'s',
                        graphic: 'addition.gif',
                        problem: {
                                template: '5 + {{a}}  = ?',
                                solution: '5 + a'
                        }
                },
                {
                        name: '6\'s',
                        graphic: 'addition.gif',
                        problem: {
                                template: '6 + {{a}}  = ?',
                                solution: '6 + a'
                        }
                },
                {
                        name: '7\'s',
                        graphic: 'addition.gif',
                        problem: {
                                template: '7 + {{a}}  = ?',
                                solution: '7 + a'
                        }
                },
                {
                        name: '8\'s',
                        graphic: 'addition.gif',
                        problem: {
                                template: '8 + {{a}}  = ?',
                                solution: '8 + a'
                        }
                },
                {
                        name: '9\'s',
                        graphic: 'addition.gif',
                        problem: {
                                template: '9 + {{a}}  = ?',
                                solution: '9 + a'
                        }
                }
            ];

    var decks = [
        {
            title: 'Simple Sums',
            image: '/decks/simple-sums.png',
            colorScheme: {
                primary: 'skyblue',
                secondary: 'green'
            }
        }
    ];

Meteor.startup(function() {
	// Decks.remove({});
 //    Cards.remove({});

 //    _.each(cards, function(card){
 //        Cards.insert(card);
 //    });

 //    _.each(decks, function(deck){
 //        deck.cards = _.pluck(Cards.find({}, {fields: ['_id']}).fetch(), '_id');
 //        Decks.insert(deck);
 //    });


	Meteor.publish('Decks', function(){
        return Decks.find({});
	});

    Meteor.publish('Cards', function(){
        return Cards.find({});
    })

	Observer.start();
});