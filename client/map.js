var map;

function initialize() {
  var myLatlng = new google.maps.LatLng(37.8757151,-122.2590485);
  var mapOptions = {
    zoom: 18,
    center: myLatlng,
    styles: [{"stylers":[{"hue":"#00ffaa"},{"gamma":0.4}]}]
  }
  var div = document.getElementById('map-canvas');
  var $div = $(div);
  $div.css("height", .5*$(window).height());
  $div.css("width", .5*$(window).width());
  $div.css("left", .25*$(window).width());
  $div.css("top", .25*$(window).height());
  map = new google.maps.Map(div, mapOptions);

  var marker = new google.maps.Marker({
      position: myLatlng,
      map: map
  });
}

google.maps.event.addDomListener(window, 'load', initialize);

function newPosition(lat,long) {
  var myLatlng = new google.maps.LatLng(lat,long);
  var marker = new google.maps.Marker({
      position: myLatlng,
      map: map
  });
}
