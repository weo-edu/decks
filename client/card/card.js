route('/card/create', function() {
	var transformPrefix = domToCss(Modernizr.prefixed('transform'));
	var session = new _Session();
	var card = new _Session({
		name:'Name',
		graphic: null,
		problem:{},
		'main-color':'#ccc',
		'sec-color':'#333'
	});
	var problem = new _Session({
		template: 'Template',
		solution: '',
		rules: []
	})
	var error = new _Session({
		template: '',
		solution: '',
		rules: []
	});
	session.set('msg', 'Continue');


function focusOn(el)
{
	var elem = '#' + el.attr('id') + '-cont';
	$('.step-nav').removeClass('active');
	el.addClass('active');
	$('.create').removeClass('active');
	$(elem).addClass('active');
	switch(el.attr('id'))
	{
		case 'step-1':
			session.set('msg', 'Continue');
			break;
		case 'step-2':
			session.set('msg', 'Create Card');
			break;
		case 'step-3':
			deal($('.deck-preview'),400, 'grid');
			session.set('msg', 'Insert in Decks');
			break;
		default:
			session.set('msg', 'Continue');
			break;
	}
}

function deckInsert(callback){
	callback = callback || function(){};
	var x = $('.chosen').children();
	console.log(x);
	_.each(x, function(el){
		Decks.update({_id:el.id}, {$addToSet: {cards:card.all()}}, function(){
			callback();
		});
		console.log(Decks.findOne({_id:el.id}))
	});
}

function colorSelect(el)
{
 	$.farbtastic('#colorpicker').linkTo(el);
 	if (el == ".secondary-color")
 		$('.to-change').text('Banner Color:')
 	else
 		$('.to-change').text('Background Color:');
}

	var watchErrors = function(){
		var update = function(){
			Meteor.defer(function(){
				var err = error.all();
				_.each(err, function(msg, ele){
					if(ele == 'rules')
					{
						if(msg.length == 0)
							$('#rules').children().children('.error').removeClass('error');
						else
							{
							_.each(msg, function(mssg, elem){
								var num = $('#rules').children().index() - elem;
								var el = '#rules-' + num.toString();
								if(mssg)
									$(el).addClass('error');
								else
									$(el).removeClass('error');
							})
						}
					}
					else
					{
						var el = '#' + ele;
						if(msg)
							$(el).addClass('error');
						else
							$(el).removeClass('error');
					}
					//console.log(test);	
				}); 
			});
		};
		update();
	}

	var events = {
		'keyup .instant_update' : function(event){
			var el = $(event.target);
			var id = $(event.target).attr('id');
			var val = el.val();

			if (!card.equals(id,val))
			{
				if(id == 'name')
					card.set('name', val);
				else{
					problem.set(id,val);
					card.set('problem',problem.all());
					watchErrors(el, id);
				}
			}
		},
		'mouseover .error' : function(event){
			var el = $(event.target);
			var id = $(event.target).attr('id');
			err_msg = el.parent().children('.error-message');
		},
		'click .step-nav' : function(event) {
			el = $(event.target);
			focusOn(el);
		}
	};

	Template.card_create.events = events;


	Template.rules.events = {
		'keyup .instant_update': function(event) {
			var el = $(event.target);
			var idx = el.parents('#rules').children().children('.rule-input').index(el);
			var rules = _.clone(problem.get('rules'));

			rules[idx] = el.val();
			problem.set('rules',rules);
			card.set('problem',problem.all())
			watchErrors();
			return false;
		},
		'click #add-rule': function(event) {
			$('#rules').prepend(Meteor.ui.render(function() {
				return Template.rule_input();
			}));
			var rules = problem.get('rules');
			rules.unshift('');
			problem.set('rules', rules)
			card.set('problem', problem.all());
		}
	}

	Template.deck_preview.events = {
		'click .deck' : function(event){
			el = $(event.target);
			cont = $(event.target).closest('.deck-container');
			cont.removeClass('last-selected')
			if(cont.hasClass('chosen') && !cont.hasClass('view-more'))
				cont.toggleClass('chosen');
			else{
				cont.toggleClass('selected');
				if(cont.hasClass('selected'))
				{
					cont.parent().children().not('.selected').hide();
					cont.css(transformPrefix, 'translate3d(0,0,0)');
					cont.addClass('view-more');
				}
				else
				{ 
					cont.addClass('last-selected');
					deal($('.deck-preview'),200, 'grid');
					cont.removeClass('view-more');
					cont.parent().children().fadeIn(400);
				}
			}
			return false;
		},
		'click .choose-deck' : function(event){
			el = $(event.target).closest('.deck-container');
			el.toggleClass('chosen');
		}
	}

	Template.section_title.events = {
		'click' : function() {
			switch(session.get('msg'))
			{
				case 'Continue':
					focusOn($('#step-2'));
					break;
				case 'Create Card':
					var col1, col2;
					col1 = $('#color-update').val();
					col2 = $('#secondary-color').val()
					card.set('main-color', col1);
					card.set('sec-color', col2);
					Cards.insert(card.all());
					focusOn($('#step-3'));
					break;
				case 'Insert in Decks':
					deckInsert(function(){
						alert('succesful insert');
					});
					break;
			}
		}
	}

	Template.card_play.events = {
		'click' : function(event) {
			var el = '.'+$(event.target).attr('class');
			if(el != '.secondary-color')
				el = '.color-update';
			colorSelect(el);
		}
	}

	Template.card_play.card = function(){
		var c = card.all();
		var prob = problem.all();
		var p = problemize(prob);
		c.question = p.html;
		c.answer = p.solution;
		var e = {
			template: '',
			solution: '',
			rules: _.map(c.rules,function(rule) {return '';})
		};

		_.each(p.errors,function(err) {
			if (err.part == 'rule') {
				console.log('rule error',err.idx);
				e.rules[err.idx] = err.message;
			}
				
			else
				e[err.part] = err.message;
		});

		_.each(e,function(val,key) {
			error.set(key,val);
		})

 
		return c;
	}

	Template.card_create.button = function() {
		return session.equals('submit','true') ? 'insert' : 'create';
	}

	Template.rule_input.idx = function(){
		return $('#rules').children().length;
	}
	Template.deck_preview.deck = function(){
		Meteor.defer(function() {
			// mytrackball = new Traqball({
			// 	stage: 'flippable'
			// });
		$('textarea').resizable({disabled:true});
			$('#colorpicker').farbtastic('.color-update');
			console.log('file', $('#file'));
			$('#file').fileupload({
		    	url: "/upload",
		    	type: "POST",
		    	dataType: 'json',
		    	multipart: true,
		    	done: function(e,data) {
		    		console.log('done');
		    		card.set("graphic","upload/"+data.result.path);
			    }
		    });
			});
		return Decks.find({});
	}
	Template.section_title.title = function(){
		return session.get('msg');
	}

	//watchErrors();

	///////////////////////////////////////////
	//////////Better Markdown//////////////////
	///////////////////////////////////////////

	Handlebars.registerHelper('better_markdown', function(fn) {
  var converter = new Showdown.converter();
  var input = fn(this);

  ///////
  // Make Markdown *actually* skip over block-level elements when
  // processing a string.
  //
  // Official Markdown doesn't descend into
  // block elements written out as HTML (divs, tables, etc.), BUT
  // it doesn't skip them properly either.  It assumes they are
  // either pretty-printed with their contents indented, or, failing
  // that, it just scans for a close tag with the same name, and takes
  // it regardless of whether it is the right one.  As a hack to work
  // around Markdown's hacks, we find the block-level elements
  // using a proper recursive method and rewrite them to be indented
  // with the final close tag on its own line.
  ///////

  // Open-block tag should be at beginning of line,
  // and not, say, in a string literal in example code, or in a pre block.
  // Tag must be followed by a non-word-char so that we match whole tag, not
  // eg P for PRE.  All regexes we wish to use when scanning must have
  // 'g' flag so that they respect (and set) lastIndex.
  // Assume all tags are lowercase.
  var rOpenBlockTag = /^\s{0,2}<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del)(?=\W)/mg;
  var rTag = /<(\/?\w+)/g;
  var idx = 0;
  var newParts = [];
  var blockBuf = [];
  // helper function to execute regex `r` starting at idx and putting
  // the end index back into idx; accumulate the intervening string
  // into an array; and return the regex's first capturing group.
  var rcall = function(r, inBlock) {
    var lastIndex = idx;
    r.lastIndex = lastIndex;
    var match = r.exec(input);
    var result = null;
    if (! match) {
      idx = input.length;
    } else {
      idx = r.lastIndex;
      result = match[1];
    }
    (inBlock ? blockBuf : newParts).push(input.substring(lastIndex, idx));
    return result;
  };

  input = input.replace(/<!--.*?-->/g, '\n\n$&\n\n');

  var hashedBlocks = {};
  var numHashedBlocks = 0;

  var nestedTags = [];
  while (idx < input.length) {
    var blockTag = rcall(rOpenBlockTag, false);
    if (blockTag) {
      nestedTags.push(blockTag);
      while (nestedTags.length) {
        var tag = rcall(rTag, true);
        if (! tag) {
          throw new Error("Expected </"+nestedTags[nestedTags.length-1]+
                          "> but found end of string");
        } else if (tag.charAt(0) === '/') {
          // close tag
          var tagToPop = tag.substring(1);
          var tagPopped = nestedTags.pop();
          if (tagPopped !== tagToPop)
            throw new Error(("Mismatched close tag, expected </"+tagPopped+
                             "> but found </"+tagToPop+">: "+
                             input.substr(idx-50,50)+"{HERE}"+
                             input.substr(idx,50)).replace(/\n/g,'\\n'));
        } else {
          // open tag
          nestedTags.push(tag);
        }
      }
      var newBlock = blockBuf.join('');
      var openTagFinish = newBlock.indexOf('>') + 1;
      var closeTagLoc = newBlock.lastIndexOf('<');

      var key = ++numHashedBlocks;
      hashedBlocks[key] = newBlock.slice(openTagFinish, closeTagLoc);
      newParts.push(newBlock.slice(0, openTagFinish),
                    '!!!!HTML:'+key+'!!!!',
                    newBlock.slice(closeTagLoc));
      blockBuf.length = 0;
    }
  }

  var newInput = newParts.join('');
  var output = converter.makeHtml(newInput);

  output = output.replace(/!!!!HTML:(.*?)!!!!/g, function(z, a) {
    return hashedBlocks[a];
  });

  return output;
});


	view.render('card_create');
});