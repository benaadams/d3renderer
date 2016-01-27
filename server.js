XMLHttpRequest = require('xhr2');

var port = process.env.PORT || 1337;
var dataUrlBase = "https://raw.githubusercontent.com/benaadams/d3renderer/master/data/";
    
var express = require( 'express' ),
	app = express();

app.get( '/favicon.ico', function ( req, res ) {
	res.statusCode = 404;
	res.end();
} );

app.get( '/', function ( req, res ) {
	res.statusCode = 404;
	res.end();
} );

app.get( '/plaintext', function ( req, res ) {
    require( './renderers/graph.js' )(res, dataUrlBase + 'plaintext.csv');
} );
app.get( '/json', function ( req, res ) {
    require( './renderers/graph.js' )(res, dataUrlBase + 'json.csv');
} );

var server = app.listen( port, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log( 'App listening at http://%s:%s', host, port );
} );