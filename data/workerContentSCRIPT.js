// // are we logged in yet?
// var css_badge_value = document.querySelector(".msg > a:nth-child(1) > span:nth-child(2)").innerHTML;
// if(css_badge_value)
// {
// 	// // var badge_value = document.getElementById("infobar").getElementByClassName("msg")[0].getElementByClassName("badge")[0].innerHTML;
// 	console.log("There are currently " + css_badge_value + " unread messages");

// 	self.port.emit("Done", "Please kill me!");
// }

// log in now!

var css_badge;
var observer;

if(document.getElementById("loginbar"))
{
	console.log("loginbar found. Trying to log in now");	
	var form = document.getElementById("loginbar");

	form[0].value = "markus.schmieder@gmx.de";
	form[1].value = "Joe5023234";
	form.submit();

	// self.port.emit("foodsharing loaded", "Background page logged in");
}
else if(document.querySelector(".msg > a:nth-child(1) > span:nth-child(2)"))//.getElementsByClassName("msg").getElementsByClassName("badge"))
{
	console.log("Badge found! Login was successful");

	// get the observer target
	css_badge = document.querySelector(".msg > a:nth-child(1) > span:nth-child(2)");
	console.log("There are currently " + css_badge.innerHTML + " unread messages");

	/*
	* observer functionality does not work, as the page doesnt update itself
	*/
	
	self.port.emit("startInterval");
};

self.port.on("refreshPage", function()
{
	console.log("I've been asked to refresh");
});

// TEST
self.port.on("myMessage", function handleMyMessage(myMessagePayload) {
  		console.log("I've been asked to refresh");
});


// POST MESSAGE APPROACH

// self.postMessage(contentScriptMessage);

self.on("message", function(addonMessage) {
	console.log("YEAH! I can hear main!");
});

console.log("reached end of worker script");


