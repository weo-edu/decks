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
			l++;
			return .5*l*(Math.pow(3, 14/(1+Math.exp(-.25*(1+l/60-8)))))+300;
		},
		augmentPoints: function(uid, points) {
			Meteor.users.findAndModify(uid,
				[['_id', 'asc']],
				{ $inc: { points: -points } },
				{ 'new': true },
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
			var update = { $inc: { } };
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
					if(cluster[0].percentage >= cluster[1].percentage
						|| cluster[0].percentage >= percentageCutoff)
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
			var stats = {};
			if (card.stats && card.stats.correct >= 10) {
				var average_time = card.stats.correct_time / card.stats.correct;
				stats.mu  = average_time / 1000; // in seconds
				var std = Math.sqrt((card.stats.correct_time_squared/card.stats.correct) - Math.pow(average_time,2));
				stats.s = std / 1000; // in seconds

				//XXX double check this
				stats.lambda = 1 / ((1000 * card.stats.inverse_correct_time) / card.stats.correct - 1 / stats.mu); //in seconds

			} else if (grade_stats && grade_stats.correct > 0) {
				var average_time = grade_stats.correct_time / grade_stats.correct;
				stats.mu = average_time / 1000; // in seconds
				var std = Math.sqrt((grade_stats.correct_time_squared/grade_stats.correct) - Math.pow(average_time,2));
				stats.s = std / 1000; // in seconds
				stats.lambda = 1 / ((1000 * grade_stats.inverse_correct_time) / grade_stats.correct - 1 / stats.mu); //in seconds
			} else {
				stats.mu = 1;
				stats.s = 1;
				stats.lambda = 1;
			}
			return stats;
		},

		erf: function(x) {
	    var sign = x >= 0  ? 1 : -1;
	    x = Math.abs(x);

	    var a1 =  0.254829592;
	    var a2 = -0.284496736;
	    var a3 =  1.421413741;
	    var a4 = -1.453152027;
	    var a5 =  1.061405429;
	    var p  =  0.3275911;

	    var t = 1.0/(1.0 + p*x);
	    var y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
	    return sign*y; 
		},

		erfc: function(x) {
			return 1 - Stats.erf(x);
		},

		normalSample: function(mean, std) {
			var dist = Math.sqrt(-1 * Math.log(Math.random()));
			var angle = 2 * Math.PI * Math.random();
			return dist*Math.sin(angle) * std + mean;
		},

		inverseGaussCDF: function(x, mu, lambda, offset) {
			var offset = 0;
			var part1 = (jstat.pnorm(Math.sqrt(lambda / (x + offset)) * (((x + offset) / mu) - 1 )));
			var part2 = Math.exp(2 * lambda / mu);
			var part3 = jstat.pnorm(-Math.sqrt(lambda / (x + offset)) * (((x + offset) / mu) + 1 ));
			if (part3 === 0)
				return part1
			else
				return part1 + part2 * part3;
		},

		inverseGaussSample: function(mu, lambda) {
			// http://en.wikipedia.org/wiki/Inverse_Gaussian_distribution#Generating_random_variates_from_an_inverse-Gaussian_distribution
			var v = Stats.normalSample(0, 1);
			var y = v * v;
			//XXX wtf
			//var x = mu + (mu * mu * y) / (2 * lambda) - (mu / (2 * lambda)) * Math.sqrt(4 * mu * lambda * y + mu * mu * y *);
			var test = Math.random();
			if (test <= mu / ( mu + x))
				return x;
			else
				return (mu * mu) / x;
		},

		inverseGaussQuantile: function(x, mu, lambda, options) {
			options = options || {};
			var precision = options.precision || .01;
			var max_iterations = options.max_iterations || 50;
			var iterations = 0;

			function findQuantile(a, b) {
				iterations++;
				var mid = (b - a) / 2 + a;
				if ( (b - a) < precision || iterations >= max_iterations)
					return mid;

				var cdf = Stats.inverseGaussCDF(mid, mu, lambda, options.offset);
				if (x < cdf)
					return findQuantile(a, mid);
				else
					return findQuantile(mid, b);
			}

			// set max to be 5 std deviations from mean
			return findQuantile(0, 5 * Math.sqrt(Math.pow(mu,3) / lambda) + mu);
		}
	}

	global.Stats = Stats;
})(Meteor.is_client ? window : global);