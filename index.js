
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


// Objects
var data = require("sdk/self").data;
var utils = require("./data/utils");
var tabs = require("sdk/tabs");
var panel;
var loginWorker;
var notifications = require("sdk/notifications");
var settings = require("sdk/simple-prefs").prefs;

// SETTING NAMES:

// pickupIntervalTime
// msgIntervalTime
// notificationTime
// autoLogin
// playSounds
// soundFileNr

// Arrays
var foodsharingTabs = [];
var unreadMsgArray = [];
var pickupsArrayAll = [];

// Numbers
var msgIntervalID;
var blinkIntervalID;
var pickupIntervalID;
var checkLoginIntervalID;
var failedLoginTimerID = 0;
var failedLogins = 0;
var numberOfUpcomingDates = 0;

// Login data
var email;
var pass;

// Functions
var { setInterval, clearInterval, setTimeout, clearTimeout } = require("sdk/timers");

// Strings
var buttonActiveColor = "#00AAAA";
var buttonInactiveColor = "#FFFFFF";
var buttonAlertColor = "#AA0000";
var pickupURL = "https://foodsharing.de/?page=dashboard";
var messageURL = "https://foodsharing.de/?page=msg";
var msgSoundURL = data.url(utils.getSoundFileName(settings.soundFileNr));


// Bools
var b_originalTabText = true;
var b_requestInstantOnLogin = true;
var b_loggedIn = false;
var b_passwordPresent = false;
var b_readyForNextNotify = true;

// PREFERENCES ____________________________________________________________________________

require("sdk/simple-prefs").on("soundFileNr", function(prefName) 
{
  console.log("soundFileNr has changed!");
  msgSoundURL = data.url(utils.getSoundFileName(settings.soundFileNr));
  playMsgSound();
});

require("sdk/simple-prefs").on("msgIntervalTime", function(prefName) 
{
  var output = "msgIntervalTime has changed. ";
  if(b_loggedIn)
  {
    output += "Restarting Interval";
    clearInterval(msgIntervalID);
    msgIntervalID = setInterval(function() 
    {
      requestMsgDocAndHandle();
    }, settings.msgIntervalTime * 60 * 1000);
  }
  else
    output += "But not logged in. No change necessary";
  
  console.log(output);
});

require("sdk/simple-prefs").on("pickupIntervalTime", function(prefName) 
{
  var output = "pickupIntervalTime has changed. ";
  if(b_loggedIn)
  {
    output += "Restarting Interval";
    clearInterval(pickupIntervalID);
    pickupIntervalID = setInterval(function() 
    {
      requestPickupDocAndHandle();
    }, settings.pickupIntervalTime * 60 * 1000);
  }
  else
    output += "But not logged in. No change necessary";

  console.log(output);
});


// TABS         ____________________________________________________________________________

tabs.on("close", function(tab)
{
  console.log("tab has been closed");
  var index = foodsharingTabs.indexOf(tab);
  if ((b_loggedIn) && (Boolean(index+1)))
  {
    foodsharingTabs.splice(index, 1);
    console.log("foodsharingTab closed. Array: " + foodsharingTabs);
  }
});

