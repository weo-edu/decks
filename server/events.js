Observer.on('complete:deck', function(e) {
    console.log('complete:deck', e);
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
    }).run();
});
