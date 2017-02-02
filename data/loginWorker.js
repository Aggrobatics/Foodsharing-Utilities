
/* ***** BEGIN LICENSE BLOCK *****
 
 * Author: Markus Schmieder (Aggrobatics)
 
 * This file is part of The Firefox Foodsharing-Utilities Addon.
 
 * The Firefox Foodsharing-Utilities Addon is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 
 * The Firefox Foodsharing-Utilities Addon is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 
 * You should have received a copy of the GNU General Public License
 * along with The Firefox Foodsharing-Utilities Addon.  If not, see http://www.gnu.org/licenses/.
 
 * ***** END LICENSE BLOCK ***** */

console.log("Start of login script. Received new doc");
var b_usePost = false;

// if logged in, inform main. 
if(document.querySelector("#infobar"))
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
		console.log("found loginbar!");
		var form = document.getElementById("loginbar");

		// enter email
		document.querySelector("#loginbar input[name=email_adress]").value = email;
		
		// enter password
		document.querySelector("#loginbar input[name=password]").value = password;


		// // enter email
		// var nameField = document.querySelector("#loginbar input[name=email_adress]");
		// nameField.appendChild(document.createTextNode(name));
		
		// // enter password
		// var passField = document.querySelector("#loginbar input[name=password]");
		// passField.appendChild(document.createTextNode(password));


		// submit will reload the page and restart the script
		form.submit();
	}
	else
	{
		console.log("login worker could not find loginbar");
	}
});

self.port.on("refresh", function()
{
	console.log("loginWorker received refresh command");
	var foodsharingTitle = document.querySelector("#layout_logo > a:nth-child(1)");
	if(Boolean(foodsharingTitle))
	{
		console.log("trying to click that naughty one");
		foodsharingTitle.click();
	}
});