tabs.on('ready', function(tab) 
{
  if(tab.url == "about:blank") {
    console.log("CRASHED");
  }
  // returns -1 if element is not in Array
  var index = foodsharingTabs.indexOf(tab);

  // tab is in array (0 equals to false)
  if (Boolean(index+1)) {
    // ...and does not match website anymore
    if(!tab.url.match("https://foodsharing*")) {
      // remove tab
      foodsharingTabs.splice( index, 1 );
      console.log("New tabArray after remove: " + foodsharingTabs);
    }
  }
  // tab is not in array
  else {
    // ...and matches website
    if (tab.url.match("https://foodsharing.de*")) {
      // add tab
      foodsharingTabs.push(tab);
      console.log("New tabArray after add: " + foodsharingTabs);
    }
  }

  if(tab.url.match("https://foodsharing.de*"))
  {
    // on website. Check for a change in login-status
    var loginChecker;
    
    // html-event-listener is declared above
    loginChecker = tab.attach({
      contentScript: 'self.port.emit("html", !Boolean(document.getElementById("loginbar")));'
    });

    // need to attach listener before attaching script to tab, since it will be executed immediately!
    loginChecker.port.on("html", function(b_value)
    {
      console.log("Login Status: " + b_value);
      if((b_loggedIn) && (!b_value))
      {
        b_loggedIn = false;
        handleNewLogoff();
      }
      else if((!b_loggedIn) && (b_value))
      {
        b_loggedIn = true;
        handleNewLogin();
      }
    });
  }

  tabs.on("activate", function(tab)
  {
    console.log("tab has become active");

    var index = foodsharingTabs.indexOf(tab);

    if (Boolean(index+1))
    {
      console.log("...and is in the array");
      // tab is in array
      stopBlinkInterval();
    }
  });

});

// LOGIN WORKER AND IMPLICATIONS ____________________________________________________________________________

loginWorker = require("sdk/page-worker").Page(
{
  contentScriptFile:  data.url("loginWorker.js"),
  contentURL: "https://foodsharing.de/",
  contentScriptWhen: "ready"
});

loginWorker.port.on("loginPerformed", function(value)
{
  var str = "received message from loginWorker";
  if(b_loggedIn == Boolean(value))
  {
    str += ". But login-status is up-to-date";
    return;
  }
  else
    str += ". Login-status has changed. Handling...";
  console.log("received message from loginWorker");

  switch(value) 
  {
    case 1:
      if((value == 1) && (!b_loggedIn))
      {
        console.log("login succesfull");
        b_loggedIn = value;
        handleNewLogin();
      }
      break;
    case 0:
      console.log("loginWorker says login was not succesfull!");
      b_loggedIn = false;
      handleNewLogoff();
      break;
    case -1:
      console.log("loginWorker requests loginCheck");
      checkLoginRepeatedly();
      break;
    default:
      console.log("loginWorker is trolling");
  } 

});

// TOGGLE BUTTON ____________________________________________________________________________

// console.log("creating ToggleButton");

var button = require("sdk/ui/button/toggle").ToggleButton({
  id: "show-panel",
  label: "Show Panel",
  icon: {
    "16": "./gabel-16.png",
    "32": "./gabel-32.png",
    "64": "./gabel-64.png"
  },
	badge: 0,
	badgeColor: buttonInactiveColor,
  onClick: handleButtonChange
});


// PANEL    ____________________________________________________________________________

// console.log("creating panel");

var panel = require("sdk/panel").Panel({
contentURL: data.url("panelHTML.html"),
contentScriptFile: data.url("panelSCRIPT.js"),
onHide : function()
  {
      button.state('window', {checked: false});
  }
});
panel.resize(750, 500);

panel.port.on("login", function(){
  console.log("received button click");
  getPasswordsForFsAndLogin();
});

panel.port.on("openTab", function(address)
{
  tabs.open(address);
});

// does not work, as checkbox does not fire any events!
panel.port.on("autoLoginChanged", function(autoLogin){
  console.log("auto login changed to: " + autoLogin);
  settings.autoLogin = autoLogin;
});

panel.port.on("open", function(link)
{
  console.log("received request from panel to open " + link);
});



// FUNCTION IMPLEMENTATIONS ____________________________________________________________________________

