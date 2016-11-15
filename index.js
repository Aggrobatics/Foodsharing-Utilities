// component returned failure code: 0x80520012 <NS_ERROR_FILE_NOT_FOUND> [nsIWebNavigation.loadURI]

var data = require("sdk/self").data;

// TABS         ____________________________________________________________________________

var tabs = require("sdk/tabs");
// tabs.open("foodsharing.de");

// called every time a tab loads and is ready
// prints the new url in console
require("sdk/tabs").on("ready", logURL);
function logURL(tab) 
{
  console.log(tab.url);
}

// TIMER        ____________________________________________________________________________

var { setInterval } = require("sdk/timers");
var intervalID;

// MESSAGES WORKER  ____________________________________________________________________________

// button to create pageWorker (debugging purposes)
// Create a button


var { ActionButton } = require("sdk/ui/button/action");
var workerButton = ActionButton({
  id: "start-login",
  icon: {
    "16": "./icon-16.png",
    "32": "./icon-32.png",
    "64": "./icon-64.png"
  },
  label: "Start Login",
	badgeColor: "#00AAAA",
  onClick: createMsgWorker
});

function createMsgWorker()
{
  //loads an invisible page in the background
  pageWorker = require("sdk/page-worker").Page(
  {
    contentScriptFile: data.url("workerContentSCRIPT.js"),
    contentURL: "https://foodsharing.de/",
    contentScriptWhen: "end",
    // onMessage: handleWorkerMessage
  });

  pageWorker.port.on("requestLogin", function()
  {
    console.log("pageWorker has requested login-command. sending request now");
    // pageWorker.contentScriptWhen = "ready";
    pageWorker.port.emit("login", "markus.schmieder@gmx.de", "Joe5023234");
  });

  pageWorker.port.on("updateBadge", function(value)
  {
    console.log("received new value. updating button");
    // button.badge = value;
  });

  pageWorker.port.on("startInterval", function startInterval()
  {
      console.log("starting interval timer now");
      intervalID = setInterval(function() 
      {
        console.log("prompting pageWorker for refresh");
        pageWorker.port.emit("refreshPage");
        // pageWorker.contentURL = "https://foodsharing.de/?page=bcard";
        // pageWorker.postMessage("refreshPageMessage");
      }, 16000)
  });

}

// TOGGLE BUTTON ____________________________________________________________________________

// Create a button
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

var pickupHTMLElement;

// Show the panel when the user clicks the button.
function handleChange(state) {
  if(state.checked)
  {

    // reload page in worker and update pickupHTMLElement in return
    console.log("updating pickupWorker");
    pickupWorker.contentURL = "https://foodsharing.de/?page=dashboard";

    // show panel and pass calender info
    console.log("showing panel now");
	  panel.show({position: button});
  }
  else
  {
	  panel.hide();
  }
  // some extra stuff
  tabs.open("https://foodsharing.de");
}

function handleHide()
{
	button.state('window', {checked: false});
}


// PANEL    ____________________________________________________________________________

// Construct a panel and loading the script into it.
var panel = require("sdk/panel").Panel({
  contentURL: data.url("panelHTML"),
  contentScriptFile: data.url("panelSCRIPT.js"),
  onHide : handleHide
});

// send "show" event to the panel's script
panel.on("show", function() {
  panel.port.emit("show", pickupHTMLElement);
});

// Listen for messages called "text-entered" coming from
// the content script.
panel.port.on("text-entered", function (text) {
  console.log(text);
  panel.hide();
});

// PICKUP DATES WORKER ____________________________________________________________________________

  loginWorker = require("sdk/page-worker").Page(
    {
      contentScriptFile:  data.url("workerLoginSCRIPT.js"),
      contentURL: "https://www.foodsharing.de",
      contentScriptWhen: "end"
    }
  );

  loginWorker.port.on("loginPerformed", function()
  {
        // loads an invisible page in the background
          // retrieves pickup dates dom-content from website
          pickupWorker = require("sdk/page-worker").Page(
          {
            // contentScriptFile: data.url("pickupDatesWorker.js"),
            contentScript: 'console.log("pickupWorker is updating"); self.port.emit("pickupDates", document.querySelector("#right > div:nth-child(1)"));',
            contentURL: "https://foodsharing.de/?page=dashboard",
            contentScriptWhen: "end",
          });

        pickupWorker.port.on("pickupDates", function(element)
        {
          console.log("retrieved pickupDates. Updating variable for later use");
          pickupHTMLElement = element;
        });
  });


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