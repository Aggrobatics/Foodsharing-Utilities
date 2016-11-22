try
{

var data = require("sdk/self").data;
var utils = require("./data/utils");
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


// utils.makeRequest("http://foodsharing.de", function(responseXML)
utils.makeRequest("http://semantic-ui.com/examples/responsive.html", function(responseXML)
{
  console.log("onSuccess func in index.js has been called");
  console.log(this.responseXML.body.textContent);

  // console.log(responseXML); // .querySelector(".msg > a:nth-child(1) > span:nth-child(2)").innerHTML);
},
function(){console.log("shit. request didnt work");});



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


// MESSAGES WORKER  ____________________________________________________________________________

    console.log("setting createMsgWorker"); //-function");

    // msgWorkerButton.on("click", createMsgWorker);

    // function createMsgWorker()
    // {

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
        console.log("msgWorker has requested login");
        requestLogin();
      });

      // reloading page has returned a value
      msgWorker.port.on("updateBadge", function(value)
      {
        console.log("updateBadge-event received");
        if(value > button.badge)
        {
          // unread messages have increased!
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
          // unread messages have decreased (by user action) and...
          // blink interval is running
          stopBlinkInterval();
        }
        console.log("adjusting badge now");
        button.badge = value;
      });

      // msgWorker should be ready for ticks. Bring it on!
      function startMsgUpdateInterval()
      {
          console.log("starting interval timer now");
          msgIntervalID = setInterval(function() 
          {
            // MESSAGES
            console.log("trying to reload messageWorker's page by...");

            var useURL = true;
            // testing purposes
            if(useURL)
            {
              console.log("...resetting URL");
              msgWorker.contentURL = "https://foodsharing.de/?page=bcard";
            }
            // this part does not work as msgWorker throws domExceptions
            // when trying to work with the new text
            else
            {
              console.log("...sending request");
              var httpRequest = RequestClass({
              url: "https://foodsharing.de/?page=bcard",
              onComplete: function (response) {
                msgWorker.port.emit("update", response.text);
              }
              });
              console.log("sending out request now");
              httpRequest.get();
            }
          }, 5000)
      };

      // START INTERVAL TIMERS
      startMsgUpdateInterval();
      
    // }

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
  loggedIn = false;
  loginWorker.port.emit("login", "max.dusemund@trash-mail.com", "wegwerfpasswort");
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
  panel.port.emit("fillPanel", pickupHTMLElement);
  panel.show({position: button});
}

  loginWorker.port.emit("login", "markus.schmieder@gmx.de", "Joe5023234");
  // tabs.open("https://foodsharing.de");
}
catch (e)
{
  console.log("error code: ", e);
}

