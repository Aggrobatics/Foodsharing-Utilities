
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
var brElement = document.createElement("br");


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

self.port.on("showLoggedIn", function() {
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
  
  console.log("First child: " + messagesList.firstChild);
  // Flush list
  while (messagesList.firstChild) {
    messagesList.removeChild(messagesList.firstChild);
  }

  if(loggedIn)
  {
    for(var i = 0 ; i < messages.length; i++)
    {
      var name;
      name = document.createElement("span");
      name.appendChild(document.createTextNode(messages[i].name));
      name.className = "name";

      var time;
      time  = document.createElement("span");
      time.appendChild(document.createTextNode(messages[i].time));
      time.className = "time";

      var message;
      message = document.createElement("span");
      message.appendChild(document.createTextNode(messages[i].message));
      message.className = "message";

      var newLinkItem = document.createElement("a");
      newLinkItem.href="https://foodsharing.de/?page=msg";
      newLinkItem.className = "liContent";
      newLinkItem.appendChild(name);
      newLinkItem.appendChild(time);
      newLinkItem.appendChild(message);
      newLinkItem.insertBefore(brElement.cloneNode(), time);
      newLinkItem.insertBefore(brElement.cloneNode(), message);
      newLinkItem.appendChild(brElement.cloneNode());

      var newMessageItem = document.createElement("li");
      newMessageItem.appendChild(newLinkItem);
      newMessageItem.appendChild(brElement.cloneNode());

      messagesList.appendChild(newMessageItem); 
    } 
  }
  else
    console.log("But panel is in logged-off mode and will ignore");
});

self.port.on("updatePickups", function(pickupDates)
{
  console.log("panel received pickup update");

  while (pickupDatesList.firstChild) {
    pickupDatesList.removeChild(pickupDatesList.firstChild);
  }

  if(loggedIn)
  {
    for(var i = 0 ; i < pickupDates.length; i++)
    {
      // var element;
      // element = '<li> <a href="' + pickupDates[i].href + '"  class="liContent">';
      //   element += '<span class="name">' + pickupDates[i].place_string + '</span><br>';
      //   element += '<span class="time">' + pickupDates[i].time_string + '</span><br>';
      // element += "</a></li>"
      // if(i < messages.length - 1)
      //   element += "<br>";

      // totalString += element;

      var place;
      place = document.createElement("span");
      place.appendChild(document.createTextNode(pickupDates[i].place_string));
      place.className = "name";

      var time;
      time  = document.createElement("span");
      time.appendChild(document.createTextNode(pickupDates[i].time_string));
      time.className = "time";

      var newLinkItem = document.createElement("a");
      newLinkItem.href = pickupDates[i].href;
      newLinkItem.className = "liContent";
      newLinkItem.appendChild(place);
      newLinkItem.appendChild(time);
      newLinkItem.insertBefore(brElement.cloneNode(), time);
      newLinkItem.appendChild(brElement.cloneNode());

      var newPickupItem = document.createElement("li");
      newPickupItem.appendChild(newLinkItem);
      newPickupItem.appendChild(brElement.cloneNode());

      pickupDatesList.appendChild(newPickupItem); 
    }
  }
  else
    console.log("But panel is in logged-off mode and will ignore");
});

