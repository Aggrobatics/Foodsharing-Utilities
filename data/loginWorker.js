console.log("Start of login script. Received new doc");
var b_usePost = false;

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
	console.log("loginWorker received login-command");
	// if not logged in, log in
	if(document.getElementById("loginbar"))
	{
		if(b_usePost)
		{
			console.log("using POST. email: " + email + "; password: " + password);
			// var data = new FormData();
			
			// data.append("page", "login");
			// data.append("ref", "/?page=dashboard");
			// data.append('email_adress', email);
			// data.append('password', password);

			var data = "email_adress=" + email + "&password=" + password;

			var xhr = new XMLHttpRequest();
			xhr.open('POST', "https://foodsharing.de", true);
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			// xhr.responseType = "document";
			
			
			xhr.onreadystatechange = function () 
			{
				if (xhr.readyState === XMLHttpRequest.DONE) 
				{
					if (xhr.status === 200) 
					{
						console.log("status = 200. Object: " + Boolean(this.responseText));
						console.log("loginbar index: " + this.responseText.search('id="loginbar"'));
						self.port.emit("loginPerformed", -1);
						// var responseHtml = document.createElement(this.responseText);
						// console.log(responseHtml);
						// console.log("loginbar present: " + responseHtml.getElementById("loginbar").outerHTML);
						// if(!this.responseText.getElementById("loginbar"))
						// {
						// 	console.log("we are logged in!!!");
						// 	self.port.emit("loginPerformed", 1);
						// }
						// else
						// 	console.log("but login failed :-()");
					}
					else
						console.log("there was a problem with the response.status");
				}
   		 	};
			xhr.onload = function () {
				// do something to response
				

			};
			xhr.send(data);
			console.log("data sent");
		}
		else
		{
			console.log("found loginbar!");
			// console.log("Received login command. Trying to log in now");	
			var form = document.getElementById("loginbar");

			// enter email
			document.querySelector("#loginbar input[name=email_adress]").value = email;
			
			// enter password
			document.querySelector("#loginbar input[name=password]").value = password;

			// submit will reload the page and restart the script
			form.submit();
		}
	}
	else
	{
		console.log("login worker could not find loginbar");
	}
});

// console.log("end of login script");

self.port.on("refresh", function()
{
	console.log("loginWorker received refresh command");
	var foodsharingTitle = document.querySelector("#layout_logo > a:nth-child(1)");
	console.log("foodsharingTitle: " + foodsharingTitle);
	if(Boolean(foodsharingTitle))
	{
		console.log("trying to click that naughty one");
		foodsharingTitle.click();
	}
});