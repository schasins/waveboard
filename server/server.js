var fs = require('fs');
var path = require('path');
var express = require('express');
var socketio = require('socket.io');
var bodyParser = require('body-parser');

var BROADCAST = true; // when true send data to client

// using old accelerometer data from something else
/*
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

var test_data_arrays = [];
fs.readFile('server/total_acc_x_truncated.txt', 'utf8', processFile);
fs.readFile('server/total_acc_y_truncated.txt', 'utf8', processFile);
fs.readFile('server/total_acc_z_truncated.txt', 'utf8', processFile);
*/

// using accelerometer data from our waveboard
var test_data_arrays = [[], [], []];
fs.readFile('server/acc_old_log.csv', 'utf8', function(err, text) {
    if (err) {
        return console.log(err);
    }
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var xyz_strings = lines[i].split(',');
        var xyz_numbers = [];
        var numbers_all_good = true;
        for (var j = 0; j < 3; j++) {
            var a = parseFloat(xyz_strings[j]);
            xyz_numbers.push(a);
            if (isNaN(a) || !isFinite(a)) {
                numbers_all_good = false;
            }
        }
        if (numbers_all_good) {
            test_data_arrays[0].push(xyz_numbers[0]);
            test_data_arrays[1].push(xyz_numbers[1]);
            test_data_arrays[2].push(xyz_numbers[2]);
        } else {
            console.log('skipping bad data', xyz_numbers);
        }
    }
});

// SERVERS
var express_app = express();

// static file server
var p = path.join(__dirname, '../client');
console.log("Serving: ",p);
express_app.use(express.static(p));

// starts the static file server and post requests handler
// TODO: choose server location
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

var counter = 0;
var last_reset = new Date();
// handle post requests of data from arduino
express_app.use(bodyParser.urlencoded({ extended: false }));
express_app.post('/caught', function(req, res) {
    console.log('got caught post');
    BROADCAST = false;
    last_reset = new Date();
    setTimeout(function() {
        BROADCAST = true;
    }, 3 * 1000 * 60); // 3 minutes (15 min is too long for testing/demo)
    res.end("yes");
});
express_app.post('/data', function(req, res) {
    counter += 1;
    console.log(counter+': got post with request body', req.body);
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
    if (dict.gps != "null"){
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

function sendTimeSinceReset(){
    socketio_server.emit('timeSinceReset', (new Date() - last_reset));
    setTimeout(sendTimeSinceReset,60000);
}
sendTimeSinceReset();
