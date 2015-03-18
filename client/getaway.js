/*
Code for exploring the user interaction around having a getaway reprieve button that a user 
can click after stealing the waveboard to prevent data going out and allowing the user to be 
immediately tracked down.  This feature is not fully implemented, but the UI elements are here
for exploration.
*/

function processForm(){
	console.log("processing form");
	$("#dialog").dialog( "close" );
	displayNewData = false;
	setTimeout(function(){displayNewData = true;},180000); //3 minutes
	return false;
}

function processGetaway(){
	var dialog = $("<div id='dialog' title='Log In'><form id='login'><input id='username' placeholder='username'></input><input id='password' placeholder='password' type='password'></br></input><button type='submit'>Submit</button></form></div>");
	dialog.dialog();
	$("#login").submit(processForm);
}

function getawayButton(){
	console.log("getaway button");
	var button = $("<button id='getaway'>Getaway Reprieve</button>");
	$("html").append(button);
	button.button();
	button.click(processGetaway);
}

$(getawayButton)