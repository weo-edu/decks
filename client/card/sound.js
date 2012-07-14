;(function(){
	function playSound(sound, muted, path) {
		path = path || '/app!common/sounds/';
		var a = document.createElement('audio');
		var ext = !!(a.canPlayType && a.canPlayType('audio/mpeg;')) ? '.mp3' : '.ogg';
		var soundObj = new Audio(path + sound + ext);

		if(!muted)
			soundObj.play();
	}

	window.playSound = playSound;
})();