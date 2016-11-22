
console.log("message worker is updating");

var css_badge;

// 1ST OPTION: RELOADING BY RESTART

if(document.querySelector(".msg > a:nth-child(1) > span:nth-child(2)"))//.getElementsByClassName("msg").getElementsByClassName("badge"))
{
	console.log("Found the Badge!");

	// get the observer target
	css_badge = document.querySelector(".msg > a:nth-child(1) > span:nth-child(2)");

	console.log("There are currently " + css_badge.innerHTML + " unread messages");

	self.port.emit("updateBadge", css_badge.innerHTML);
}
else if(document.getElementById("loginbar"))
{
	console.log("loginbar found. Request login");	
	
	self.port.emit("requestLogin");

}
else
{
	console.log("Something went terribly wrong. Found neither loginbar, nor badge!");
}


// 2ND OPTION: RELOADING BY CALL (same behaviour)

self.port.on("update", function(newHTML)
{
	document.write(newHTML);
	document.close();

	if(document.querySelector(".msg > a:nth-child(1) > span:nth-child(2)"))//.getElementsByClassName("msg").getElementsByClassName("badge"))
	{
		// console.log("Found the Badge!");

		// get the observer target
		css_badge = document.querySelector(".msg > a:nth-child(1) > span:nth-child(2)");

		console.log("There are " + css_badge.innerHTML + " unread messages");

		self.port.emit("updateBadge", css_badge.innerHTML);

		console.log("updateBadge has been sent to index.js");
	}
	else if(document.getElementById("loginbar"))
	{
		console.log("loginbar found. Request login");	
		
		self.port.emit("requestLogin");

	}
	else
	{
		console.log("Something went terribly wrong. Found neither loginbar, nor badge!");
	}
});