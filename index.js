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

// // LOGIN WORKER ____________________________________________________________________________

// loginWorker = require("sdk/page-worker").Page(
// {
//   contentScriptFile: data.url("workerLoginSCRIPT.js"),
//   contentURL: "https://foodsharing.de/",
//   contentScriptWhen: "end",
// });

// loginWorker.port.on("loginPerformed", function()
// {
//   loginWorker.
// });

// PAGE WORKER  ____________________________________________________________________________

// loads an invisible page in the background
pageWorker = require("sdk/page-worker").Page(
{
  contentScriptFile: data.url("workerContentSCRIPT.js"),
  contentURL: "https://foodsharing.de/",
  contentScriptWhen: "ready",
  // onMessage: handleWorkerMessage
});

pageWorker.port.on("requestLogin", function()
{
  console.log("pageWorker has requested login-command. sending request now");
  pageWorker.port.emit("login", "markus.schmieder@gmx.de", "Joe5023234");
});

pageWorker.port.on("updateBadge", function(value)
{
  console.log("received new value. updating badge");
  button.badge = value;
  pageWorker.port.emit("refreshPage");
});

pageWorker.port.on("startInterval", function startInterval()
{
    console.log("starting interval timer now");
    intervalID = setInterval(function() 
    {
      console.log("prompting pageWorker for refresh");
      pageWorker.port.emit("refreshPage");
      pageWorker.postMessage("refreshPageMessage");
    }, 4000)
});

// PAGE MOD     ____________________________________________________________________________


// looks for pages that match the pattern and attaches a content script to them
// cannot attach anything to pageMod, as it is only created when page is opened...it's just sad

var pageMod = require("sdk/page-mod");
pageMod.PageMod({
  include: "https://foodsharing.de*",
  //include: "https://foodsharing.de/?page=*",
  contentScriptWhen: "start",
  contentScriptFile: data.url("modContentSCRIPT.js"),
  attachTo: ["existing", "top", "frame"],
  onAttach: function (worker) 
  {
      console.log("pageMod has started");
      worker.port.on('foodsharingLoaded', function(text)
      {
          console.log('message from pageMod: ' + text);
      });
  }
});

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


// Show the panel when the user clicks the button.
function handleChange(state) {
  if(state.checked)
  {
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
  contentURL: data.url("panelHTML.html"),
  contentScriptFile: data.url("panelSCRIPT.js"),
  onHide : handleHide
});

// send "show" event to the panel's script
panel.on("show", function() {
  panel.port.emit("show");
});

// Listen for messages called "text-entered" coming from
// the content script.
panel.port.on("text-entered", function (text) {
  console.log(text);
  panel.hide();
});


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