// MESSAGES WORKER  ____________________________________________________________________________

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
msgWorker.port.on("updateBadge", function(value) {updateBadge(value)});

function startMsgUpdateInterval()
{
    console.log("starting interval timer now");
    msgIntervalID = setInterval(function() 
    {
        // MESSAGES
        console.log("trying to reload messageWorker's page by...");

        console.log("...resetting URL");
        msgWorker.contentURL = "https://foodsharing.de/?page=bcard";
    });
};

// LOGIN BUTTON ____________________________________________________________________________

// console.log("creating login button");

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
  b_loggedIn = false;
  loginWorker.port.emit("login", email, "wegwerfpasswort");
}


// PICKUP WORKER ____________________________________________________________________________

    // console.log("creating pickupWorker");

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

function handleChange(state) 
{
  console.log("handle button change has been called");
  if(state.checked)
  {
    if(Boolean(b_loggedIn))
    {
      console.log("trying to update pickupWorker by ...");

      if(b_usePickupWorker)
      {
        console.log("...reloading");
        pickupWorker.contentURL = "https://foodsharing.de/?page=dashboard";
      }
      else
      {
        console.log("...sending request");
        utils.makeDocRequest("https://foodsharing.de/?page=dashboard", function(responseXML)
        {
          console.log("retrieved pickupDates. Updating variable");
          pickupHTMLElement = responseXML.body.querySelector("#right").innerHTML;  
          showPanel();
        })
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