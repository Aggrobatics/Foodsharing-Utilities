console.log("start of login script");

if(document.getElementById("loginbar"))
{
	console.log("loginworker trying to log in now");	
	var form = document.getElementById("loginbar");

	form[0].value = "markus.schmieder@gmx.de";
	form[1].value = "Joe5023234";
	form.submit();
}
else if(document.querySelector(".msg > a:nth-child(1) > span:nth-child(2)"))//.getElementsByClassName("msg").getElementsByClassName("badge"))
{
	console.log("login successful! Informing main...");
	self.port.emit("loginPerformed", "Background page logged in");
}

console.log("end of login script");