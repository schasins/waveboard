var highest_reading = 3;
var lowest_reading = -3;
var difference = highest_reading - lowest_reading;

var most_recent_min = lowest_reading;
var most_recent_max = highest_reading;
var current_points = [[],[],[]];

var canvas_height = $(window).height();
var canvas_width = $(window).width();

var canvas = document.createElement('canvas');
canvas.id     = "c";
canvas.width  = canvas_width;
canvas.height = canvas_height;

var context = null;
var test_data_arrays = null;


var displayNewData = true;

function setup(){
	document.body.appendChild(canvas);
	context = canvas.getContext("2d");

    var socket = io.connect('http://kaopad.cs.berkeley.edu:1235');
    socket.on('data', function(d) {
        test_data_arrays = d;
        console.log('test_data_arrays', test_data_arrays);
        var testing = false;
        if (testing){
            test(0);
            testSound(0);
        }
    });

    socket.on('acc', function(d) {
        if (!displayNewData){return;}
        updateVisual(d); //[x,y,z]
        updateSound(d);
    });

    socket.on('gps', function(d){
        if (!displayNewData){return;}
        var ls = d.split(" ");
        newPosition(parseFloat(ls[0]),parseFloat(ls[1]));
    });
}
$(setup);

function intersection(x1,y1,x2,y2,x3,y3,x4,y4){
	var x = ((x1*y2-y1*x2)*(x3-x4) - (x1-x2)*(x3*y4-y3*x4)) / ((x1-x2)*(y3-y4) - (y1-y2)*(x3-x4));
	var y = ((x1*y2-y1*x2)*(y3-y4) - (y1-y2)*(x3*y4-y3*x4)) / ((x1-x2)*(y3-y4) - (y1-y2)*(x3-x4));
	return [x,y];
}

var getColorFunc = function() {
    // TODO do something with data here

    var r = 0, g = 227, b = 245, a = 1.0;
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
        rgba = 'rgba(' + 0 + ','
                       + Math.floor(g) + ','
                       + Math.floor(b) + ','
                       + a + ')';
    }

    setInterval(function() {
        target_r = 0;
        target_g = randint();
        target_b = randint();
    }, 2000);
    setInterval(function() {
        r = 0;
        g = expdecay(g, target_g);
        b = expdecay(b, target_b);
        set_rgba();
    }, 50);

    return function(data) {
        return rgba;
    }
};
var getColors = [getColorFunc(),getColorFunc(),getColorFunc()];

function updateVisualOneAxis(new_reading, index){
    var x = canvas_width+1;
    var portion = (new_reading-lowest_reading)/difference;
    var y = canvas_height*portion;
    //console.log(new_reading, portion);
    var new_point = [x,y];
    current_axis_points = current_points[index];
    current_axis_points.push(new_point);
    var radius = 3;

    var new_current_axis_points = [];
    var adjustment_per_period = 60;
    for (var i = 0; i<current_axis_points.length; i++){
        var x = current_axis_points[i][0];
        var y = current_axis_points[i][1];
        var x = x - adjustment_per_period;
        if (x-radius >= 0){
            new_current_axis_points.push([x,y]);
        }
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI, false);
        context.fillStyle = getColors[index]();
        context.fill();
        if (i > 0){
            var x1 = x;
            var y1 = y;
            var x2 = current_axis_points[i-1][0] - adjustment_per_period;
            var y2 = current_axis_points[i-1][1];
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
            context.strokeStyle = getColors[index]();
            context.stroke();
        }
    }
    current_points[index] = new_current_axis_points;
}

function updateVisual(new_readings){
    //clear canvas
    context.clearRect( 0 , 0 , canvas.width, canvas.height );

    for (var i = 0; i< new_readings.length; i++){
        updateVisualOneAxis(new_readings[i],i);
    }
}

var updateSound = (function() {
    console.log('initializing sounds');
    var audioCtx = new AudioContext();
    var osc1 = audioCtx.createOscillator();
    osc1.frequency.value = 200;
    var osc2 = audioCtx.createOscillator();
    osc2.frequency.value = 200;
    var gain = audioCtx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    osc1.start(0);
    osc2.start(0);

    gain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 5.0);

    /* why does gain crackle? it's not linearly ramping at all!!!
    function updateGain() {
        var t = Math.floor(Math.random() * 15);
        var g = Math.floor(Math.random()*100) / 100 + 0.01;
        if ( g > 0.9 ) g = 0.9;
        console.log('g', g, 't', t);
        gain.gain.linearRampToValueAtTime(g, audioCtx.currentTime + t);
        setTimeout(updateGain, 1000*t + 9000);
    }
    setTimeout(updateGain, 6000);
    */

    var beatFreq = 20;
    return function(data) {
        if (Math.random() < 0.5) return;

        var x = data[0];
        var y = data[1];
        var z = data[2];
        var f1 = Math.abs(x) * 200;

        beatFreq = Math.random() * 5;
        if (Math.random() > 0.7) beatFreq *= 2;
        if (Math.random() > 0.85) beatFreq += 10;
        var f2 = f1 + beatFreq;

        console.log('f1', f1, 'f2', f2);
        osc1.frequency.linearRampToValueAtTime(f1, audioCtx.currentTime + 3.0);
        osc2.frequency.linearRampToValueAtTime(f2, audioCtx.currentTime + 3.0);
    };
})();


/*********************************************
* Testing-specific code
*********************************************/

function test(index){
    var x = test_data_arrays[0][index];
    var y = test_data_arrays[1][index];
    var z = test_data_arrays[2][index];
	updateVisual([x,y,z]);
	setTimeout(function(){test(index+1);},10);
}

function testSound(index) {
    var x = test_data_arrays[0][index];
    var y = test_data_arrays[1][index];
    var z = test_data_arrays[2][index];
    updateSound([x,y,z]);
	setTimeout(function(){testSound(index+1);},3000);
}
