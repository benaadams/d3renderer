var d3 = require( 'd3' );

var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'Access-Control-Request-Method': '*',
    'Access-Control-Allow-Methods': '*',
    'Content-Type': 'image/svg+xml'
};

var style = "svg {  \
  font: 10px sans-serif;    \
}   \
    \
.axis path, \
.axis line {    \
  fill: none;   \
  stroke: #000; \
  shape-rendering: crispEdges;  \
}   \
    \
.x.axis path {  \
  display: none;    \
}   \
    \
.line { \
  fill: none;   \
  stroke: steelblue;    \
  stroke-width: 1.5px;  \
}   \
";

module.exports = function (res, dataPath ) {


var document = require( 'jsdom' ).jsdom();
    
var margin = {top: 10, right: 50, bottom: 30, left: 60},
        width = 888 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

var parseDate = d3.time.format("%Y-%m-%d").parse;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var line = d3.svg.line()
    .defined(function(d) { 
        return d.value != 0; 
        })
    .interpolate("basis")
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.value); });


var root = d3.select( document.body )
  .append( "svg" )
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

root.append("defs")
   .append("style")
   .text(style);
    
var svg = root.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv(dataPath, function(error, data) {
  if (error) {
	res.statusCode = 500;
	res.end(error);
    return;
  };

  color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));
  
  data.forEach(function(d) {
    d.date = parseDate(d.date);
  });

  var types = color.domain().map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {date: d.date, value: +d[name]||0};
      })
    };
  });

  x.domain(d3.extent(data, function(d) { return d.date; }));

  y.domain([
    d3.min(types, function(c) { return d3.min(c.values, function(v) { return v.value; }); }),
    d3.max(types, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
  ]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("RPS");

  var type = svg.selectAll(".type")
      .data(types)
    .enter().append("g")
      .attr("class", "type");

  type.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return color(d.name); });

  type.append("text")
      .datum(labelInfo)
      .attr("transform", function(d) { return "translate(" + x(d.date) + "," + y(d.value) + ")"; })
      .attr("x", 3)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });
  
  	res.writeHead( 200, headers );

	var svgObject = d3.select( document.body ).select( "svg" ).attr( 'xmlns', 'http://www.w3.org/2000/svg' );
    
	res.end( svgObject[0][0].outerHTML  );
});

function labelInfo(d) {
    var maxDate = d3.max(d.values, 
        function(v) { 
            return v.value > 0 ? v.date : new Date(0); 
        }
    );
    var maxValue = d3.max(d.values, 
        function(v) { 
            return (v.date == maxDate) ? v.value : 0; 
        }
    );
    
    var v = {
                name: d.name, 
                value: maxValue, 
                date: maxDate
            };
    return v;
}

};