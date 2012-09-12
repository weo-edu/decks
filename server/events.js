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
        var card = Cards.findOne(e.object._id);
        var time = e.action.time || 0;
        var correct = ~e.action.adverbs.indexOf('correctly') ? 1 : 0;

        //XXX time_squared is used for variance calc
        // we may want to use an incremental variance calculation instead
        var stats = {
          attempts: 1,
          time: time,
          time_squared: Math.pow(time, 2),
          correct: correct,
          correct_time: correct ? time : 0,
          correct_time_squared: correct ? Math.pow(time, 2) : 0
        };

        // card stats update
        Stats.updateCardStats(match, stats, e.user.grade);

        // user-card stat update
        var update = {$inc: {}};
        _.each(stats,function(stat, name) {
          update.$inc[name] = stat;
        });
        update.$set = {last_played: +new Date()}
        console.log('update', update);
        UserCardStats.update(
          {uid: e.user._id, pid: e.object._id},
          update,
          {multi: 0, upsert: 1}
        );

        //grade stats update
        var update = {$inc: {}};
        _.each(stats,function(stat, name) {
          update.$inc[card.grade + '.' + name] = stat;
        });
        console.log('update', update);
        StatsCollection.update(
          {name: 'gradeStats'},
          update,
          {multi: 0, upsert: 1}
        );
        
        if(stats.correct) {
          if (!card.stats)
            card = Cards.findOne(e.object._id);

          if(!card.stats.grade) {
            Stats.regrade(card);
            card = Cards.findOne(e.object._id);
          }

          console.log('grade', card.stats.grade);
          var pts = Stats.points(card.stats.grade || card.grade);
          Stats.augmentPoints(e.user._id, pts);
        }
    }).run();
});

/**
 *  UserDeckInfo
 *  wins 
 *  attempts
 *  mastery
 *  
 */

Observer.on('complete:game', function(e) {
  Fiber(function() {
    var match = e.object;
    var action = e.action;
    console.log('complete game', match, action);
    var mod = { attempts: 1 };
    if (action.adverbs.indexOf('andWon') >= 0) {
      mod.wins = 1;
    }
    UserDeckInfo.update({user: e.user, deck: match.deck}, {$inc: mod}, {multi: 0, upsert: true});
  }).run();
});