function handleNewLogin()
{
  console.log("handleNewLogin()")

  if(failedLoginTimerID)
  {
     clearTimeout(failedLoginTimerID);
     console.log("cleared failedLoginTimerID");
  }

  panel.port.emit("showLoggedIn");

  // UI
  button.badgeColor = buttonActiveColor;
  
  
  // START INTERVAL TIMERS

  // messages
  if(settings.msgIntervalTime > 0)
  {
    console.log("start msg interval at " + settings.msgIntervalTime + " minutes");
    msgIntervalID = setInterval(function() 
    {
      requestMsgDocAndHandle();
    }, settings.msgIntervalTime * 60 * 1000);
    if(b_requestInstantOnLogin)
      requestMsgDocAndHandle();
  }

  // pickups
  if((settings.notificationTime > 0) && (settings.pickupIntervalTime > 0))
  {
    console.log("start pickup interval at " + settings.pickupIntervalTime + " minutes");
    pickupIntervalID = setInterval(function() 
    {
      requestPickupDocAndHandle();
    }, settings.pickupIntervalTime * 60 * 1000);
    if(b_requestInstantOnLogin)
      requestPickupDocAndHandle();
  }
  console.log("trigger login-notification");
  showNotification("You are now logged in!");

  console.log("end of handleNewLogin()");
}

function handleNewLogoff()
{
  console.log("handleNewLogoff");

  if(b_loggedIn == true)
  {
    console.log("SOMETHING WENT TERRIBLY WRONG MATE");
  }
  b_loggedIn = false;
  
  // refresh loginWorker, so it sees current page and can login
  // refreshing contentURL did NOT work!!!
  // reconstructing loginWorker did not work!!!
  // lost all port-connection to loginWorker either way
  // last resort: have loginWorker click the dashboard-button
  console.log("informing loginWorker to refresh");
  loginWorker.port.emit("refresh");


  // UI
  button.badgeColor = buttonInactiveColor;
  button.badge.value = undefined;
  panel.port.emit("showLoggedOff");
  // STOP INTERVAL TIMERS

  clearInterval(msgIntervalID);
  msgIntervalID = 0;

  clearInterval(pickupIntervalID);
  pickupIntervalID = 0;

  stopBlinkInterval();
}

// Show the panel when the user clicks the button.
function handleButtonChange(state) 
{    
  // console.log("handle button change has been called");
  if(state.checked)
  {
    if(Boolean(b_loggedIn))
    {
      console.log("...sending all requests");
      requestMsgDocAndHandle();
      requestPickupDocAndHandle();
    }
    showPanel();
  }
  else
  {
    panel.hide();
  }
}

function showPanel()
{
  panel.show({position: button});
}

function updateBadge(value)
{
  if(value > button.badge)
  {
    console.log("value is greater than badge-value. adjusting...")
    
    // unread messages have increased!
    button.badgeColor = buttonAlertColor;
    button.badge = value;
    
    // handle blinking
    if((foodsharingTabs.length > 0) && (!blinkIntervalID) && (value >0))
    {
      // there are open tabs that can blink and...
      // blinkInterval is not yet running
      stopBlinkInterval();
      console.log("starting blink interval");
      blinkIntervalID = setInterval(function() 
      {
        b_originalTabText = !b_originalTabText;
        switchTabsTitles(b_originalTabText, value);
      }, 2000);
    }

    if(settings.playSounds)
      playMsgSound();
  }
  else if(value < button.badge)
  {
    console.log("value is smaller than button.bdage! adjusting...")
    button.badge = value;
    // unread messages have decreased (by user action) and...
    // blink interval is running
    button.badgeColor = buttonActiveColor;
    stopBlinkInterval();
  }
}

function startMsgUpdateInterval()
{
    console.log("starting msg Interval now");
    msgIntervalID = setInterval(function() 
    {
      // MESSAGES
      console.log("...sending msgPage request");
      cconsole.log("messageURL: " + messageURL);
      requestMsgDocAndHandle();
    }, settings.msgIntervalTime * 60 * 1000);
};

function requestMsgDocAndHandle()
{
    utils.makeDocRequest(messageURL, 
    function(doc) // Success function
    {
      handleMsgDocReload(doc);
      return;
    }, 
    function() // Error function
    {
      console.log("failed to get " + messageURL);
    });
    return;
}

