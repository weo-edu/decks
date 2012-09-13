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
						var newPoints = res.points,
							newLevel = res.level;

						while(newPoints < 0)
							newPoints += Stats.levelPoints(++newLevel);

						console.log('level up', res.username, Stats.levelPoints(res.level+1));
						Meteor.users.update(uid, {
							$set: {
								level: newLevel, 
								points: newPoints
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
				bins[obj.grade].correct += Math.floor(initialBoost * (percentageCutoff/100));
			}

			_.each(bins, function(bin, grade) {
				bin.percentage = Math.floor(bin.correct / bin.attempts * 100);
				bin.grade = parseInt(grade, 10);
			});

			var cluster = Stats.getBinCluster(bins),
				result = null;
			try {
				if(cluster && cluster.length > 1) {
					if(cluster[0].percentage >= cluster[1].percentage)
						result = cluster[0].grade;
					else
						result = fn(cluster);
				}
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