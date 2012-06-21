var game;

Session.set('result',null);
Session.set('view','decks');

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

Template.main.view_is = function(view) {
  return Session.equals('view',view);
}

Template.browse.decks = function() {
  return Decks.find({});
}

Template.deck.events = {
  'click .deck': function() {
    play(this._id);
  }
}


function play(id) {
  var deck = Decks.findOne(id);
  game = new Game(deck,3);
  Session.set('view','play');
  Session.set('card',game.nextCard());
}

Template.card.card = function () {
  return Session.get('card');
};

Template.card.result = function() {
  return Session.get('result');
}

Template.card.events = {};

Template.card.events[okcancel_events('#solution')] = 
make_okcancel_handler({
    ok: function (value,evt) {
      game.recordResult(game.isSolution(parseInt(value)));
      var next_card = game.nextCard();
      if (next_card) {
        Session.set('card',next_card);
        evt.target.value = "";
      }
      else Session.set('view','decks');
    }
  });

