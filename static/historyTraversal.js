window.addEventListener( "popstate", function ( event ) {
  let URL = window.location.href;

  $("body").load(URL);
})
