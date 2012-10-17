Observer.on('complete:deck', function(e) {
    //console.log('complete:deck', e);
    Fiber(function() {
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
          correct_time_squared: correct ? Math.pow(time, 2) : 0,
          inverse_correct_time: correct ? 1 / time : 0
        };

        console.log('stats', stats);

        // card stats update
        Stats.updateCardStats(match, stats, e.user.grade);

        // user-card stat update
        var update = {$inc: {}};
        _.each(stats,function(stat, name) {
          update.$inc[name] = stat;
        });
        update.$set = {last_played: +new Date()}
        UserCardStats.update(
          {uid: e.user._id, cid: e.object._id},
          update,
          {multi: 0, upsert: 1}
        );

        //grade stats update
        var update = {$inc: {}};
        _.each(stats,function(stat, name) {
          update.$inc[card.grade + '.' + name] = stat;
        });
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
  console.log('complete game event', e);
  Fiber(function() {
    var match = e.object;
    var action = e.action;
    

    var result = null;
    if (action.adverbs.indexOf('andWon') >= 0) {
      result = 'won';
    } else if (action.adverbs.indexOf('andTied') >= 0) {
      result = 'tied';
    } else {
      result = 'lost';
    }

    // XXX ugly multiplayer check
    var multi = match.users.indexOf(1) === -1 ? true : false;

    var update = {};
    var inc = { attempts: 1 };

    if (multi) {
      inc.multiAttempts = 1;
      var opponent = _.without(match.users, e.user._id)[0];
      update.$push = { history: {time: e.time, opponent: opponent, result: result}};
    }
      
    if (result === 'won') {
      inc.wins = 1;
      if (multi)
        inc.multiWins = 1;
    } else if (result === 'lost') {
      inc.losses = 1;
      if (multi)
        inc.multiLosses = 1;
    }

    update.$set = {last_played: e.time};
    var score = match[e.user._id].points;
    update.$inc = inc;
    UserDeckInfo.update({user: e.user._id, deck: match.deck}, update, {multi: 0, upsert: true});
    UserDeckInfo.update(
      {user: e.user._id, deck: match.deck, high_score: {$lt : score}}, 
      { high_socre: score });
  }).run();
});
