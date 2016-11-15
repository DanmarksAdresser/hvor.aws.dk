'use strict';

$(function() {
	$.support.cors= true; //pga. IE

	if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }

  var output = $("#content");
  var row= null;

  var info= $("#info");
  function infoout(tekst) {
    info.append(tekst); 
  }

  var latitude, longitude;

  if (!navigator.geolocation){
    output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
    return;
  }

  function success(position) {
    latitude  = position.coords.latitude;
    longitude = position.coords.longitude;
    infoout("<p>Din placering er ("+latitude + ", " + longitude +")</p>");
    visdata(longitude, latitude);
  };

  function error(error) {
    infoout("<p>Kan ikke finde din placering ("+error.code + " " + error.message +")</p>");
  };

  infoout("<p>Finder din placering ... </p>");
  navigator.geolocation.getCurrentPosition(success, error);

	function corssupported() {
	  return "withCredentials" in (new XMLHttpRequest());
	}
	var dataType= "jsonp";
  var jsonp= true;
  if (corssupported()) {
    dataType= "json";
    jsonp= false;
  }

	function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
	}

	function pointToLayer(style) {
    return function(feature, latlng) {     
      return L.circleMarker(latlng, style);
    }
  }


	var defaultpointstyle = {
	  "stroke": false,
	  "husnr": false,
	  "color": "red",
	  "opacity": 1.0,
	  "weight": 1, 
	  "fill": true,
	  "fillColor": 'red',
	  "fillOpacity": 1.0,
	  "radius": 5
	};

	var defaultpolygonstyle = {
	  "stroke": true,
	  "color": "blue",
	  "opacity": 1.0,
	  "weight": 2, 
	  "fill": true,
	  "fillColor": 'blue',
	  "fillOpacity": 0.2,
	  "husnr": false, 
	  "radius": 5
	};

	var defaultlinestyle = {
	  "stroke": true,
	  "color": "blue",
	  "opacity": 1.0,
	  "weight": 2, 
	  "fill": false,
	  "fillColor": 'blue',
	  "fillOpacity": 0.2,
	  "husnr": false, 
	  "radius": 5
	};

  function getDefaultStyle(data) {
    var featureData= data;
    if (data.type !== 'Feature') {
      featureData= data.features[0];
    }
    var defaultstyle;
    if (featureData.geometry && featureData.geometry.type==='Point') {
      defaultstyle= defaultpointstyle;
    }
    else if (featureData.geometry && featureData.geometry.type==='MultiPolygon') {

      defaultstyle= defaultpolygonstyle; 
    }
    else {
      defaultstyle= defaultlinestyle;
    }
    return defaultstyle;
  }

	function clickevent(sel) {
		return function(data) {
			 $("#"+sel).click(function(e) {
  			e.preventDefault();
		    var mapid=  sel + "map";
				if ($('#'+mapid).length!==0) return;
		    $(event.target ).closest( "div" ).append("<div class='map' id='" + mapid + "'>Kort</div>");
		    var map = L.map(mapid);
		    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: 'Map data &copy; OpenStreetMap contributors'});
  			osm.addTo(map);
  			var marker = L.marker([latitude,longitude]).addTo(map);
  			var options= {};
		    options.data= {format: 'geojson'};
		    options.url= data.href;
    		options.dataType= dataType;
    		options.jsonp= jsonp;
		    $.ajax(options)
		    .then( function ( data ) {
		      if (data.geometri || data.features && data.features.length === 0) {
		        alert('Søgning gav intet resultat');
		        return;
		      }
      		var style=  getDefaultStyle(data);
		      var geojsonlayer= L.geoJson(data, {style: getDefaultStyle, pointToLayer: pointToLayer(style)});
		      geojsonlayer.addTo(map);

      		var layergroup= L.featureGroup([marker,geojsonlayer]);     
      		map.fitBounds(layergroup.getBounds());
		    })
		    .fail(function( jqXHR, textStatus, errorThrown ) {
		      alert(errorThrown)
		    });
  			map.setView([latitude,longitude], 13)
		  });
		}
	}

	function bebyggelserclickevent() {
		return function(data) {
			for (var i= 0; i<data.length; i++) {
				$("#"+data[i].type).click(function (i) {
					return function(e) {
		  			e.preventDefault();
				    var mapid=  data[i].type + "map";
				    if ($('#'+mapid).length!==0) return;
				    $(event.target ).closest( "div" ).append("<div class='map' id='" + mapid + "'></div>");
				    var map = L.map(mapid);
				    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: 'Map data &copy; OpenStreetMap contributors'});
		  			osm.addTo(map);
		  			var marker = L.marker([latitude,longitude]).addTo(map);
		  			var options= {};
				    options.data= {format: 'geojson'};
				    options.url= data[i].href;
		    		options.dataType= dataType;
		    		options.jsonp= jsonp;
				    $.ajax(options)
				    .then( function ( data ) {
				      if (data.geometri || data.features && data.features.length === 0) {
				        alert('Søgning gav intet resultat');
				        return;
				      }
		      		var style=  getDefaultStyle(data);
				      var geojsonlayer= L.geoJson(data, {style: getDefaultStyle, pointToLayer: pointToLayer(style)});
				      geojsonlayer.addTo(map);

		      		var layergroup= L.featureGroup([marker,geojsonlayer]);     
		      		map.fitBounds(layergroup.getBounds());
				    })
				    .fail(function( jqXHR, textStatus, errorThrown ) {
				      alert(errorThrown)
				    });
		  			map.setView([latitude,longitude], 13);
		  		};
				}(i));
		  };
		}
	}

	var colcount= 0;
	function coloutput(tekst) {		
  	if (colcount%4 === 0) {
			row= $("<div class='row'></div>");
			output.append(row);
    }
    row.append(tekst);
  	colcount++;	    		
	}

	function formatadresse(data) {
	 	coloutput("<div  class='col-md-3'><h3>Nærmeste adresse</h3><p><a id='adresse'>" + data.vejstykke.navn + " " + data.husnr + ", " + data.postnummer.nr + " " + data.postnummer.navn + "</a></p></div>");
	}

	function formatpostnummer(data) {
		coloutput("<div  class='col-md-3'><h3>Postnummer</h3><p><a id='postnummer'>" + data.nr + " " + data.navn + "</a></p></div>");
	}
	function formatstorkreds(data) {
		coloutput("<div class='col-md-3'><h3>Storkreds</h3><p><a id='storkreds'>" + data.navn + " (" + data.nummer + ")" + "</a></p></div>");
	}

	function formatvalglandsdel(data) {
		coloutput("<div class='col-md-3'><h3>Valglandsdel</h3><p><a id='valglandsdel'>" + data.navn + " (" + data.bogstav + ")" + "</a></p></div>");
	}

	function formatjordstykke(data) {
		coloutput("<div class='col-md-3'><h3>Jordstykke</h3><p><a id='jordstykke'>" + (data.ejerlav.navn?data.ejerlav.navn+" ":"") + data.ejerlav.kode + " " +data.matrikelnr + "</a></p></div>");
	}

	function formatbebyggelse(data) {
		for (var i= 0; i<data.length;i++) {
			coloutput("<div class='col-md-3'><h3>" + capitalizeFirstLetter(data[i].type) + "</h3><p><a id='" + data[i].type + "'>" + data[i].navn + "</a></p></div>");
		}
	}

	function formatdata(titel,id) {
		return function (data) { coloutput("<div  class='col-md-3'><h3>" + titel + "</h3><p><a id='" + id + "'>" + data.navn + " (" + data.kode + ")" + "</a></p></div>")};
	}

	function visdata(x,y) {
		var antal= 0;
		var options= [];
		var data= {x: x, y: y};

		var host= "https://dawa.aws.dk/";

    // nærmeste adresse
		options.push({});
    options[antal].url= encodeURI(host+"adgangsadresser/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatadresse;
    options[antal].clickevent= clickevent('adresse');
    antal++;

    // nærmeste vejstykke
		options.push({});
    options[antal].url= encodeURI(host+"vejstykker/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatdata("Nærmeste vej", "vejstykke");
    options[antal].clickevent= clickevent('vejstykke');
    antal++;

    // postnummer
		options.push({});
    options[antal].url= encodeURI(host+"postnumre/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatpostnummer;
    options[antal].clickevent= clickevent('postnummer');
    antal++;

    // bebyggelser
		options.push({});
    options[antal].url= encodeURI(host+"bebyggelser");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatbebyggelse;
    options[antal].clickevent= bebyggelserclickevent();
    antal++;

    // jordstykke
		options.push({});
    options[antal].url= encodeURI(host+"jordstykker/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatjordstykke;
    options[antal].clickevent= clickevent('jordstykke');
    antal++;

    // sogn
		options.push({});
    options[antal].url= encodeURI(host+"sogne/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatdata("Sogn", 'sogn');
    options[antal].clickevent= clickevent('sogn');
    antal++;

    // kommune
		options.push({});
    options[antal].url= encodeURI(host+"kommuner/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatdata("Kommune", 'kommune');
    options[antal].clickevent= clickevent('kommune');
    antal++;

    // region
		options.push({});
    options[antal].url= encodeURI(host+"regioner/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatdata("Region",'region');
    options[antal].clickevent= clickevent('region');
    antal++;

    // retskreds
		options.push({});
    options[antal].url= encodeURI(host+"retskredse/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatdata("Retskreds", 'retskreds');
    options[antal].clickevent= clickevent('retskreds');
    antal++;

    // politikreds
		options.push({});
    options[antal].url= encodeURI(host+"politikredse/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatdata("Politikreds", 'plitikreds');
    options[antal].clickevent= clickevent('plitikreds');
    antal++;

    // opstillingskreds
		options.push({});
    options[antal].url= encodeURI(host+"opstillingskredse/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatdata("Opstillingskreds", 'opstillingskreds');
    options[antal].clickevent= clickevent('opstillingskreds');
    antal++;

    // storkreds
		options.push({});
    options[antal].url= encodeURI(host+"storkredse/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatstorkreds;
    options[antal].clickevent= clickevent('storkreds');
    antal++;

    // valglandsdel
		options.push({});
    options[antal].url= encodeURI(host+"valglandsdele/reverse");
    options[antal].data= data;
    options[antal].dataType= dataType;
    options[antal].jsonp= jsonp;
    options[antal].format= formatvalglandsdel;
    options[antal].clickevent= clickevent('valglandsdel');
    antal++;

		var promises = [];
		for (var i= 0; i<options.length; i++)
    	promises.push($.ajax(options[i]));
    begrænssamtidige(promises,0,10);

    function begrænssamtidige(promises,start,længde) {
      if (start >= promises.length) {        
        $('.loader').hide();
        return;
      }
      var l= (promises.length-start<længde?promises.length-start:længde); 
      var subpromises= promises.slice(start,start+l);
  	  $.when.apply($, subpromises).then(function() {
  	    for (var i = 0; i < subpromises.length; i++) {
  	      options[i+start].format(arguments[i][0]);
  	      options[i+start].clickevent(arguments[i][0]);
  	    } 
        begrænssamtidige(promises,start+længde,længde);
  	  }, function() {
        infoout("<p>Kald til DAWA fejlede: " + arguments[1] + "  "  + arguments[2] + "</p>");
  	  });
    }

	}

});
