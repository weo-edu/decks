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
                        name: '1\'s',
                        graphic: '/decks/simple-sums/1.png',
                        problem: {
                                template: '1 + {{a}}  = ?',
                                solution: '1 + a'
                        }
                },
                {
                        name: '2\'s',
                        graphic: '/decks/simple-sums/2.png',
                        problem: {
                                template: '2 + {{a}}  = ?',
                                solution: '2 + a'
                        }
                },
                {
                        name: '3\'s',
                        graphic: '/decks/simple-sums/3.png',
                        problem: {
                                template: '3 + {{a}}  = ?',
                                solution: '3 + a'
                        }
                },
                {
                        name: '4\'s',
                        graphic: '/decks/simple-sums/4.png',
                        problem: {
                                template: '4 + {{a}}  = ?',
                                solution: '4 + a'
                        }
                },
                {
                        name: '5\'s',
                        graphic: '/decks/simple-sums/5.png',
                        problem: {
                                template: '5 + {{a}}  = ?',
                                solution: '5 + a'
                        }
                },
                {
                        name: '6\'s',
                        graphic: '/decks/simple-sums/6.png',
                        problem: {
                                template: '6 + {{a}}  = ?',
                                solution: '6 + a'
                        }
                },
                {
                        name: '7\'s',
                        graphic: '/decks/simple-sums/7.png',
                        problem: {
                                template: '7 + {{a}}  = ?',
                                solution: '7 + a'
                        }
                },
                {
                        name: '8\'s',
                        graphic: '/decks/simple-sums/8.png',
                        problem: {
                                template: '8 + {{a}}  = ?',
                                solution: '8 + a'
                        }
                },
                {
                        name: '9\'s',
                        graphic: '/decks/simple-sums/9.png',
                        problem: {
                                template: '9 + {{a}}  = ?',
                                solution: '9 + a'
                        }
                }
            ];

    var decks = [
        {
            title: 'Simple Sums',
            image: '/decks/simple-sums/simple-sums.png',
            colorScheme: {
                primary: 'skyblue',
                secondary: 'green'
            }
        },
        {
            title: 'Mini Minus',
            image: '/decks/mini-minus/mini-minus.png',
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