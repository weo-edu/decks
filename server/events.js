Observer.on('complete:deck', function(e) {
    //console.log('complete:deck', e);
    Fiber(function() {
        console.log('test');
        Decks.update(
            { title: e.object.name }, 
            { $inc:
                {
                    total_attempts: 1, 
                    total_time: e.action.time || 0,
                    total_correct: e.action.adverbs.indexOf('correctly') !== -1 ? 1 : 0
                }
            }, 
            { multi: false },
            function(err) {
                console.log('update error', err);
            }
        );
    }).run();
});

Observer.on('complete:card', function(e) {
    //console.log('completed:card', e);
    Fiber(function() {
        var match = {_id: e.object._id};
        var stats = {
          attempts: 1,
          time: e.action.time || 0,
          correct: ~e.action.adverbs.indexOf('correctly') ? 1 : 0
        };
        augmentStats(Cards, match, stats, e.user.grade);
        augmentStats(
          UserCardStats,
          {uid: e.user._id, pid: e.object._id},
          stats
          );
        
        if(stats.correct) {
          var card = Cards.findOne(e.object._id);
          if(!card.stats.hasOwnProperty('grade')) {
            regrade(card);
            card = Cards.findOne(e.object._id);
          }

          console.log('grade', card.stats.grade);
          var pts = points(card.stats.grade || card.grade);
          augmentPoints(e.user._id, pts);
        }
    }).run();
});


Observer.on('complete:game', function(e) {
  Fiber(function() {
    var match = e.object;
    UserDeckStats.update({user: e.user, deck: match.deck}, mod, {multi: 0, upsert: true})
  }).run();
});
