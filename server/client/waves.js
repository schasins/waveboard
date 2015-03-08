var highest_reading = .7;
var lowest_reading = -.7;
var difference = highest_reading - lowest_reading;

var most_recent_min = lowest_reading;
var most_recent_max = highest_reading;
var current_points = [];

var canvas_height = $(window).height();;
var canvas_width = $(window).width();;

var canvas = document.createElement('canvas');
canvas.id     = "c";
canvas.width  = canvas_width;
canvas.height = canvas_height;

var context = null;
var test_data_array = null;

function setup(){
	document.body.appendChild(canvas);
	context = canvas.getContext("2d");

    var socket = io();
    socket.on('data', function(d) {
        test_data_array = d;
        console.log('test_data_array', test_data_array);
        var testing = true;
        if (testing){
            playSound(test_data_array);
            test(0);
        }
    });
}
$(setup);

function intersection(x1,y1,x2,y2,x3,y3,x4,y4){
	var x = ((x1*y2-y1*x2)*(x3-x4) - (x1-x2)*(x3*y4-y3*x4)) / ((x1-x2)*(y3-y4) - (y1-y2)*(x3-x4));
	var y = ((x1*y2-y1*x2)*(y3-y4) - (y1-y2)*(x3*y4-y3*x4)) / ((x1-x2)*(y3-y4) - (y1-y2)*(x3-x4));
	return [x,y];
}

var getColor = function() {
    // TODO do something with data here

    var r = 111, g = 227, b = 245, a = 1.0;
    var target_r = r, target_g = g, target_b = b, target_a = a;
    var rate = 10;
    var rgba = set_rgba();

    function randint() {
        return 125 + Math.floor(Math.random() * 125);
    }
    function expdecay(val, target) {
        return val + (target - val)/rate;
    }
    function set_rgba() {
        rgba = 'rgba(' + Math.floor(r) + ','
                       + Math.floor(g) + ','
                       + Math.floor(b) + ','
                       + a + ')';
    }

    setInterval(function() {
        target_r = randint();
        target_g = randint();
        target_b = randint();
    }, 2000);
    setInterval(function() {
        r = expdecay(r, target_r);
        g = expdecay(g, target_g);
        b = expdecay(b, target_b);
        set_rgba();
    }, 50);

    return function(data) {
        return rgba;
    }
}();

function updateVisual(new_reading){
	var x = canvas_width+1;
	var portion = (new_reading-lowest_reading)/difference;
	var y = canvas_height*portion;
	//console.log(new_reading, portion);
	var new_point = [x,y];
	current_points.push(new_point);
	var radius = 3;

	//clear canvas
	context.clearRect( 0 , 0 , canvas.width, canvas.height );

	var new_current_points = [];
	var adjustment_per_period = 60;
	for (var i = 0; i<current_points.length; i++){
		var x = current_points[i][0];
		var y = current_points[i][1];
		var x = x - adjustment_per_period;
		if (x-radius >= 0){
			new_current_points.push([x,y]);
		}
		context.beginPath();
	    context.arc(x, y, radius, 0, 2 * Math.PI, false);
	    context.fillStyle = getColor();
	    context.fill();
	    if (i > 0){
	    	var x1 = x;
	    	var y1 = y;
	    	var x2 = current_points[i-1][0] - adjustment_per_period;
	    	var y2 = current_points[i-1][1];
	    	var l = intersection(x1,y1,x2,y2,0,0,0,16);
	    	var r = intersection(x1,y1,x2,y2,canvas_width,0,canvas_width,16);
	    	var t = intersection(x1,y1,x2,y2,0,0,16,0);
	    	var b = intersection(x1,y1,x2,y2,0,canvas_height,16,canvas_height);
	    	var edges = [l,r,t,b];
	    	var winners = [];
	    	for (var j = 0; j< 4; j++){
	    		var x_c = edges[j][0];
	    		var y_c = edges[j][1];
	    		if (x_c > -1 && x_c < canvas_width+1 && y_c > -1 && y_c < canvas_height + 1){
	    			winners.push(edges[j])
	    		}
	    	}
	    	context.beginPath();
		    context.moveTo(winners[0][0], winners[0][1]);
		    context.lineTo(winners[1][0], winners[1][1]);
            context.strokeStyle = getColor();
		    context.stroke();
	    }
	}
	current_points = new_current_points;
}

var playSound = function(data) {
    var dataIndex = 0;
    var context = new AudioContext();
    var dataNoise = context.createScriptProcessor(1024);
    dataNoise.onaudioprocess = function(e) {
        var leftIn = e.inputBuffer.getChannelData(0);
        var rightIn = e.inputBuffer.getChannelData(1);
        var leftOut = e.outputBuffer.getChannelData(0);
        var rightOut = e.outputBuffer.getChannelData(1);
        for (var i = 0; i < leftIn.length; i++) {
            var shift = i + Math.floor(data[dataIndex] * 50);
            if (shift < 0) shift = 0;
            if (shift >= leftIn.length) shift = leftIn.length - 1;
            leftOut[i] = leftIn[shift];
            rightOut[i] = rightIn[shift];

            dataIndex += 1;
            if (dataIndex >= data.length) {
                dataIndex = 0;
            }
        }
    };
    var source = context.createOscillator();
    source.connect(dataNoise);
    dataNoise.connect(context.destination);
    source.start(0);
};

/*********************************************
* Testing-specific code
*********************************************/

function test(index){
	updateVisual(test_data_array[index]);
	setTimeout(function(){test(index+1);},10);
}

