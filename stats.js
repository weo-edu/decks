;(function(global) {
	var regradeInterval = 5;
	var percentageCutoff = 66;
	var initialBoost = 100;

	function linearRegression(bins) {
		var X = $M(_.map(bins, function(bin){ return [bin.percentage, 1]; })),
			y = $V(_.pluck(bins, 'grade'));

		var theta = X.transpose().
			multiply(X).
			inverse().
			multiply(X.transpose()).multiply(y);

		return theta.dot([percentageCutoff, 1]);
	}

	function weightedRegression(bins) {
		var X = $M(_.map(bins, function(bin) { return [bin.percentage, 1]; })),
			y = $V(_.pluck(bins, 'grade')),
			W = $V(_.pluck(bins, 'attempts')).toDiagonalMatrix();

		var theta = X.transpose().
			multiply(W).
			multiply(X).
			inverse().
			multiply(X.transpose().
				multiply(W).multiply(y));

		return theta.dot([percentageCutoff, 1]);
	}

	function computeGrade(obj, fn) {
		fn = fn || weightedRegression;

		if(! obj.stats || !obj.stats.bins) {
			obj.stats = {
				bins: {
				}
			};
			obj.stats.bins[obj.grade] = {};
			//console.log(obj);
			//throw new Error('Must call computeGrade on an object with bins');
		}

		if(obj.grade) {
			obj.stats.bins.grade.attempts += initialBoost;
			obj.stats.bins.grade.correct += Math.floor(initialBoost * percentageCutoff);
		}

		var sorted = _.sortBy(obj.stats.bins, function(bin, grade) {
			obj.stats.bins[grade].grade = grade;
			bin.grade = Number(grade);
			bin.percentage = Math.floor(bin.correct / bin.attempts * 100);
			return bin.percentage;
		});

		var bin = _.find(sorted, function(bin) { 
			return bin.percentage > percentageCutoff;
		});

		bin = bin || sorted[sorted.length-1];
		var bins = [
			obj.stats.bins[bin.grade-1],
			bin,
			obj.stats.bins[bin.grade+1]
		];

		bins = _.compact(bins);

		return bins.length > 1 && fn(bins);
	}


	function regrade(obj) {
		var grade = computeGrade(obj);
		if(grade) {
			console.log('updating grade of ', obj._id, 'to', grade);
			Cards.update(obj._id, {$set: {'stats.grade': grade}});
		}
	}

	function augmentStats(collection, item, data, bin) {
		var update = {$inc: {}};
		_.each(data, function(val, key) {
			update['$inc']['stats.' + key] = val;
			if(bin) update['$inc']['stats.bins.' + bin + '.' + key] = val;
		});

		if(bin) {
			update['$inc']['stats.updates'] = 1;
			var obj = collection.findAndModify(item, 
				[['_id', 'asc']], 
				update, 
				{'new': true}, function(err, res) {
					if(err) throw err;
					
					if(res.stats.updates % regradeInterval  === 0) {
						regrade(res);
					}
				});
		} else {
			collection.update(item, update, {multi: 0, upsert: 1}, function(err) {
				err && console.log('augmentStats update error', err);
			});
		}
	}


	function augmentPoints(uid, points) {
		Meteor.users.findAndModify(uid, 
			[['_id', 'asc']], 
			{$inc: {points: -points}},
			{'new': true},
			function(err, res) {
				if(err) throw err;

				if(res.points < 0) {
					console.log('level up', res.username, pointsToNextLevel(res.level+1));
					//	Level up!
					Meteor.users.update(uid, {$inc: {level: 1, points: pointsToNextLevel((res.level || 0)+1)}});
				}
			}
		);
	}

	function pointsToNextLevel(l) {
		return .5*l*(Math.pow(3, 14/(1+Math.exp(-.25*(1+l/60-8)))))+300;
	}

	function points(card) {
		var g = (card.stats && card.stats.grade) || card.grade || 4;
		return Math.pow(3, 14 / (1 + Math.exp((-.25) * (g - 8))));
	}

	global.augmentPoints = augmentPoints;
	global.pointsToNextLevel = pointsToNextLevel;
	global.points = points;
	global.computeGrade = computeGrade;
	global.augmentStats = augmentStats;
})(Meteor.is_client ? window : global);