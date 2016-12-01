try
{


var data = require("sdk/self").data;
var utils = require("./data/utils");
var settings = require("sdk/simple-prefs").prefs;
// pickupIntervalTime
// msgIntervalTime
// notificationTime
// autoLogin


// Objects
var pickupHTMLElement;
var tabs = require("sdk/tabs");
var panel;
var notifications = require("sdk/notifications");


// Arrays
var foodsharingTabs = [];
var unreadMsgArray = [];

// Numbers
var msgIntervalID;
var blinkIntervalID;
var pickupIntervalID;
var failedLogins = 0;
var numberOfUpcomingDates = 0;

// Bools
var b_originalTabText;
var b_addonStart = true;
var b_loggedIn = false;
var b_passwordPresent = true;

// Test Switches
var b_useFakeData = true;

// Login data
var email;
var pass;
                                                                              // REMOVE THIS LATER ON!
if(b_useFakeData)
{
  b_passwordPresent = true;
  var email = "max.dusemund@trash-mail.com";
  var pass = "wegwerfpasswort";
  settings.msgIntervalTime = 0.2;
  settings.pickupIntervalTime = 0.5;
}

// Functions
var { setInterval, clearInterval, setTimeout } = require("sdk/timers");

// Strings
buttonActive = "#00AAAA";
buttonInactive = "#FFFFFF";
buttonAlert = "#AA0000";

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
    if(!tab.url.match("https://foodsharing.de*")) {
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

console.log("creating loginWorker");

loginWorker = require("sdk/page-worker").Page(
{
  contentScriptFile:  data.url("loginWorker.js"),
  contentURL: "https://foodsharing.de/",
  contentScriptWhen: "ready"
});


loginWorker.port.on("loginPerformed", function(value)
{
  b_loggedIn = value;
  if(value)
    handleNewLogin();
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
	badgeColor: buttonInactive,
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

panel.port.on("login", function(){
  console.log("received button click");
  getPasswordsForFsAndLogin();
});

panel.port.on("autoLoginChanged", function(autoLogin){
  console.log("auto login changed to: " + autoLogin);
  settings.autoLogin = autoLogin;
});

// FUNCTION IMPLEMENTATIONS ____________________________________________________________________________

function handleNewLogin()
{
  console.log("handleNewLogin()")

  if(!b_loggedIn)
  {
    console.log("something went pretty wrong here mate");
    return;
  }

  button.badgeColor = buttonActive;

  // START INTERVAL TIMERS

  // messages
  if(settings.msgIntervalTime > 0)
  {
    console.log("start msg interval");
    msgIntervalID = setInterval(function() 
    {
      // MESSAGES
      console.log("...sending msgPage request");
      requestMsgDocAndHandle();
    }, settings.msgIntervalTime * 60 * 1000);
  }

  // pickups
  if((settings.notificationTime > 0) && (settings.pickupIntervalTime > 0))
  {
    pickupIntervalID = setInterval(function() 
    {
      requestPickupDocAndHandle();
    }, settings.pickupIntervalTime * 60 * 1000);

    // requestPickupDocAndHandle();
  }

  // this distinction is necessary, as multiple notifications don't stack and might crash (known bug)
  notifications.notify({
    title: "foodsharing.de",
    text: "You are now logged in!",
    iconURL: data.url("gabel-64.png")
  });
}

function handleNewLogoff()
{
  console.log("handleNewLogoff");

  b_loggedIn = false;
  
  button.badgeColor = buttonInactive;
  button.badge.value = undefined;

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
  console.log("handle button change has been called");
  if(state.checked)
  {
    if(Boolean(b_loggedIn))
    {
      console.log("...sending pickupDates html request");
      utils.makeDocRequest("https://foodsharing.de/?page=dashboard", function(responseXML)
      {
        console.log("retrieved pickupDates. Updating variable");
        pickupHTMLElement = responseXML.body.querySelector("#right").innerHTML;  
        showPanel();
      });
    }
    else
    {
      pickupHTMLElement = "You are not logged in!";
      showPanel();
    }
  }
  else
  {
    panel.hide();
  }
}

function showPanel()
{
  panel.port.emit("fillPanel", pickupHTMLElement, unreadMsgArray, settings.autoLogin);
  panel.show({position: button});
}

function updateBadge(value)
{
  if(value > button.badge)
  {
    console.log("value is greater than badge-value. adjusting...")
    // unread messages have increased!
    button.badgeColor = buttonAlert;
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
      }, 1000);
    }
  }
  else if(value < button.badge)
  {
    console.log("value is smaller than button.bdage! adjusting...")
    button.badge = value;
    // unread messages have decreased (by user action) and...
    // blink interval is running
    button.badgeColor = buttonActive;
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
      requestMsgDocAndHandle();
    }, settings.msgIntervalTime * 60 * 1000);
};

function requestMsgDocAndHandle()
{
  utils.makeDocRequest("https://foodsharing.de/?page=msg", 
  function(responseXML) // Success Function
  {
      handleMsgDocReload(responseXML);
  },
  function() // Error Function
  {console.log("MsgDocRequest didn't work");});
}

