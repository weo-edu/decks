var app = __meteor_bootstrap__.app;
var require = __meteor_bootstrap__.require;
var express = require('express');
var fs = require('fs');
var path = require('path');


app.post('/upload', function(req,res) {
	console.log('upload');
	var file = req.files.file.path;
	var fileSlice = file.slice('/tmp/'.length);
	var ext = req.files.file.name;
	ext = path.extname('./'+ext);
	fs.rename(file, process.cwd()+'/.meteor/upload/'+fileSlice+ext);
	console.log('send');

	res.send({path: fileSlice+ext});
	console.log('finish send');
});

//var s = express.static(process.cwd()+"/.meteor/")
app.get('/upload/*',express.static(process.cwd()+"/.meteor/"));


Meteor.startup(function() {
	// Decks.remove({});
	var decks = [];
	_.each(decks,function(deck) {
		// Decks.insert(deck);
	});


	Meteor.publish('Decks', function(){
		var decks = Decks.find({}, {
			// limit: 1
		});
		return decks;
	});
});