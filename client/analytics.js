;(function() {

	route('/analytics/:user', route.requireSubscription('user', route.params('user')), 
		function(ctx, next) {
		var user = User.lookup(ctx.params.user);
		Meteor.subscribe('UserCardStats', user._id);

		Template.analytics.helpers({
			user_cards: function() {
				return UserCardStats.find();
			},
			card: function() {
				return Cards.findOne({_id: this.pid});
			},
			accuracy: function() {
				return ((this.stats.correct / this.stats.attempts) * 100).toFixed(2) + '%';
			},
			avg_time: function() {
				return ((this.stats.time / this.stats.attempts) / 1000).toFixed(2);
			},
			round: function(val) {
				return val && val.toFixed && val.toFixed(2);
			},
			points: function() {
				return points(this).toFixed(2);
			}
		});

		view.render('analytics');
	});
})();