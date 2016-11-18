
console.log("message worker is updating");

var css_badge;

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
