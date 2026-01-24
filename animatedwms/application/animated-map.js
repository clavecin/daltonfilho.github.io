var map = null;
var ANIMATED_LAYER_NAME = "Animated Max Temperatures";

$(document).ready(function(){
    initMap();
    initControls();    
});

function initMap() {
    map = new OpenLayers.Map({
        div: "animated-map",
        projection: "EPSG:3857",
        layers: [createMapQuestLayer(), 
                 createOSMLayer(),
                 createAnimatedLayer(),
                 createStatesLayer()],
        center: [-10816145.248961, 4635141.3945678],
        zoom: 4,
        controls: [new OpenLayers.Control.LayerSwitcher(), 
                   new OpenLayers.Control.Navigation(), 
                   new OpenLayers.Control.Zoom()]
    });    
}

function createMapQuestLayer() {
    return new OpenLayers.Layer.XYZ(
        "MapQuest",
        [
            "http://otile1.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.png",
            "http://otile2.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.png",
            "http://otile3.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.png",
            "http://otile4.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.png"
        ],
        {
            attribution: "Tiles Courtesy of <a href='http://open.mapquest.co.uk/' target='_blank'>MapQuest</a>. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency. <img src='http://developer.mapquest.com/content/osm/mq_logo.png' border='0'>",
            transitionEffect: "resize"
        }
    );    
}

function createOSMLayer() {
    return new OpenLayers.Layer.OSM("OSM - OpenCycleMap",
          ["http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
           "http://b.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png",
           "http://c.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png"]);
}

function createAnimatedLayer() {
    return new OpenLayers.Layer.WMS(ANIMATED_LAYER_NAME, "http://localhost:8080/geoserver/ncdc/wms/animate", {
          LAYERS: 'ncdc:vinterpolation',
          FORMAT: 'image/gif;subtype=animated',
          FORMAT_OPTIONS: 'antialias:none;gif_loop_continuosly:true;gif_frames_delay:100',
          TRANSPARENT: 'true',
          REQUEST: 'getmap',
          SERVICE: 'animate',
          VERSION: '1.1.1',
          aparam: 'cql_filter',
          avalues: 'doy=1,doy=2,doy=3,doy=4,doy=5,doy=6,doy=7'
      }, {
          singleTile: true,
          isBaseLayer: false,
          visibility: false
      });
}

function createStatesLayer() {
    return new OpenLayers.Layer.WMS("United States", "http://localhost:8080/geoserver/ncdc/wms", {
          LAYERS: 'ncdc:states',
          FORMAT_OPTIONS: 'antialias:none',
          TRANSPARENT: 'true',
          CQL_FILTER: "STUSPS NOT IN ('AK','HI','AS','MP','PR','VI','UM','GU')"
    }, {
        singleTile: true, // Has to be true, otherwise labels will repeat within the same polygon
        isBaseLayer: false,
        visibility: true    
    });
}

function initControls() {
    $('#temperature-range-options input').each(function() {
        var self = $(this);
        var label = self.next();
        var label_text = label.text();

        label.remove();
        self.iCheck({
            checkboxClass: 'icheckbox_line-blue',
            insert: '<div class="icheck_line-icon"></div>' + label_text
        });            
    });    
    
    // Temperature colors, as in the SLD
    var colors = ['AB86C1', '7EAAD1', '68C1D6', '66BB9D', 'B9DF76', 'FFDD67'];
    
    // Changes the colors of the checkboxes to match the temperature ranges
    $(".icheckbox_line-blue").each(function() {
        $(this).css("background-color", "#" + colors.shift());
    });
    
    $("#initial-date").datepicker({
        minDate: new Date(2014, 0, 1),
        maxDate: new Date(2014, 11, 24),
        onSelect: function() {
            var date = $(this).datepicker("getDate");
            var finalDate = new Date(date.getTime() + 604800000);
            var doy = date.dayOfYear();
            $("#initial-doy").val(doy);
            $("#final-doy").val(doy + 7);
            $("#final-date").val((finalDate.getMonth() + 1).pad(2) + "/" + finalDate.getDate().pad(2) + "/2014");
        }
    });
    
    $("#temperature-panel").dialog({
        width: 420,
        height: 350,
        autoOpen: false,
        title: 'Visualization options',
        buttons: {
            "Close": function() {
              $(this).dialog("close");
            },
            "Apply": function() {
                 updateTemperatures();
                $(this).dialog("close");
            }
        }
    });    
    
    $("#temperature-panel-button").click(function() {
        $("#temperature-panel").dialog("open");
    });    
}

function updateTemperatures() {
    var layer = map.getLayersByName(ANIMATED_LAYER_NAME)[0];
    layer.mergeNewParams({
        AVALUES: buildCQL()
    });
    layer.setVisibility(true);
    layer.redraw();
}

function buildCQL() {
    var selectedRanges = $("input[name='temperature-range']:checked").map(function(){return $(this).val();}).get();
    var initialDOY = parseInt($("#initial-doy").val());
    var rangeCQL = "";
    
    // If all ranges were selected, there is no need to include the range_id filter, hence the condition 
    if (selectedRanges.length == 1) {
        rangeCQL = "and range_id=" + selectedRanges.toString();
    } else  if (selectedRanges.length < 6) { // Unfortunately the ECQL construct "in" does not work
        rangeCQL += " and (";
    
        for (var r = 0; r < selectedRanges.length; r++) {
            rangeCQL += (r > 0 ? " or " : "") + "range_id=" + selectedRanges[r];
        }
        
        rangeCQL += ")";
    } 
    
    var finalCQL = "";
    
    for (var doy = initialDOY, c = 0; doy < (initialDOY + 7); doy++, c++) {
        finalCQL += "doy=" + doy + rangeCQL + ",";
    }
    
    return finalCQL.substring(0, finalCQL.length - 1);    
}

// Some duck typing...

Date.prototype.dayOfYear = function() {
    var j1= new Date(this);
    j1.setMonth(0, 0);
    return Math.round((this-j1)/8.64e7);
}

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}