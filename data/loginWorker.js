console.log("start of login script");

// if logged in, inform main. 
if(document.querySelector("#infobar"))//.getElementsByClassName("msg").getElementsByClassName("badge"))
{
	console.log("login successful! Informing main...");
	self.port.emit("loginPerformed", 1);
}
else
{
	console.log("not logged in yet");
	self.port.emit("loginPerformed", 0);
}


self.port.on("login", function(email, password)
{
	// if not logged in, log in
	if(document.getElementById("loginbar"))
	{
		console.log("Received login command. Trying to log in now");	
		var form = document.getElementById("loginbar");

		// enter email
		document.querySelector("#loginbar input[name=email_adress]").value = email;
		
		// enter password
		document.querySelector("#loginbar input[name=password]").value = password;
		form.submit();
	}
	else
	{
		console.log("login worker could not find loginbar");
	}
});

console.log("end of login script");