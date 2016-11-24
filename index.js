// If you pass it a single property, only credentials matching that property are returned:

// function show_passwords_for_joe() {
//   require("sdk/passwords").search({
//     url: "http://foodsharing.de",
//     onComplete: function onComplete(credentials) {
//       credentials.forEach(function(credential) {
//         console.log(credential.username);
//         console.log(credential.password);
//         });
//       }
//     });
//   }


// To retrieve only credentials associated with your add-on, use the url property, initialized from self.uri:

// function show_my_addon_passwords() {
//   require("sdk/passwords").search({
//     url: require("sdk/self").uri,
//     onComplete: function onComplete(credentials) {
//       credentials.forEach(function(credential) {
//         console.log(credential.username);
//         console.log(credential.password);
//         });
//       }
//     });
//   }




try
{

var data = require("sdk/self").data;
var utils = require("./data/utils");

// Objects
var pickupHTMLElement;
var tabs = require("sdk/tabs");
var panel;

// Arrays
var foodsharingTabs = [];
var unreadMsgArray = [];

// Numbers
var msgIntervalID;
var blinkIntervalID;
var failedLogins = 0;

// Bools
var b_originalTabText;
var b_addonStart = true;
var b_loggedIn = false;

// Test Switches
var b_useMsgWorker = false;
var b_usePickupWorker = false;
var b_useFakeLogin = true;

// Login data
if(b_useFakeLogin)
{
  var email = "max.dusemund@trash-mail.com";
  var pass = "wegwerfpasswort";
}
else
{
  var email = "markus.schmieder@gmx.de";
  var pass = "Joe5023234";
}

// Functions
var { setInterval, clearInterval, setTimeout } = require("sdk/timers");


// TABS         ____________________________________________________________________________

tabs.on("close", function(tab)
{
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
  else if (b_loggedIn) {
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
  }
  else if(tab.url.match("https://foodsharing.de*"))
  {
    // not logged in and on website. Check for a change in login-status
    var loginChecker;
    
    // html-event-listener is declared above
    loginChecker = tab.attach({
      contentScript: 'self.port.emit("html", !Boolean(document.getElementById("loginbar")));'
    });

    // need to attach listener before attaching script to tab, since it will be executed immediately!
    loginChecker.port.on("html", function(b_value)
    {
      console.log("received message from login checker");
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

// MSGButton     ____________________________________________________________________________

// console.log("creating msgWorkerButton");

var { ActionButton } = require("sdk/ui/button/action");
    var msgWorkerButton = ActionButton({
      id: "create-message-worker",
      icon: {
        "16": "./icon-16.png",
        "32": "./icon-32.png",
        "64": "./icon-64.png"
      },
      label: "Create Message Worker (no interval)",
      badgeColor: "#00AAAA",
    });

// LOGIN WORKER AND IMPLICATIONS ____________________________________________________________________________

// loginWorker.port.emit("login", email, pass);

// console.log("creating loginWorker");

loginWorker = require("sdk/page-worker").Page(
{
  contentScriptFile:  data.url("loginWorker.js"),
  contentURL: "https://www.foodsharing.de",
  contentScriptWhen: "end"
});

loginWorker.port.on("loginPerformed", function(value)
{
  b_loggedIn = value;

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
	badgeColor: "#00AAAA",
  disabled: true,
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

// FUNCTION IMPLEMENTATIONS ____________________________________________________________________________

function handleNewLogin()
{
  if(!b_loggedIn)
    return;

  console.log("handleNewLogin");

  // the firefox addon API does not support close() on notifications
  var notifications = require("sdk/notifications");
  notifications.notify({
    title: "foodsharing.de",
    text: "You are now logged in!",
    iconURL: data.url("gabel-64.png")
  });

  console.log("enabling button again");
  button.disabled = false;
  button.badgeColor = "#000000";

  // START INTERVAL TIMERS
  startMsgUpdateInterval();
}

function handleNewLogoff()
{
  console.log("handleNewLogoff");


  b_loggedIn = false;
  
  clearInterval(msgIntervalID);
  msgIntervalID = 0;

  button.badgeColor = "#FFFFFF";
  button.badge.value = undefined;
  button.disabled = true;

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
      console.log("...sending pickupDates request");
      utils.makeDocRequest("https://foodsharing.de/?page=dashboard", function(responseXML)
      {
        console.log("retrieved pickupDates. Updating variable");
        pickupHTMLElement = responseXML.body.querySelector("#right").innerHTML;  
        showPanel();
      });
    }
    else
    {
      console.log("hold on a minute");
      loginWorker.port.emit("login");
    }
  }
  else
  {
    panel.hide();
  }
}

function showPanel()
{
  panel.port.emit("fillPanel", pickupHTMLElement, unreadMsgArray);
  panel.show({position: button});
}

function updateBadge(value)
  {
    if(value > button.badge)
    {
      console.log("value is greater than badge-value. adjusting...")
      // unread messages have increased!
      button.badgeColor = "#AA0000";
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
        }, 3000)
      }
    }
    else if(value < button.badge)
    {
      console.log("value is smaller than button.bdage! adjusting...")
      button.badge = value;
      // unread messages have decreased (by user action) and...
      // blink interval is running
      button.badgeColor = "#00AAAA";
      stopBlinkInterval();
    }
  }

  // msgWorker should be ready for ticks. Bring it on!
  function startMsgUpdateInterval()
  {
      console.log("starting interval timer now");
      msgIntervalID = setInterval(function() 
      {
        // MESSAGES
        console.log("...sending msgPage request");
          utils.makeDocRequest("https://foodsharing.de/?page=msg", function(responseXML)
          {
              handleMsgDocReload(responseXML);
          },
          function(){console.log("shit. request didnt work");});
      }, 5000);
  };

  function handleMsgDocReload(document)
  {
    if(document.getElementById("conversation-list"))
    {
      // console.log("Found conversation-list!");
      unreadMsgArray = document.getElementsByClassName("unread-1");
      console.log("You have " + unreadMsgArray.length + " unread Messages");
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

  console.log("changing tabs' titles to '" + blinkText + "'");

  for (i = 0; i < foodsharingTabs.length; i++) {
    foodsharingTabs[i].title = blinkText;
  } 
}


  tabs.open("https://foodsharing.de");
  // loginWorker.port.emit("login", email, pass);
}
catch (e)
{
  console.log("error code: ", e);
}

