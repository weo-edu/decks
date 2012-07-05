var express = require('express');

app.post('/upload', function(req,res) {
	var file = req.files.file.path;
	var fileSlice = file.slice('/tmp/'.length);
	var ext = req.files.file.name;
	ext = path.extname('./'+ext);
	fs.rename(file, process.cwd()+'/public/'+fileSlice+ext);
	console.log('send');

	res.send(fileSlice+ext);
	console.log('finish send');
});
