
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
var brPrototype = document.createElement("br");
var centerPrototype = document.createElement("center");
var iPrototype = document.createElement("i");
var bPrototype = document.createElement("b");
var subPrototype = document.createElement("sub");

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
  statusDiv.accessKey
  
  clearInnerHTML(statusDiv);
  var iElement = iPrototype.cloneNode();
  iElement.textContent = "You are now logged in!";
  var centerElement = centerPrototype.cloneNode();
  centerElement.appendChild(iElement);
  statusDiv.appendChild(centerElement);

  button.innerHTML = "";
  button.className = "openTab";
  button.onclick = function(){self.port.emit("openTab", "https://foodsharing.de")};
});

self.port.on("showLoggedOff", function()
{
  // Since this behaviour has to execute on startup, we need an internally callable method
  // (check last line of the script)
  showLoggedOff();
});

self.port.on("updateMsg", function(messages)
{
  console.log("panel received message update");
  
  console.log("First child: " + messagesList.firstChild);
  
  // Flush list
  clearInnerHTML(messagesList);

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
      newLinkItem.insertBefore(brPrototype.cloneNode(), time);
      newLinkItem.insertBefore(brPrototype.cloneNode(), message);
      newLinkItem.appendChild(brPrototype.cloneNode());

      var newMessageItem = document.createElement("li");
      newMessageItem.appendChild(newLinkItem);
      newMessageItem.appendChild(brPrototype.cloneNode());

      messagesList.appendChild(newMessageItem); 
    } 
  }
  else
    console.log("But panel is in logged-off mode and will ignore");
});

self.port.on("updatePickups", function(pickupDates)
{
  console.log("panel received pickup update");

  clearInnerHTML(pickupDatesList);
  
  if(loggedIn)
  {
    for(var i = 0 ; i < pickupDates.length; i++)
    {

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
      newLinkItem.insertBefore(brPrototype.cloneNode(), time);
      newLinkItem.appendChild(brPrototype.cloneNode());

      var newPickupItem = document.createElement("li");
      newPickupItem.appendChild(newLinkItem);
      newPickupItem.appendChild(brPrototype.cloneNode());

      pickupDatesList.appendChild(newPickupItem); 
    }
  }
  else
    console.log("But panel is in logged-off mode and will ignore");
});

function clearInnerHTML(element)
{
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function showLoggedOff()
{
  console.log("panel received logoff-info");
  loggedIn = false;

  clearInnerHTML(messagesList);
  clearInnerHTML(pickupDatesList);
  clearInnerHTML(statusDiv);
  var bElement = bPrototype.cloneNode();
  var brElement = brPrototype.cloneNode();
  var subElement = subPrototype.cloneNode();
  var centerElement = centerPrototype.cloneNode();

  bElement.textContent = "You are currently logged off";
  subElement.textContent = "There is nothing to see here";

  centerElement.appendChild(bElement);
  centerElement.appendChild(brElement);
  centerElement.appendChild(subElement);
  statusDiv.appendChild(centerElement);

  button.textContent = "Login";
  button.className = "";
  button.onclick = function(){self.port.emit("login");};
}

showLoggedOff();