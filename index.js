
// component returned failure code: 0x80520012 <NS_ERROR_FILE_NOT_FOUND> [nsIWebNavigation.loadURI]

try
{

var data = require("sdk/self").data;
var loggedIn = 0;
var pickupHTMLElement;
var tabs = require("sdk/tabs");
var panel;
var foodsharingTabs = [];
var msgIntervalID;
var blinkIntervalID;
var b_originalTabText;
var b_addonStart = true;
var { setInterval, clearInterval, setTimeout } = require("sdk/timers");

// REQUEST

// console.log("sending sample request now");
// var Request = require("sdk/request").Request;
// var httpRequest = Request({
//   url: "https://www.google.de/?gws_rd=ssl",
//   onComplete: function (response) {
//     console.log("request completed. Here's the html: " + response.text);
//     httpRequest.get();
//   }
// });
// httpRequest.get();


// TABS         ____________________________________________________________________________

// tabs.open("foodsharing.de");

// called every time a tab loads and is ready
// prints the new url in console

tabs.on("close", function(tab)
{
  var index = foodsharingTabs.indexOf(tab);
  if ((loggedIn) && (Boolean(index+1)))
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
  else if (loggedIn) {
    // returns -1 if element is not in Array
    var index = foodsharingTabs.indexOf(tab);

    // tab is in array (0 equals to false)
    if (Boolean(index+1)) {
      console.log("tab is in array at index " + index);
      // ...and does not match website anymore
      if(!tab.url.match("https://foodsharing.de*")) {
        console.log("and does not match pattern");
        // remove tab
        foodsharingTabs.splice( index, 1 );
        console.log("New tabArray after remove: " + foodsharingTabs);
      }
      else {
        console.log("and still matches pattern");
      }
    }
    // tab is not in array
    else {
      console.log("tab is not in array");
      // ...and matches website
      if (tab.url.match("https://foodsharing.de*")) {
        console.log("and matches website");
        // add tab
        foodsharingTabs.push(tab);
        console.log("New tabArray after add: " + foodsharingTabs);
      }
      else
        console.log("and does not belong there");
    }
  }
});

function switchTabsTitles(value)
{
  var blinkText;
  
  if(value)
    blinkText = "(" + value + ") New Messages!";
  else
    blinkText = "Foodsharing | Restlos Gluecklich";

  for (i = 0; i < foodsharingTabs.length; i++) {
    foodsharingTabs[i].title = blinkText;
  } 
}

// MSGButton     ____________________________________________________________________________

console.log("creating msgWorkerButton");

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

// loginWorker.port.emit("login", "markus.schmieder@gmx.de", "Joe5023234");

console.log("creating loginWorker");

loginWorker = require("sdk/page-worker").Page(
{
  contentScriptFile:  data.url("loginWorker.js"),
  contentURL: "https://www.foodsharing.de",
  contentScriptWhen: "end"
});

loginWorker.port.on("loginPerformed", function(value)
{
  loggedIn = value;

  if(Boolean(loggedIn))
  {
    console.log("login was successful. Attaching page-workers now");

    var notifications = require("sdk/notifications");
    notifications.notify({
      title: "foodsharing.de",
      text: "You are now logged in!",
      iconURL: data.url("gabel-64.png")
    });

    /*
    * the firefox addon API does not support close() on notifications
    */

// PICKUP WORKER ____________________________________________________________________________

    console.log("creating pickupWorker");

    // retrieves pickup-dates chart from website
    pickupWorker = require("sdk/page-worker").Page(
    {
    // contentScriptFile: data.url("pickupDatesWorker.js"),
    contentScript: 'console.log("pickupWorker is updating"); self.port.emit("gotLatestPickupDates", document.querySelector("#right").innerHTML);',
    contentURL: "https://foodsharing.de/?page=dashboard",
    contentScriptWhen: "end",
    });

    pickupWorker.port.on("gotLatestPickupDates", function(element)
    {
      console.log("retrieved pickupDates. Updating variable");
      pickupHTMLElement = element;

      console.log("trying to show panel now");
      showPanel();
    });


// MESSAGES WORKER  ____________________________________________________________________________

    console.log("setting createMsgWorker-function");

    msgWorkerButton.on("click", createMsgWorker);

    function createMsgWorker()
    {

      console.log("creating message worker now");

      //loads an invisible page in the background
      msgWorker = require("sdk/page-worker").Page(
      {
        contentScriptFile: data.url("messageWorker.js"),
        contentURL: "https://foodsharing.de/",
        contentScriptWhen: "end",
      });

      // not logged in (anymore?!)
      msgWorker.port.on("requestLogin", function()
      {
        console.log("msgWorker has requested login-command. But we should be logged in. Please handle!");
      });

      // reloading page has returned a value
      msgWorker.port.on("updateBadge", function(value)
      {
        if(value > button.badge)
        {
          // unread messages have increased!
          // handle blinking
          if((foodsharingTabs.length > 0) && (!blinkIntervalID))
          {
            // there are open tabs that can blink and...
            // blinkInterval is not yet running
            blinkIntervalID = setInterval(function() 
            {
              b_originalTabText != b_originalTabText;   
              switchTabsTitles(b_originalTabText);
            }, 2000)
          }
        }
        else if(blinkIntervalID)
        {
          // unread messages have decreased (by user action) and...
          // blink interval is running
          clearInterval(blinkIntervalID);
          blinkIntervalID = 0;
          b_originalTabText = true;
          switchTabsTitles(b_originalTabText);
        }
        console.log("received new value. updating button");
        button.badge = value;
      });

      // msgWorker should be ready for ticks. Bring it on!
      function startMsgUpdateInterval()
      {
          console.log("starting interval timer now");
          msgIntervalID = setInterval(function() 
          {
            // MESSAGES
            console.log("trying to reload messageWorker's page");
            msgWorker.contentURL = "https://foodsharing.de/?page=bcard";
          }, 10000)
      };

      // START INTERVAL TIMERS
      startMsgUpdateInterval();
      


    }
  }
});

// LOGIN BUTTON ____________________________________________________________________________

console.log("creating login button");

var { ActionButton } = require("sdk/ui/button/action");
var loginButton = ActionButton({
  id: "Login",
  icon: {
    "16": "./MS-16.png",
    "32": "./MS-32.png",
    "64": "./Ms-64.png"
  },
  label: "LOGIN",
  badgeColor: "#00AAAA",
   onClick: requestLogin
});

function requestLogin()
{
  loginWorker.port.emit("login", "markus.schmieder@gmx.de", "Joe5023234");
}

// TOGGLE BUTTON ____________________________________________________________________________

console.log("creating ToggleButton");

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
  onClick: handleChange
});


