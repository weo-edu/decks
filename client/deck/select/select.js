route('/deck/select/:name', function(ctx){

	Template.cards_select.deck = function() {
		var name = ctx.params.name;
		var deck= Decks.findOne({title: name});

		Meteor.defer(function() {
			$('#card-grid').layout({
        rows: 2,
        cols: 4
      });
		});	

		return deck;	
  	}

  	Template.cards_select.events = {
  		'click .play-button': function(e) {
        var el = $(e.currentTarget);
  			$('.scene').animate({left: 768}, 400, 'easeInOutExpo', function(){
  					route('/deck/play/' + el.attr('rel'));
  			});
  		},
      'click .card': function(e) {
        var el = $(e.currentTarget);
        var container = el.parent();
        var numSelected = container.children('.select').length;

        if(numSelected == 3 && !el.hasClass('select')) {
          var dialog = ui.get('max_cards');
          dialog.context(this);
          dialog.closable().overlay().show().center();
          return;          
        }

        el.toggleClass('select');

        $('.chosen').html(container.children('.select').length);

      }
  	}

	view.render('cards_select');
});