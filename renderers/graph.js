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
  fill:rgb(50%, 50%, 50%);  \
}   \
    \
.axis path, \
.axis line {    \
  fill: none;   \
  stroke: rgb(50%, 50%, 50%); \
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
.xtick { \
  transform: rotate(-35deg);  \
  text-anchor: end; \
}   \
";

module.exports = function (res, dataPath ) {
    var cached = dataCache[dataPath];

    if (!cached) {
        dataCache[dataPath] = {isUpdating: true};
    }

    if (cached && cached.render) {
        
        headers["Cache-Control"] = "public, max-age=30";
        headers["Expires"] = (new Date(Date.now() + 30000)).toUTCString(); 
        
        res.writeHead( 200, headers );
        res.end( cached.render );
        
        if ( cached.renderDate < Date.now() - 65000 ) {
            updateCache(dataPath);
        }
        
    } else {    
        d3.csv(dataPath, 
            function(error, data) { 
                if (error) {
                    return;
                };
                prepareData(data, dataPath);
                
                cached = dataCache[dataPath];
                
                headers["Cache-Control"] = "public, max-age=30";
                headers["Expires"] = (new Date(Date.now() + 30000)).toUTCString(); 
                
                res.writeHead( 200, headers );

                res.end( cached.render );
            }
        );
    }
}

function updateCache(dataPath) {
    var entry = dataCache[dataPath];
    if (!entry.isUpdating && (entry.renderDate || 0) < Date.now() - 10000) {
        entry.isUpdating = true;
        d3.csv(dataPath, 
            function(error, data) { 
                if (error) {
                    return;
                };
                prepareData(data, dataPath);
            }
        );
    }
}

function prepareData(data, dataPath) {


var document = require( 'jsdom' ).jsdom();
var margin = {top: 10, right: 0, bottom: 50, left: 40},
        width = 888 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

var parseDate = d3.time.format("%Y-%m-%d").parse;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
    .scale(x)
    .tickFormat(d3.time.format("%d %b %y"))
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .tickFormat(function(v){
        if (v >= 10000000000000) {
            return (v / 1000000000000).toFixed(0) + "Tn";
        }
        if (v >= 1000000000000) {
            return (v / 1000000000000).toFixed(1) + "Tn";
        }
        if (v >= 10000000000) {
            return (v / 1000000000).toFixed(0) + "Bn";
        }
        if (v >= 1000000000) {
            return (v / 1000000000).toFixed(1) + "Bn";
        }
        if (v >= 10000000) {
            return (v / 1000000).toFixed(0) + "M";
        }
        if (v >= 1000000) {
            return (v / 1000000).toFixed(1) + "M";
        }
        if (v >= 1000) {
            return (v / 1000).toFixed(0) + "K";
        }
        return v;
    })
    .orient("left");

var line = d3.svg.line()
    .defined(function(d) { return d.value != 0; })
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

  color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));
  
  data.forEach(function(d) {
      if (!(d.date instanceof Date)) {
        d.date = parseDate(d.date);
      }
  });

  var types = color.domain().map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {date: d.date, value: +d[name]||0};
      })
    };
  });

  var xDomain = d3.extent(data, function(d) { return d.date; });
  xDomain[1] = new Date();
      
  x.domain(xDomain);

  y.domain([
    d3.min(types, function(c) { return d3.min(c.values, function(v) { return v.value; }) / 1.25; }),
    d3.max(types, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
  ]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.5em")
      .attr("dy", ".125em")
      .attr("class", "xtick");

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
      .style("stroke", function(d) { return color(d.name); })
    .append("title")
      .text(function(d) { return d.name; });
      

var point = type.append("g")
            .attr("class", "line-point");

    point.selectAll('circle')
        .data(function(d){ 
                return d.values
                    .filter(function(c) { return c.value != 0; })
        })
        .enter()
      .append('circle')
        .attr("cx", function(d) { return x(d.date) })
        .attr("cy", function(d) { return y(d.value) })
        .attr("r", 3)
        .style("fill", "white")
        .style("stroke", function(d) { return color(this.parentNode.__data__.name); })
    .append("title")
      .text(function(d) { 
          return this.parentNode.parentNode.__data__.name;
          });

    type.append("text")
      .datum(labelInfo)
      .attr("transform", function(d) { return "translate(" + x(d.date) + "," + y(d.value) + ")"; })
      .attr("x", 3)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });


	var svgObject = d3.select( document.body ).select( "svg" ).attr( 'xmlns', 'http://www.w3.org/2000/svg' );
    
    var cached = dataCache[dataPath];
    cached.renderDate = Date.now();
    cached.render = svgObject[0][0].outerHTML;
    cached.isUpdating = false;
}

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
