route('/', function(ctx, next) {
  route.redirect('/deck/browse');
});


Template.weo_render.render = function(){
  route.start();
  setTimeout(renderView, 0);
}


function renderView(){
  $('#content').html(Meteor.ui.render(function(){
    console.log(Session.get('view'));
    return Template[Session.get('view')]();
  }));
}




