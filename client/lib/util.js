util = {}


// Returns an event_map key for attaching "ok/cancel" events to
// a text input (given by selector)
util.okcancel_events = function (selector) {
  return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
};


// Creates an event handler for interpreting "escape", "return", and "blur"
// on a text field and calling "ok" or "cancel" callbacks.
util.make_okcancel_handler = function (options) {
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

Handlebars.registerHelper('iter', function(ctx, options){
  if(ctx.fetch){
    ctx = ctx.fetch();
  }
  
  var fn = options.fn, inverse = options.inverse;
  var ret = '';
  if(ctx && ctx.length > 0){
    _.each(ctx, function(val, idx){
      val.idx = idx + 1;
      ret = ret + fn(val);
    });
  }
  else{
    ret = inverse(this);
  }

  return ret;
});