function handleMsgDocReload(doc)
{
  console.log("handleMsgDocReload()");

  var convList = doc.querySelectorAll(".unread-1");
  if(Boolean(convList))
  {
    unreadMsgArray = [];
    var msgListLength = convList.length;
    console.log("there are " + msgListLength + " unread messages");
    for(var i = 0; i < msgListLength; i++)
    {
      var name = convList[i].querySelector(".names").innerHTML;
      var msg = convList[i].querySelector(".msg").innerHTML;
      var time = convList[i].querySelector(".time").innerHTML;

      var msgObject = utils.MessageObject(name, msg, time);
      unreadMsgArray.push(msgObject);
      // console.log(msgObject);
    }
    panel.port.emit("updateMsg", unreadMsgArray);
    // console.log("before badge");
    updateBadge(msgListLength);
    // console.log("after badge");
    return;
  }
  else if(!utils.checkLoginWithDom(doc))
  {
    console.log("loginbar found. Not logged in anymore");	
    if(b_loggedIn)
    {
      b_loggedIn = false;
      handleNewLogoff();
    }
  }
  else
  {
    console.log("Something went terribly wrong. Found neither loginbar, nor badge!");
  }
}  

function requestPickupDocAndHandle()
{
  utils.makeDocRequest(pickupURL, 
  function(doc) // Success function
  {
      handlePickupDocReload(doc);
  }, 
  function() // Error function
  {
    console.log("failed to get " + pickupURL);
  });
  return;
}

function handlePickupDocReload(doc)
{
  console.log("handlePickupDocReload()");
  pickupsArrayAll = [];

  var dates = doc.querySelector(".datelist").querySelectorAll(".ui-corner-all");
  console.log("there are " + dates.length + " pickups registered. Notify me " + settings.notificationTime + " minutes in advance!");

  if(dates.length > 0)
  {
      var pickupsText = "";
      numberOfUpcomingDates = 0;

      dates.forEach(function(item)
      {
        var pageLink = item.href.slice(item.href.indexOf("/?page="), item.href.length) || "";
        pageLink = "https://foodsharing.de" + pageLink;
        // console.log("href: " + pageLink);
        var timeElement = item.querySelector("span:nth-child(1)");
        var placeElement = item.querySelector("span:nth-child(2)");
        // console.log("Place: " + placeElement.innerHTML);
        // console.log("Time: " + timeElement.innerHTML);



        var pickupObject = utils.PickupObject(placeElement.innerHTML, timeElement.innerHTML, pageLink);
        console.log(pickupObject);
        pickupsArrayAll.push(pickupObject);

        // CHECK FOR TODAY's PICKUPS
        if(Boolean(timeElement.innerHTML.search("Heute")+1))
        {
          console.log("pickup at " + placeElement.innerHTML + " is today");

          var remainingTime = pickupObject.minutes_remaining();
          console.log(remainingTime + " minutes remaining");

          if((remainingTime < settings.notificationTime) && (remainingTime > 0))
          {
            console.log("That is soon! NOTIFY!!!");
            numberOfUpcomingDates = numberOfUpcomingDates + 1;
            pickupsText = pickupsText.concat("'" + placeElement.innerHTML + "' in " + remainingTime + " minutes;  "); 
          }
        }
      });


      console.log("number of upcoming pickups: " + numberOfUpcomingDates);
      if(numberOfUpcomingDates > 0)
      {
        console.log("trying to notify about upcoming pickups");
        var str = "You have " + numberOfUpcomingDates + " pickup(s) coming up soon: ";
        str = str + pickupsText;
        showNotification(str);
      }
      panel.port.emit("updatePickups", pickupsArrayAll);

  }
  return numberOfUpcomingDates;
}


function stopBlinkInterval()
{
  if(Boolean(blinkIntervalID))
  {
    // interval is running, so stop it now
    console.log("stopping blinkInterval now");
    clearInterval(blinkIntervalID);
    blinkIntervalID = 0;
    b_originalTabText = true;
    switchTabsTitles(b_originalTabText, button.badge);
  }
}

