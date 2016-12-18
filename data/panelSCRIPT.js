
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

var button = document.getElementById("loginButton");
var pickupDatesList = document.getElementById("pickupDatesList");
var messagesList = document.getElementById("messagesList");
var statusDiv = document.getElementById("status");
var body = document.body;
var loggedIn = false;

body.addEventListener("click", function(event)
{
  element = event.target.closest('a.liContent');
  if((element) && (element.href))
  {
    event.preventDefault();
    event.stopPropagation();
    self.port.emit("openTab", element.href);
  }
});

self.port.on("showLoggedIn", function(/* pickupDates, messages */) {
  console.log("panel received login-info");
  loggedIn = true;
  statusDiv.innerHTML = "<center><i>You are now logged in!</i><center>";

  button.innerHTML = "";
  button.className = "openTab";
  button.onclick = function(){self.port.emit("openTab", "https://foodsharing.de")};
});

self.port.on("showLoggedOff", function()
{
  console.log("panel received logoff-info");
  loggedIn = false;
  messagesList.innerHTML = "";
  pickupDatesList.innerHTML = "";
  statusDiv.innerHTML = "<center><b>You are currently not logged in</b><br><sub>There is nothing to see here</sub><center>";

  button.innerHTML = "Login Now!";
  button.className = "";
  button.onclick = function(){self.port.emit("login");};
});

self.port.on("updateMsg", function(messages)
{
  console.log("panel received message update");

  if(loggedIn)
  {
    var totalString = "";
    for(var i = 0 ; i < messages.length; i++)
    {
      var element;
      element = '<li> <a href="https://foodsharing.de/?page=msg" class="liContent">';
        element += '<span class="name">' + messages[i].name + '</span><br>';
        element += '<span class="time">' + messages[i].time + '</span><br>';
        element += '<span class="message">' + messages[i].message + '</span><br>';
      element += "</a></li>";
      if(i < messages.length - 1)
        element += "<br>";

      totalString += element;
    }
    messagesList.innerHTML = totalString;
  }
  else
    console.log("But panel is in logged-off mode and will ignore");
});

self.port.on("updatePickups", function(pickupDates)
{
  console.log("panel received pickup update");
  if(loggedIn)
  {
    var totalString = "";
    for(var i = 0 ; i < pickupDates.length; i++)
    {
      var element;
      element = '<li> <a href="' + pickupDates[i].href + '"  class="liContent">';
        element += '<span class="name">' + pickupDates[i].place_string + '</span><br>';
        element += '<span class="time">' + pickupDates[i].time_string + '</span><br>';
      element += "</a></li>"
      if(i < messages.length - 1)
        element += "<br>";

      totalString += element;
    }
    pickupDatesList.innerHTML = totalString; 
  }
  else
    console.log("But panel is in logged-off mode and will ignore");
});


// DOES NOT WORK! ______________________________________________________________
/*
 
// this used to be in the panelHTML.html
var autoLoginCheckbox = document.getElementById("autoLogin");

autoLoginCheckbox.onChange = function(){
  console.log("registered checkbox onChange");
  // self.port.emit("autoLoginChanged", autoLoginCheckbox.checked);
};

autoLoginCheckbox.onClick = function(){
  console.log("registered checkbox onClick");
  // self.port.emit("autoLoginChanged", autoLoginCheckbox.checked);
}; 

autoLoginCheckbox.change = function(){
  console.log("registered checkbox change");
  // self.port.emit("autoLoginChanged", autoLoginCheckbox.checked);
};

autoLoginCheckbox.click = function(){
  console.log("registered checkbox click");
  // self.port.emit("autoLoginChanged", autoLoginCheckbox.checked);
};

*/