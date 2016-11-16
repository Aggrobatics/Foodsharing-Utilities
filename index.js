// component returned failure code: 0x80520012 <NS_ERROR_FILE_NOT_FOUND> [nsIWebNavigation.loadURI]

try
{

var data = require("sdk/self").data;
var loggedIn = 0;
var pickupHTMLElement;
var tabs = require("sdk/tabs");
var panel;

// TABS         ____________________________________________________________________________

// tabs.open("foodsharing.de");

// called every time a tab loads and is ready
// prints the new url in console
tabs.on("ready", logURL);
function logURL(tab) 
{
  if(tab.url == "about:blank")
  {
    console.log("CRASHED");
  }
  else
  {
    console.log(tab.url);
  }
}

// TIMER        ____________________________________________________________________________

var { setInterval } = require("sdk/timers");
var intervalID;

// MSGButton     ____________________________________________________________________________

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

// PICKUP WORKER ____________________________________________________________________________

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

    console.log("pickupWorker created");


// MESSAGES WORKER  ____________________________________________________________________________

    console.log("setting createMsgWorker-function");

    msgWorkerButton.on("click", createMsgWorker);

    function createMsgWorker()
    {
      //loads an invisible page in the background
      msgWorker = require("sdk/page-worker").Page(
      {
        contentScriptFile: data.url("workerContentSCRIPT.js"),
        contentURL: "https://foodsharing.de/",
        contentScriptWhen: "end",
        // onMessage: handleWorkerMessage
      });

      // not logged in (anymore?!)
      msgWorker.port.on("requestLogin", function()
      {
        console.log("msgWorker has requested login-command. But we should be logged in. Please handle!");
      });

      // msgWorker should be ready ticks. Bring it on!
      function startMsgUpdateInterval()
      {
          console.log("starting interval timer now");
          intervalID = setInterval(function() 
          {
            console.log("reloading messageWorker's page");
            msgWorker.contentURL = "https://foodsharing.de/?page=bcard";
          }, 16000)
      };

      // reloading page has returned a value
      msgWorker.port.on("updateBadge", function(value)
      {
        console.log("received new value. updating button");
        button.badge = value;
      });

      console.log("creating message worker now");

      // START INTERVAL TIMERS
      // startMsgUpdateInterval();
    }
  }
});

// LOGIN BUTTON ____________________________________________________________________________

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

      var recreate = true;
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
        console.log("reloading");
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

var panel = require("sdk/panel").Panel({
contentURL: data.url("panelHTML.html"),
contentScriptFile: data.url("panelSCRIPT.js"),
onHide : function()
  {
      button.state('window', {checked: false});
  }
});

panel.on("show", function() {
  panel.port.emit("show", pickupHTMLElement);
});

function showPanel()
{
  panel.show({position: button});
}

// PAGE MOD     ____________________________________________________________________________


// looks for pages that match the pattern and attaches a content script to them
// cannot attach anything to pageMod, as it is only created when page is opened...it's just sad

// var pageMod = require("sdk/page-mod");
// pageMod.PageMod({
//   include: "https://foodsharing.de*",
//   contentScriptWhen: "start",
//   contentScriptFile: data.url("modContentSCRIPT.js"),
//   attachTo: ["existing", "top", "frame"],
//   onAttach: function (worker) 
//   {
//       console.log("pageMod has started");
//       worker.port.on('foodsharingLoaded', function(text)
//       {
//           console.log('message from pageMod: ' + text);
//       });
//   }
// });

// XML HTTP Request ____________________________________________________________________________

// function startXmlHttpRequest(url) {
//   var httpRequest;

//   httpRequest = new XMLHttpRequest();

//   if (!httpRequest) {
//     alert('Giving up :( Cannot create an XMLHTTP instance');
//     return false;
//   }
//   httpRequest.onreadystatechange = alertContents;
//   httpRequest.open('GET', url);
//   httpRequest.send();

//   function alertContents() {
//     if (httpRequest.readyState === XMLHttpRequest.DONE) {
//       if (httpRequest.status === 200) {
//         alert(httpRequest.responseText);
//       } else {
//         alert('There was a problem with the request.');
//       }
//     }
//   }
// }

// startXmlHttpRequest("https://foodsharing.de/");
}
catch (e)
{
  console.log("error code: ", e);
}