function handleMsgDocReload(document)
{
  // console.log("handleMsgDocReload");
  if(document.getElementById("conversation-list"))
  {
    // console.log("Found conversation-list!");
    unreadMsgArray = document.getElementsByClassName("unread-1");
    updateBadge(unreadMsgArray.length);
  }
  else if(!utils.checkLoginWithDom(document))
  {
    console.log("loginbar found. Not logged in anymore");	
    if(b_loggedIn)
    {
      handleNewLogoff();
    }
    
    // requestLogin();
  }
  else
  {
    console.log("Something went terribly wrong. Found neither loginbar, nor badge!");
  }
}  

  function requestPickupDocAndHandle()
  {
    utils.makeDocRequest(data.url("htmlTempStorage.html"), 
    function(doc) // Success function
    {
      console.log("Received test html");
      handlePickupDocReload(doc);
    }, 
    function() // Error function
    {
      console.log("failed to open htmlTempStorage.html file");
    });
    return;
  }

  function handlePickupDocReload(doc)
  {
    var dates = doc.getElementsByClassName("ui-corner-all");

    if(dates.length > 0)
    {
        var pickupsText = "";
        // var index;
        numberOfUpcomingDates = 0;
        for(var i = 0; i < dates.length; i++)
        {
          var index = i+1; 
          var timeElement = doc.querySelector("#X > li:nth-child(" + index + ") > a:nth-child(1) > span:nth-child(1)");
          var placeElement = doc.querySelector("#X > li:nth-child(" + index + ") > a:nth-child(1) > span:nth-child(2)");
          // console.log(timeElement.innerHTML);
          // console.log(placeElement.innerHTML);

          // PARSE FOR TODAY's PICKUPS
          if(Boolean(timeElement.innerHTML.search("Heute")+1))
          {
            console.log("pickup at " + placeElement.innerHTML + " is today");
            var timeDate = parseTime(timeElement.innerHTML);
            // console.log("at " + timeDate + " o'clock"); 
            
            var remainingTime = (translateToMinutesOfDay(timeDate) - translateToMinutesOfDay(new Date()));
            if((remainingTime < settings.notificationTime) && (remainingTime > 0))
            {
              console.log("That is soon! NOTIFY!!!");
              numberOfUpcomingDates = numberOfUpcomingDates + 1;
              // pickupsText = pickupsText.concat("'" + placeElement.innerHTML + "' at " + extractTimeString(timeElement.innerHTML) + " o'clock; "); 
              pickupsText = pickupsText.concat("'" + placeElement.innerHTML + "' in " + remainingTime + " minutes;  "); 
            }
          }
        }

        if(numberOfUpcomingDates > 0)
        {
          var str = "You have " + numberOfUpcomingDates + " pickup(s) coming up soon: ";
          str = str + pickupsText;
          notifications.notify({
              title: "foodsharing.de",
              text: str,
              iconURL: data.url("gabel-64.png")
            });
          console.log(str);
        }
    }
    console.log("numberOfUpcomingDates ended up at " + numberOfUpcomingDates);
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
  var blinkText;
  
  if(!value)
    blinkText = "(" + messages + ") New Messages!";
  else if(messages > 0)
    blinkText = "(" + messages + ") Foodsharing | Restlos Gluecklich";
  else
    blinkText = "Foodsharing | Restlos Gluecklich";

  // console.log("changing tabs' titles to '" + blinkText + "'");

  for (i = 0; i < foodsharingTabs.length; i++) {
    foodsharingTabs[i].title = blinkText;
  } 
}

  // If you pass it a single property, only credentials matching that property are returned:
  function getPasswordsForFsAndLogin() 
  {
    console.log("getPasswordsForFsAndLogin()");
    if(b_passwordPresent)                                                                   // Only for debugging purposes more or lesss
    {
      console.log("b_passwordPresent = true. Sending login now");
      loginWorker.port.emit("login", email, pass);
      return;
    }
    else
    {
      require("sdk/passwords").search({
      url: "https://foodsharing.de",
      onComplete: function onComplete(credentials) {
        if(credentials.length > 0)
        {
          console.log("there are saved passwords!");
          b_passwordPresent = true;
          email = credentials[0].username;
          pass = credentials[0].password;

          loginWorker.port.emit("login", email, pass);
          return;
        }
        else
        {
          console.log("there are NO saved passwords!");
          notifications.notify({
            title: "foodsharing.de",
            text: "Cannot find login data! Please make sure you have stored your login data with Firefox to use the App's login function (Master Password is recommended!)",
            iconURL: data.url("gabel-64.png")
          });
          return;
        }
      }
      });
    }
  }

  function extractTimeString(elementString)
  {
      i_timeStart = "Heute, ".length-1;
      i_timeEnd = elementString.indexOf(" Uhr");
      time = elementString.substring(i_timeStart, i_timeEnd);
      return time;
  }

  function parseTime(timeString) 
  {    
    if (timeString == '') return null;

    var time = timeString.match(/(\d+)(:(\d\d))?\s*(p?)/i); 
    if (time == null) return null;

    var hours = parseInt(time[1],10);    
    if (hours == 12 && !time[4]) {
          hours = 0;
    }
    else {
        hours += (hours < 12 && time[4])? 12 : 0;
    }   
    var d = new Date();             
    d.setHours(hours);
    d.setMinutes(parseInt(time[3],10) || 0);
    d.setSeconds(0, 0);  
    return d;
  }

  function translateToMinutesOfDay(date)
  {
    return (date.getHours() * 60) + date.getMinutes();
  }

// ACTIONS ____________________________________________________________________________

  if(settings.autoLogin)
  {
    console.log("autoLogin = true");
    getPasswordsForFsAndLogin();
  }

// EXTRAS and DEBUGGING____________________________________________________________________________

}
catch (e)
{
  console.log("error code: ", e);
}