'use strict';

$(function() {

  var output = document.getElementById("out");

  if (!navigator.geolocation){
    output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
    return;
  }

  function success(position) {
    var latitude  = position.coords.latitude;
    var longitude = position.coords.longitude;

    output.innerHTML = '<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>';

    var img = new Image();
    img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=13&size=300x300&sensor=false";

    output.appendChild(img);
    visdata(longitude, latitude);
  };

  function error(error) {
    output.innerHTML = "Unable to retrieve your location";
    alert('ERROR(' + error.code + '): ' + error.message);
  };

  output.innerHTML = "<p>Locating…</p>";

  navigator.geolocation.getCurrentPosition(success, error);

	function corssupported() {
	  return "withCredentials" in (new XMLHttpRequest());
	}

	function visdata(x,y) {
		var promises = [];
	    var options= {};
	    options.url= encodeURI("http://dawa.aws.dk/sogne/reverse");
	    options.data= {x: x, y: y};
	    if (corssupported()) {
	      options.dataType= "json";
	      options.jsonp= false;
	    }
	    else {        
	      options.dataType= "jsonp";
	    }
	    promises.push($.ajax(options));
	  $.when.apply($, promises).then(function() {
	    for (var i = 0; i < promises.length; i++) {
	      output.innerHTML= arguments[i].kode + " " + arguments[i].navn;
	    } 
	  }, function() {
	    for (var i = 0; i < arguments.length; i++) {
	      alert(arguments[i]);
	    }
	  });
	}

});
