route('/', function(ctx, next) {
  console.log('test');
  Session.set('view','deck_browse');
});


Template.weo_render.render = function(){
  console.log('route start');
  route.start();
  setTimeout(renderView, 0);
}


function renderView(){
  $('#content').html(Meteor.ui.render(function(){
    console.log(Session.get('view'));
    return Template[Session.get('view')]();
  }));
}