// Show the panel when the user clicks the button.
function handleChange(state) 
{
  console.log("handle button change has been called");
  if(state.checked)
  {
    if(Boolean(loggedIn))
    {
      console.log("trying to update pickupWorker by ...");

      var recreate = false;
      if(recreate)
      {
        console.log("...reconstruction");
        pickupWorker.destroy();
        pickupWorker = require("sdk/page-worker").Page(
        {
          // contentScriptFile: data.url("pickupDatesWorker.js"),
          contentScript: 'console.log("pickupWorker is updating"); self.port.emit("gotLatestPickupDates", document.querySelector("#right").innerHTML);',
          contentURL: "https://foodsharing.de/?page=dashboard",
          contentScriptWhen: "end"
        });
      }
      else
      {
        console.log("...reloading");
        pickupWorker.contentURL = "https://foodsharing.de/?page=dashboard";
      }      
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

// PANEL    ____________________________________________________________________________

console.log("creating panel");

var panel = require("sdk/panel").Panel({
contentURL: data.url("panelHTML.html"),
contentScriptFile: data.url("panelSCRIPT.js"),
onHide : function()
  {
      button.state('window', {checked: false});
  }
});

function showPanel()
{
  panel.port.emit("show", pickupHTMLElement);
  panel.show({position: button});
}

  loginWorker.port.emit("login", "markus.schmieder@gmx.de", "Joe5023234");
}
catch (e)
{
  console.log("error code: ", e);
}

