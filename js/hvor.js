'use strict';

$(function() {
	$.support.cors= true; //pga. IE

  var output = $("#content");
  var row= $("<div class='row'></div>");
  output.append(row);

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

    output.append(img);
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
		var antal= 0;
		var options= [];
		var data= {x: x, y: y}; 
    var dataType= "jsonp";
    var jsonp= true;
    if (corssupported()) {
      dataType= "json";
      jsonp= false;
    }
    // sogn
		options.push({});
    options[antal].url= encodeURI("http://dawa.aws.dk/sogne/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    antal++;

    // kommune
		options.push({});
    options[antal].url= encodeURI("http://dawa.aws.dk/kommuner/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    antal++;

		var promises = [];
		for (var i= 0; i<options.length; i++)
    	promises.push($.ajax(options[i]));
	  $.when.apply($, promises).then(function() {
	    for (var i = 0; i < promises.length; i++) {
	      row.append("<div  class='col-md-3'>" + arguments[i][0].kode + " " + arguments[i][0].navn + "</div>");
	    } 
	  }, function() {
	    for (var i = 0; i < arguments.length; i++) {
	      alert(arguments[i]);
	    }
	  });
	}

});
