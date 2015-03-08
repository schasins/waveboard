var fs = require('fs');
var path = require('path');
var express = require('express');
var socketio = require('socket.io');

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

// starting servers
var express_app = express();
var p = path.join(__dirname, '../client');
console.log("Serving: ",p);
express_app.use(express.static(p));
var express_server = express_app.listen(8000);
var socketio_server = socketio.listen(express_server);

socketio_server.on('connect', function(socket) {
    console.log('client connected');
    socketio_server.emit('data', test_data_arrays);
    socket.on('disconnect', function() {
        console.log('client disconnected');
    });
});
