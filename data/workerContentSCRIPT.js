var css_badge;
// var observer;

if(document.getElementById("loginbar"))
{
	console.log("loginbar found. Trying to log in now");	
	var form = document.getElementById("loginbar");

	form[0].value = "markus.schmieder@gmx.de";
	form[1].value = "Joe5023234";
	form.submit();
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

// PORT MESSAGE APPROACH
self.port.on("myMessage", function handleMyMessage(myMessagePayload) {
  		console.log("I've been asked to refresh");
});


// POST MESSAGE APPROACH
self.on("message", function(addonMessage) {
	console.log("YEAH! I can hear main!");
});

console.log("reached end of worker script");


