/*

if(loginbar present) {
    self.port.on('login', function(email, password) {
        // fill form, submit
    });
    self.port.emit('requestLogin');
} else if(badge found) {
    self.port.emit('updateBadge', css_badge.textContent);
}

// remove images here

*/

console.log("message worker is updating");

var css_badge;
// var observer;

if(document.querySelector(".msg > a:nth-child(1) > span:nth-child(2)"))//.getElementsByClassName("msg").getElementsByClassName("badge"))
{
	console.log("Found the Badge!");

	// get the observer target
	css_badge = document.querySelector(".msg > a:nth-child(1) > span:nth-child(2)");


	console.log("There are currently " + css_badge.innerHTML + " unread messages");
	/*
	* observer functionality does not work, as the page doesnt update itself
	*/
	self.port.emit("updateBadge", css_badge.innerHTML);
}
else if(document.getElementById("loginbar"))
{
	console.log("loginbar found. Request login");	
	
	self.port.emit("requestLogin");

	// self.port.once("login", function(email, password)
	// {
	// 	console.log("received login command");
	// 	var form = document.getElementById("loginbar");

	// 	// enter email
	// 	document.querySelector("#loginbar input[name=email_adress]").value = email;
		
	// 	// enter password
	// 	document.querySelector("#loginbar input[name=password]").value = password;

	// 	form.submit();

	// 	self.port.emit("loginSuccessful");

	// });
}
else
{
	console.log("Something went terribly wrong. Found neither loginbar, nor badge!");
}

// PORT MESSAGE APPROACH
// self.port.on("refreshPage", function()
// {
// 	console.log("I've been asked to refresh");
// });