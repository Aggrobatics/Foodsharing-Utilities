require("sdk/tabs").on("ready", runScript); // not sure if needed

// called every time a tab loads and is ready
// prints the new url in console
require("sdk/tabs").on("ready", logURL);
 function logURL(tab) {
  console.log(tab.url);
}


// Construct a panel and loading the script into it.
var data = require("sdk/self").data;
var panel = require("sdk/panel").Panel({
  contentURL: data.url("panelHTML.html"),
  contentScriptFile: data.url("panelSCRIPT.js"),
  onHide : handleHide
});

// Create a button
var button = require("sdk/ui/button/toggle").ToggleButton({
  id: "show-panel",
  label: "Show Panel",
  icon: {
    "16": "./gabel-16.png",
    "32": "./gabel-32.png",
    "64": "./gabel-64.png"
  },
  onClick: handleChange
});

// Show the panel when the user clicks the button.
function handleChange(state) {
  // tabs.open("www.mozilla.org");
  if(state.checked)
  {
	  panel.show({position: button});
  }
  else
  {
	  panel.hide();
  }
}

function handleHide()
{
	button.state('window', {checked: false});
}


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
