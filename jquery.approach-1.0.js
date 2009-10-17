/*
 * jQuery Approach 1.0
 * https://github.com/srobbin/jquery-approach/
 *
 * A plugin that lets you animate based on radial distance from an object.
 *
 * Copyright (c) 2009 Scott Robbin (srobbin.com)
 * Dual licensed under the MIT and GPL licenses.
 */
 
(function($, sqrt, pow) {
  
  $.fn.approach = function(styles, distance, callback) {
    var settings = {
          interval: 50,    // Used to throttle action on mousemove events
          distance: 400},  // Minimum distance in pixels within which we start to animate
        lastRun,              // When the proxanimation was last run
        elements = [];        // Holds the elements that we'll perform animations on
    
    // Extend the settings with those the user has provided
    if(distance) $.extend(settings, {distance: distance});
    
    // Add the elements to our array
    this.each(function(i, obj) {
      // Save the style data we'll need for proxanimations
      var proxStyles = [],
          colorStyles = ['backgroundColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderTopColor', 'color', 'outlineColor'],
          $obj = $(obj);
      
      $.each(styles, function(style, val) {
        var from, to;
        
        // If the style is color-based and jQuery Effects Core is installed, let's animate...with color!
        if($.inArray(style, colorStyles) > -1 && $.fx.step[style]) {
          // Rut Roh
          from = {number: getRGB($obj.css(style))};
          to = {number: getRGB(val)};
        } else {
          // Try to parse out units, etc (taken from jQuery animate)
          from = getParts($obj.css(style));
          to = getParts(val);
        }
          
        if(from && to) {
          // If a +=/-= token was provided, we're doing a relative animation (taken from jQuery animate)
          if ( to.relative )
            to.number = ((to.relative == "-=" ? -1 : 1) * to.number) + from.number;
          
          // Making an assumption that the units are the same for from/to. Bad assumption. TODO: Be more intelligent.
          proxStyles.push({
            name: style,
            from: from.number,
            to: to.number,
            unit: to.unit || ""
          });
        }
      });
      $obj.data("jquery-approach", proxStyles);
      elements.push(obj);
    });
    
    // Listen for the mousemove event
    $(document).bind("mousemove", function(e) {
      
      // Check for throttling
      var thisRun = new Date();
      if(thisRun - lastRun < settings.interval)
        return;
      
      lastRun = thisRun;

      // Loop through the elements, calculate the values (based on distance), then animate
      $.each(elements, function() {
        var center = getCenter(this),
            distance = parseInt(sqrt(pow(e.pageX-center.x,2) + pow(e.pageY-center.y,2)), 10),
            distanceRatio = (settings.distance - distance) / settings.distance,
            calcStyles = {},
            $self = $(this);
                             
        $.each($self.data("jquery-approach"), function() {
          var style = this,
              calcVal,
              color; 
          
          // We have to calculate colors differently from dimension-based styles           
          if($.isArray(style.to)) {
            color = (distance > settings.distance) ? style.from : $.map(style.from, function(v, k) {
              return parseInt((distanceRatio * (style.to[k] - style.from[k])) + style.from[k]);
            });
            calcVal = "rgb(" + color.join(",") + ")";
          } else {
            calcVal = (distance > settings.distance) ? style.from : (distanceRatio * (style.to - style.from)) + style.from;
            calcVal += style.unit;
          }
  
          calcStyles[style.name] = calcVal;
        });

        $self.animate(calcStyles, settings.interval - 1);
      });
      
    });

      // Get the center of the object
    function getCenter(obj) {
      var $obj = $(obj), offset = $obj.offset();
      return {
        x: offset.left + $obj.width() / 2,
        y: offset.top + $obj.height() / 2
      };
    }
    
    // Separate the string into parts (based on the parser in jQuery animate)
    function getParts(val) {
      var parts = val.toString().match(/^([+-]=)?([\d+-.]+)(.*)$/),
      relative, number, unit;
      
      if(parts) {
        relative = parts[1];
        number = parseFloat(parts[2]);
        unit = parts[3];
      }
      
      return {
        relative: relative, // Is this += or -=
        number: number, // The float value
        unit: unit  // The units: px or em
      };
    }
    
    // Callback, if necessary
    if(callback) callback();
  
    // For chaining
    return this;
  };
  
  // From jQuery UI Effects Core (http://jqueryui.com/)
  // This will likely be unnecessary in jQuery UI 1.8, when these functions are unprivatized
  // http://dev.jqueryui.com/ticket/3806
  //
  // If file size is a concern, you can remove getRBG and getColor functions
  //
  // Parse strings looking for color tuples [255,255,255]
  function getRGB(color) {
      var result;

      // Check if we're already dealing with an array of colors
      if ($.isArray(color) && color.length == 3)
          return color;

      // Look for rgb(num,num,num)
      if (result = reRGBInt.exec(color))
          return [parseInt(result[1],10), parseInt(result[2],10), parseInt(result[3],10)];

      // Look for rgb(num%,num%,num%)
      if (result = reRGBFloat.exec(color))
          return [parseFloat(result[1])*2.55, parseFloat(result[2])*2.55, parseFloat(result[3])*2.55];

      // Look for #a0b1c2
      if (result = reHex6.exec(color))
          return [parseInt(result[1],16), parseInt(result[2],16), parseInt(result[3],16)];

      // Look for #fff
      if (result = reHex3.exec(color))
          return [parseInt(result[1]+result[1],16), parseInt(result[2]+result[2],16), parseInt(result[3]+result[3],16)];

      // Look for rgba(0, 0, 0, 0) == transparent in Safari 3
      if (reSaf3.test(color))
          return colors.transparent;

      // Otherwise, we're most likely dealing with a named color
      return colors[$.trim(color).toLowerCase()];
  }
  
  // Some named colors to work with
  // From Interface by Stefan Petre
  // http://interface.eyecon.ro/
  var colors = {
    aqua:[0,255,255],
    azure:[240,255,255],
    beige:[245,245,220],
    black:[0,0,0],
    blue:[0,0,255],
    brown:[165,42,42],
    cyan:[0,255,255],
    darkblue:[0,0,139],
    darkcyan:[0,139,139],
    darkgrey:[169,169,169],
    darkgreen:[0,100,0],
    darkkhaki:[189,183,107],
    darkmagenta:[139,0,139],
    darkolivegreen:[85,107,47],
    darkorange:[255,140,0],
    darkorchid:[153,50,204],
    darkred:[139,0,0],
    darksalmon:[233,150,122],
    darkviolet:[148,0,211],
    fuchsia:[255,0,255],
    gold:[255,215,0],
    green:[0,128,0],
    indigo:[75,0,130],
    khaki:[240,230,140],
    lightblue:[173,216,230],
    lightcyan:[224,255,255],
    lightgreen:[144,238,144],
    lightgrey:[211,211,211],
    lightpink:[255,182,193],
    lightyellow:[255,255,224],
    lime:[0,255,0],
    magenta:[255,0,255],
    maroon:[128,0,0],
    navy:[0,0,128],
    olive:[128,128,0],
    orange:[255,165,0],
    pink:[255,192,203],
    purple:[128,0,128],
    violet:[128,0,128],
    red:[255,0,0],
    silver:[192,192,192],
    white:[255,255,255],
    yellow:[255,255,0],
    transparent: [255,255,255]
  },
  // compile the regular expressions once (reduce, reuse, recycle)
  reRGBInt = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/,
  reRGBFloat = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/,
  reHex6 = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
  reHex3 = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,
  reSaf3 = /rgba\(0, 0, 0, 0\)/;
  /* End jQuery Effects Core */
  
})(jQuery, Math.sqrt, Math.pow);