function switchTabsTitles(value, messages)
{
  var tabTitle;
  
  if(!value)
    tabTitle = "(" + messages + ") New Messages!";
  else if(messages > 0)
    tabTitle = "(" + messages + ") Foodsharing | Restlos Gluecklich";
  else // value == true
    tabTitle = "Foodsharing | Restlos Gluecklich";

  // console.log("changing tabs' titles to '" + blinkText + "'");

  for (i = 0; i < foodsharingTabs.length; i++) {
    foodsharingTabs[i].title = tabTitle;
  } 
}

function getPasswordsForFsAndLogin() 
{
  // console.log("getPasswordsForFsAndLogin()");

    require("sdk/passwords").search({
    url: "https://foodsharing.de",
    onComplete: function onComplete(credentials) {
      if(credentials.length > 0)
      {
        console.log("there are saved passwords!");
        b_passwordPresent = true;
        email = credentials[0].username;
        pass = credentials[0].password;

        sendLoginRequest();

        failedLoginTimerID = setTimeout(function()
        {
          console.log("It seems the login functionality does not work here");
          showNotification("It seems the login-function does not work on your system. I am very sorry for that!");
        }, 5000); 
        return;
      }
      else
      {
        console.log("there are NO saved passwords!");
        showNotification("Could not find login data! Please make sure you have stored your login data with Firefox (Master Password is recommended!), or deactivate auto-login under settings");
        return;
      }
    }
    });
}

function sendLoginRequest()
{
  if(b_passwordPresent)
  {
      loginWorker.port.emit("login", email, pass);
  }
  else
  {
    console.log("Cannot send login-request without email and password!");
  }
}

function checkLoginRepeatedly()
{
  var numberOfChecks = 0;
  checkLoginIntervalID = setInterval(function() 
  {
    numberOfChecks += 1;
    console.log("loginCheck tick. Attempt: " + numberOfChecks);
    if(numberOfChecks <= 5)
    {
      utils.makeDocRequest("https://foodsharing.de", function(doc)
      {
          console.log("requesting page for loginCheck");
          console.log("loginbar index: " + doc.getElementById("loginbar").outerHTML);
          if(utils.checkLoginWithDom(doc))
          {
            console.log("checkLoginWithDom() returned true");
            clearInterval(checkLoginIntervalID);
            b_loggedIn = true;
            handleNewLogin();
          }
          else
          {
            console.log("Checked site. still not logged in!");
          }
      },
      function()
      {
        console.log("Request to " + loginURL + " for loginCheck failed");
      });
    }
    else
    {
      console.log("giving up on checking");
      showNotification("It seems the login-function does not work on your system. I am very sorry for that!");
      clearInterval(checkLoginIntervalID);
      b_loggedIn = false;
    }
  }, 2000);
}


function playMsgSound()
{
  console.log("playSound("+ msgSoundURL + ")");

  var window = utils.currentWindow();

  // console.log("Got the window: " + window);
  const {XMLHttpRequest} = require("sdk/net/xhr");
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var source = audioCtx.createBufferSource();
  var request = new XMLHttpRequest();

  request.open('GET', msgSoundURL, true);

  request.responseType = 'arraybuffer';


  request.onload = function() {
    var audioData = request.response;

    audioCtx.decodeAudioData(audioData, 
      function(buffer) 
      {
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.loop = false;
      },
      function(e)
      {
        "Error with decoding audio data" + e.err;
      });
  }

  request.send();
  source.start(0);      
}

function showNotification(text)
{
  console.log("showNotification()");
  if(text)
  {
    if(b_readyForNextNotify)
    {
      b_readyForNextNotify = false;
      console.log("showing notification");
      notifications.notify({
        title: "foodsharing.de",
        text: text,
        iconURL: data.url("gabel-64.png")
      });
      setTimeout(function()
      {
        console.log("Timeout done. Notify-System is open again");
        b_readyForNextNotify = true;
      }, 3000); 
    }
    else
      console.log("notification system blocked! Notify is rejected");
  }
  else
    console.log("Sorry dawg! No text, no notification!");
}

// ACTIONS ____________________________________________________________________________

if(settings.autoLogin)
{
  console.log("autoLogin = true");
  getPasswordsForFsAndLogin();
}