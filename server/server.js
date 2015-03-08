var fs = require('fs');
var path = require('path');
var express = require('express');
var socketio = require('socket.io');

// loading fake data
var test_data_array = null;
fs.readFile('fake_data.txt', 'utf8', function(err, test_data) {
    if (err) {
        return console.log(err);
    }
    test_data_array = test_data.split(" ");
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
    test_data_array = tmp;
});

// starting servers
var express_app = express();
express_app.use(express.static(path.join(__dirname, 'client')));
var express_server = express_app.listen(8000);
var socketio_server = socketio.listen(express_server);

socketio_server.on('connect', function(socket) {
    console.log('client connected');
    socketio_server.emit('data', test_data_array);
    socket.on('disconnect', function() {
        console.log('client disconnected');
    });
});
