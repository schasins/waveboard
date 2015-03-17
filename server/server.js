var fs = require('fs');
var path = require('path');
var express = require('express');
var socketio = require('socket.io');
var bodyParser = require('body-parser');

var BROADCAST = true; // when true send data to client

var processFile = function(err, test_data) {
    if (err) {
        return console.log(err);
    }
    var test_data_array = test_data.split(" ");
    var tmp = [];
    for (var i = 0; i< test_data_array.length; i++){
        var str = test_data_array[i];
        if (str === "" || str === " "){
            continue;
        }
        var number = parseFloat(test_data_array[i]);
        if (!isNaN(number)) {
            tmp.push(parseFloat(test_data_array[i]));
        }
    }
    test_data_arrays.push(tmp);
}

// loading fake data
var test_data_arrays = [];
fs.readFile('server/total_acc_x_truncated.txt', 'utf8', processFile);
fs.readFile('server/total_acc_y_truncated.txt', 'utf8', processFile);
fs.readFile('server/total_acc_z_truncated.txt', 'utf8', processFile);

// SERVERS
var express_app = express();

// static file server
var p = path.join(__dirname, '../client');
console.log("Serving: ",p);
express_app.use(express.static(p));

// starts the static file server and post requests handler
var express_server = express_app.listen(8000);

// socketio server to stream data to the client
var socketio_server = socketio.listen(express_server);
socketio_server.on('connect', function(socket) {
    console.log('client connected');
    socketio_server.emit('data', test_data_arrays);
    socket.on('disconnect', function() {
        console.log('client disconnected');
    });
});

// handle post requests of data from arduino
express_app.use(bodyParser.urlencoded({ extended: false }));
express_app.post('/caught', function(req, res) {
    console.log('got caught post');
    BROADCAST = false;
    setTimeout(function() {
        BROADCAST = true;
    }, 3 * 1000 * 60); // 3 minutes (15 min is too long for testing/demo)
    res.end("yes");
});
express_app.post('/data', function(req, res) {
    console.log('got data post with request body', req.body);
    var dict = req.body;
    if (dict.x){
        if (BROADCAST) {
            socketio_server.emit('acc', [parseFloat(dict.x),parseFloat(dict.y),parseFloat(dict.z)]);
        }
        fs.appendFile('server/acc.txt', dict.x+","+dict.y+","+dict.z+'\n', function(err) {
            if (err) throw err;
            console.log('appended to acc.txt');
        });  
    }
    if (dict.gps){
        if (BROADCAST) {
            socketio_server.emit('gps', dict.gps);
        }
        fs.appendFile('server/gps.txt', dict.gps+'\n', function(err) {
            if (err) throw err;
            console.log('appended to gps.txt');
        });  
    }
    fs.appendFile('server/data.txt', JSON.stringify(req.body) + '\n\n', function(err) {
        if (err) throw err;
        console.log('appended to data.txt');
    });
    res.end("yes");
});
