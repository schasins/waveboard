var map;

function initialize() {
  var myLatlng = new google.maps.LatLng(37.8757151,-122.2590485);
  var mapOptions = {
    zoom: 24,
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

/*
  var marker = new google.maps.Marker({
      position: myLatlng,
      icon:"images/4.png",
      map: map
  });
*/
}

google.maps.event.addDomListener(window, 'load', initialize);

var mostRecentPositions = [];
var markers = [];

function newPosition(lat,long) {
  mostRecentPositions.push([lat,long]);
  if (mostRecentPositions.length > 5){
    mostRecentPositions = mostRecentPositions.slice(1,6);
  }

  //remove old markers
  for (var i = 0; i<markers.length; i++){
    markers[i].setMap(null);
  }
  markers = [];

  //put on the new
  for (var i = 0; i<mostRecentPositions.length; i++){
    var la = mostRecentPositions[i][0];
    var lo = mostRecentPositions[i][1];
    var myLatlng = new google.maps.LatLng(la,lo);
    var marker = new google.maps.Marker({
        position: myLatlng,
        icon: "images/"+i+".png",
        map: map
    });
    markers.push(marker);
    if (i === mostRecentPositions.length-1){
      map.panTo(myLatlng);
    }
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function distanceTraveledFeedback(){
  if (mostRecentPositions.length > 0){
    var distance = 0;
    for (var i = 1; i< mostRecentPositions.length; i++){
      distance += Math.abs(mostRecentPositions[i][0]-mostRecentPositions[i-1][0]);
      distance += Math.abs(mostRecentPositions[i][1]-mostRecentPositions[i-1][1]);
    }
    //console.log("distance: ",distance);
    var messages = ["I'm bored.", "I'm bored.  Come find me.", "This isn't fun anymore.", "This place is getting old."];
    if (distance > 0.00005){
      var messages = ["Wheeeeee!", "This is awesome!!!", "Yayayay fun!!", ":)"];
    }
    var index = getRandomInt(0,messages.length);
    $("#distance_feedback").html(messages[index]);
    $("#distance_feedback").css("bottom", $(window).height()/2+15);
    $("#distance_feedback").css("left", $(window).width()/2+15);
    $("#distance_feedback").fadeTo(200,.75);
    setTimeout(function(){$("#distance_feedback").fadeTo(200,0);},5000);
  }
  setTimeout(distanceTraveledFeedback,15000);
}
setTimeout(distanceTraveledFeedback,15000);

var testFuncCounter = 0;
var latlngs = [[37.8757181,-122.2590485],[37.8757251,-122.2591496],[37.8757051,-122.2592507],[37.8757101,-122.2593518],[37.8757191,-122.2594529],[37.8757151,-122.2595530],[37.8757251,-122.2596541],[37.8757051,-122.2597552],[37.8757201,-122.2598552],[37.8757251,-122.2599552],[37.8757351,-122.2600552],[37.8757451,-122.2601552],[37.8757551,-122.2602552]];

function testFuncOld(){
  newPosition(latlngs[testFuncCounter][0],latlngs[testFuncCounter][1]);

  testFuncCounter += 1;
  if (testFuncCounter>=latlngs.length){
    return;
  }
  setTimeout(testFuncOld, 3000);
}

function addJitter(base,max_jitter){
  var neg = Math.random();
  var mult = 1;
  if (neg > .5){mult = -1;}
  return base + mult*Math.random()*max_jitter;
}
// road by Soda
/*
var curr_ideal = [37.8757181,-122.2590485];
var curr = curr_ideal;
var lat_adjust = .00002;
var long_adjust = -.000003;
var max_jitter = .000008;
*/

//setTimeout(function(){test(0);},6000);


//Soda
/*
var curr_ideal = [37.8757181,-122.2587485];
var curr = curr_ideal;
var lat_adjust = 0;
var long_adjust = 0;
var max_jitter = .000002;
*/

// invention lab

var curr_ideal = [37.874747, -122.258651];
var curr = curr_ideal;
var lat_adjust = 0;
var long_adjust = 0;
var max_jitter = .0000005;

function testFunc(){
  if (displayNewData){
    newPosition(curr[0],curr[1]);
    curr_ideal[0] = curr_ideal[0]+lat_adjust;
    curr_ideal[1] = curr_ideal[1]+long_adjust;
    curr[0] = addJitter(curr_ideal[0],max_jitter);
    curr[1] = addJitter(curr_ideal[1],max_jitter);
  }
  setTimeout(testFunc,3000);
}

var test = true;
if (test){
  setTimeout(testFunc,3000);
}
