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
		var X = $M(_.map(bins, function(bin) { return [bin.percentage || .00001, 1]; })),
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

	/*
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
			obj.stats.bins.grade = obj.stats.bins.grade || {attempts: 0, correct: 0, time: 0};
			obj.stats.bins.grade.attempts += initialBoost;
			obj.stats.bins.grade.correct += Math.floor(initialBoost * percentageCutoff);
		}

		var sorted = _.sortBy(obj.stats.bins, function(bin, grade) {
			obj.stats.bins[grade].grade = grade;
			bin.grade = Number(grade);
			bin.percentage = Math.floor(bin.correct / bin.attempts * 100);
			return bin.percentage;
		});

		var cutoff;
		_.find(obj.stats.bins, function(bin, grade) {
			bin.percentage = Math.floor(bin.correct / bin.attempts * 100);
			bin.grade = Number(grade);
			if(!cutoff || cutoff.percentage < bin.percentage) {
				cutoff = grade;
			}

			if(bin.percentage > percentageCutoff) {
				cutoff = grade;
				return true;
			}
		});

		if(typeof cutoff === 'undefined') {
			return obj.grade;
		}

		var bin = obj.stats.bins[cutoff];
		var bins = [
			obj.stats.bins[bin.grade-1],
			bin,
			obj.stats.bins[bin.grade+1]
		];

		bins = _.compact(bins);			
		var result = obj.grade;
		try{
			result = (bins.length > 1 && fn(bins));
		} catch(e) {

		}
		return result;
	}


	function regrade(obj) {
		console.log('regrading card');
		var grade = computeGrade(obj);
		if(grade) {
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

	function displayPoints(g) {
		var cl = Meteor.user().level;
		return (points(g) / points(1+cl/60)) * (2*cl+45);
	}
	function pointsToNextLevel(l) {
		return .5*l*(Math.pow(3, 14/(1+Math.exp(-.25*(1+l/60-8)))))+300;
	}

	function points(g) {
		return Math.pow(3, 14 / (1 + Math.exp((-.25) * (g - 8))));
	}

	global.pointTest = function(g) {
		return 14 / (1 + Math.exp((-.25) * (g-8)));
	};

	global.regrade = regrade;
	global.displayPoints = displayPoints;
	global.augmentPoints = augmentPoints;
	global.pointsToNextLevel = pointsToNextLevel;
	global.points = points;
	global.computeGrade = computeGrade;
	global.augmentStats = augmentStats;
	*/

	Stats = {
		regrade: function(obj) {
			if(typeof obj === 'string')
				obj = Cards.findOne(obj);
			
			var grade = Stats.computeGrade(obj);
			if(grade && !Meteor.is_client) {
				Cards.update(obj._id, {$set: {'stats.grade': grade}});
			}

			return grade;
		},
		points: function(g) {
			return Math.pow(3, 14 / (1 + Math.exp((-.25) * (g - 8))));
		},
		levelPoints: function(l) {
			return .5*l*(Math.pow(3, 14/(1+Math.exp(-.25*(1+l/60-8)))))+300;
		},
		augmentPoints: function(uid, points) {
			Meteor.users.findAndModify(uid,
				[['_id', 'asc']],
				{$inc: {points: -points}},
				{'new': true},
				function(err, res) {
					if(err) throw err;

					if(res.points < 0) {
						console.log('level up', res.username, Stats.levelPoints(res.level+1));
						Meteor.users.update(uid, {
							$inc: {
								level: 1, 
								points: Stats.levelPoints(res.level+1)
							}
						});
					}
				}
			);
		},
		updateCardStats: function(query, stats, grade) {
			var update = {$inc: {}};
			_.each(stats, function(val, key) {
				update['$inc']['stats.' + key] = val;
				update['$inc']['stats.bins.' + grade + '.' + key] = val;
			});
			update['$inc']['stats.updates'] = 1;
			var obj = Cards.findAndModify(query, 
				[['_id', 'asc']], 
				update, 
				{'new': true, upsert: 1}, 
				function(err, res) {
					if(err) throw err;
				
					if(res.stats.updates % regradeInterval  === 0) {
						Stats.regrade(res);
					}
				});
		},
		initialize: function(o) {
			o.stats = {
				bins: {

				}
			};
			if(o.grade) o.stats.bins[o.grade] = {};
			return o;
		},
		getBinCluster: function(bins) {
			var cutoff = null;
			_.find(bins, function(bin, grade) {
				if(!cutoff || cutoff.percentage < bin.percentage)
					cutoff = parseInt(grade, 10);

				if(bin.percentage > percentageCutoff) {
					cutoff = parseInt(grade, 10);
					return true;
				}
			});

			if(cutoff === null) return cutoff;
			return _.compact([bins[cutoff-1], bins[cutoff], bins[cutoff+1]]);
		},
		computeGrade: function(obj, fn) {
			var bins = (obj.stats && obj.stats.bins) || Stats.initialize(obj).stats.bins;
			fn = fn || weightedRegression;

			if(obj.grade) {
				bins[obj.grade] = bins[obj.grade] || {attempts: 0, correct: 0, time: 0};
				bins[obj.grade].attempts += initialBoost;
				bins[obj.grade].correct += Math.floor(initialBoost * percentageCutoff);
			}

			_.each(bins, function(bin, grade) {
				bin.percentage = Math.floor(bin.correct / bin.attempts * 100);
				bin.grade = parseInt(grade, 10);
			});

			var cluster = Stats.getBinCluster(bins),
				result = null;
			try{
				if(cluster && cluster.length > 1)
					result = fn(cluster);
				else
					result = obj.grade;
			} finally {
				return result;
			}
		},

		cardTime: function(cardId) {
			//XXX where does subscribe for cards happen
			var card = Cards.findOne(cardId);
			var grade_stats = StatsCollection.findOne({name: 'gradeStats'});
			if (grade_stats) grade_stats = grade_stats[card.grade];
			//console.log('grad_stats', grade_stats);
			//console.log('card_stats', card.stats);
			var stats = {};
			if (card.stats && card.stats.correct >= 10) {
				var average_time = card.stats.correct_time / card.stats.correct;
				stats.u  = average_time;
				var std = Math.sqrt((card.stats.correct_time_squared/card.stats.correct) - Math.pow(average_time,2));
				stats.s = std;
			} else if (grade_stats && grade_stats.correct > 0) {
				var average_time = grade_stats.correct_time / grade_stats.correct;
				stats.u = average_time;
				var std = Math.sqrt((grade_stats.correct_time_squared/grade_stats.correct) - Math.pow(average_time,2));
				stats.s = std;
			} else {
				stats.u = 5;
				stats.s = 1;
			}
			return stats;
		},

		normalSample: function(mean, std) {
			var dist = Math.sqrt(-1 * Math.log(Math.random()));
			var angle = 2 * Math.PI * Math.random();
			return dist*Math.sin(angle) * std + mean;
		}

	}


	global.Stats = Stats;
})(Meteor.is_client ? window : global);