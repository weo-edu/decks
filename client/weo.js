var game;

Session.set('result',null);
Session.set('view','deck_browse');

// Returns an event_map key for attaching "ok/cancel" events to
// a text input (given by selector)
var okcancel_events = function (selector) {
  return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
};


// Creates an event handler for interpreting "escape", "return", and "blur"
// on a text field and calling "ok" or "cancel" callbacks.
var make_okcancel_handler = function (options) {
  var ok = options.ok || function () {};
  var cancel = options.cancel || function () {};

  return function (evt) {
    if (evt.type === "keydown" && evt.which === 27) {
      // escape = cancel
      cancel.call(this, evt);

    } else if (evt.type === "keyup" && evt.which === 13 ||
               evt.type === "focusout") {
      // blur/return/enter = ok/submit if non-empty
      var value = String(evt.target.value || "");
      if (value)
        ok.call(this, value, evt);
      else
        cancel.call(this, evt);
    }
  };
};

Template.deck_browse.decks = function() {
  return Decks.find({});
}


Template.deck_browse.events = {
  'click .deck': function() {
    page('/deck/' + this.name + '/play/');
  }
}

Template.deck_play.events = {
  'click #check': function(){
    page('/deck/' + Session.get('deck') + '/play/');
  }
}

function all(ctx,next) {
  console.log('context', ctx);
  var action = ctx.params.action || 'index';
  Session.set('view', ctx.view + '_' + ctx.params.action);
  next();
}

$(document).ready(renderView);

page('/deck/:name/:action', function(ctx, next) {
  ctx.view = 'deck';
  Session.set('deck', ctx.params.name);
  if(ctx.params.action == 'play')
    play(ctx.params.name);
  next();
}, all);

function renderView(){
  $('body').html(Meteor.ui.render(function(){
    return Template[Session.get('view')]();
  }));
}

function play(name) {
  var deck = Decks.findOne({name: name});
  game = new Game(deck,3);
  Session.set('card',game.nextCard());
}

Template.deck_play.card = function () {
  return Session.get('card');
};

Template.deck_play.result = function() {
  return Session.get('result');
}

Template.deck_results.correct = function() {
  return game.results.find({result: true}).count();
}

Template.deck_results.total = function(){
  return game.results.find({}).count();
}

Template.deck_play.events = {};

Template.deck_play.events[okcancel_events('#solution')] = 
make_okcancel_handler({
    ok: function (value,evt) {
      game.recordResult(game.isSolution(parseInt(value)));
      var next_card = game.nextCard();
      if (next_card) {
        Session.set('card',next_card);
        evt.target.value = "";
      }
      else Session.set('view','deck_results');
    }
  });

