(function () {
  "use strict";

  //set to true for debugging output
  var debug = false;

  // our current position
  var positionCurrent = {
    lat: null,
    lng: null,
    hng: null
  };


  // the outer part of the compass that rotates
  var rose = document.getElementById("rose");


  // elements that ouput our position
  var positionLat = document.getElementById("position-lat");
  var positionLng = document.getElementById("position-lng");
  var positionHng = document.getElementById("position-hng");


  // debug outputs
  var debugOrientation = document.getElementById("debug-orientation");
  var debugOrientationDefault = document.getElementById("debug-orientation-default");


  // if we have shown the heading unavailable warning yet
  var warningHeadingShown = false;


  // switches keeping track of our current app state
  var isOrientationLockable = false;
  var isOrientationLocked = false;

  // the orientation of the device on app load
  var defaultOrientation;


  // browser agnostic orientation
  function getBrowserOrientation() {
    var orientation;
    if (screen.orientation && screen.orientation.type) {
      orientation = screen.orientation.type;
    } else {
      orientation = screen.orientation ||
                    screen.mozOrientation ||
                    screen.msOrientation;
    }

    /*
      'portait-primary':      for (screen width < screen height, e.g. phone, phablet, small tablet)
                                device is in 'normal' orientation
                              for (screen width > screen height, e.g. large tablet, laptop)
                                device has been turned 90deg clockwise from normal

      'portait-secondary':    for (screen width < screen height)
                                device has been turned 180deg from normal
                              for (screen width > screen height)
                                device has been turned 90deg anti-clockwise (or 270deg clockwise) from normal

      'landscape-primary':    for (screen width < screen height)
                                device has been turned 90deg clockwise from normal
                              for (screen width > screen height)
                                device is in 'normal' orientation

      'landscape-secondary':  for (screen width < screen height)
                                device has been turned 90deg anti-clockwise (or 270deg clockwise) from normal
                              for (screen width > screen height)
                                device has been turned 180deg from normal
    */

    return orientation;
  }


  // called on device orientation change
  function onHeadingChange(event) {
    var heading = event.alpha;

    if (typeof event.webkitCompassHeading !== "undefined") {
      heading = event.webkitCompassHeading; //iOS non-standard
    }

    var orientation = getBrowserOrientation();

    if (typeof heading !== "undefined" && heading !== null) { // && typeof orientation !== "undefined") {
      // we have a browser that reports device heading and orientation


      if (debug) {
        debugOrientation.textContent = orientation;
      }


      // what adjustment we have to add to rotation to allow for current device orientation
      var adjustment = 0;
      if (defaultOrientation === "landscape") {
        adjustment -= 90;
      }

      if (typeof orientation !== "undefined") {
        var currentOrientation = orientation.split("-");

        if (defaultOrientation !== currentOrientation[0]) {
          if (defaultOrientation === "landscape") {
            adjustment -= 270;
          } else {
            adjustment -= 90;
          }
        }

        if (currentOrientation[1] === "secondary") {
          adjustment -= 180;
        }
      }

      positionCurrent.hng = heading + adjustment;

      var phase = positionCurrent.hng < 0 ? 360 + positionCurrent.hng : positionCurrent.hng;
      positionHng.textContent = (360 - phase | 0) + "°";


      // apply rotation to compass rose
      if (typeof rose.style.transform !== "undefined") {
        rose.style.transform = "rotateZ(" + positionCurrent.hng + "deg)";
      } else if (typeof rose.style.webkitTransform !== "undefined") {
        rose.style.webkitTransform = "rotateZ(" + positionCurrent.hng + "deg)";
      }
    } else {
      // device can't show heading

      positionHng.textContent = "n/a";
      showHeadingWarning();
    }
  }

  function showHeadingWarning() {
    if (!warningHeadingShown) {
      // popupOpen("noorientation");
      alert('noirientation');
      warningHeadingShown = true;
    }
  }


  function locationUpdate(position) {
    positionCurrent.lat = position.coords.latitude;
    positionCurrent.lng = position.coords.longitude;

    positionLat.textContent = decimalToSexagesimal(positionCurrent.lat, "lat");
    positionLng.textContent = decimalToSexagesimal(positionCurrent.lng, "lng");
  }

  function locationUpdateFail(error) {
    positionLat.textContent = "n/a";
    positionLng.textContent = "n/a";
    console.log("location fail: ", error);
  }

  function openMap() {
    window.open("https://www.google.com/maps/place/@" + positionCurrent.lat + "," + positionCurrent.lng + ",16z", "_blank");
  }


  function decimalToSexagesimal(decimal, type) {
    var degrees = decimal | 0;
    var fraction = Math.abs(decimal - degrees);
    var minutes = (fraction * 60) | 0;
    var seconds = (fraction * 3600 - minutes * 60) | 0;

    var direction = "";
    var positive = degrees > 0;
    degrees = Math.abs(degrees);
    switch (type) {
      case "lat":
        direction = positive ? "N" : "S";
        break;
      case "lng":
        direction = positive ? "E" : "W";
        break;
    }

    return degrees + "° " + minutes + "' " + seconds + "\" " + direction;
  }

  if (screen.width > screen.height) {
    defaultOrientation = "landscape";
  } else {
    defaultOrientation = "portrait";
  }
  if (debug) {
    debugOrientationDefault.textContent = defaultOrientation;
  }

  window.addEventListener("deviceorientation", onHeadingChange);

  navigator.geolocation.watchPosition(locationUpdate, locationUpdateFail, {
    enableHighAccuracy: false,
    maximumAge: 30000,
    timeout: 27000
  });

  checkLockable();

}());
