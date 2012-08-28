var app = __meteor_bootstrap__.app;
var require = __meteor_bootstrap__.require;
var express = require('express');
var fs = require('fs');
var path = require('path');
var mongo = require('mongodb');
var Step = require('step');

console.log(express.version);



var cards = [
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
            ];

    var decks = [
        {
            title: 'word arithmetic',
            image: 'arithmetic-4.png',
            colorScheme: {
                primary: 'goldenRod',
                secondary: 'tomato'
            }
        },
        {
            title: 'word arithmetic',
            image: 'arithmetic-4.png',
            colorScheme: {
                primary: 'goldenRod',
                secondary: 'tomato'
            }
        },
        {
            title: 'word arithmetic',
            image: 'arithmetic-4.png',
            colorScheme: {
                primary: 'goldenRod',
                secondary: 'tomato'
            }
        },
        {
            title: 'word arithmetic',
            image: 'arithmetic-4.png',
            colorScheme: {
               primary: 'goldenRod',
               secondary: 'tomato'
            }
        }
    ];



Meteor.startup(function() {
	/*Decks.remove({});
    Cards.remove({});

    _.each(cards, function(card){
        Cards.insert(card);
    });

    _.each(decks, function(deck){
        deck.cards = _.pluck(Cards.find({}, {fields: ['_id']}).fetch(), '_id');
        Decks.insert(deck);
    });*/

Meteor.publish('decks', function() {
  return Decks.find({});
});

Meteor.publish('cards',function() {
  return Cards.find({});
})

	Meteor.publish('Decks', function(){
    return Decks.find({});
	});

  Meteor.publish('Cards', function(){
      return Cards.find({});
  })

	Observer.start();
});