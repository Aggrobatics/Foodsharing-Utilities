try
{

var data = require("sdk/self").data;
var utils = require("./data/utils");
var settings = require("sdk/simple-prefs").prefs;
// pickupIntervalTime
// msgIntervalTime
// notificationTime
// autoLogin
// playSounds
// soundFileNr

require("sdk/simple-prefs").on("soundFileNr", onSoundPrefChange)
function onSoundPrefChange(prefName) 
{
  console.log("The preference " + 
              prefName + 
              " value has changed!");
  switch (prefName)
  {
    case "soundFileNr":
      console.log("And it was the sound file!");
      msgSoundURL = data.url(utils.getSoundFileName(settings.soundFileNr));
      playMsgSound();
      break;
    case "msgIntervalTime":
      console.log("And it was msgIntervalTime. Restarting Interval");
      clearInterval(msgIntervalID);
      msgIntervalID = setInterval(function() 
      {
        requestMsgDocAndHandle();
      }, settings.msgIntervalTime * 60 * 1000);
      break;
    case "pickupIntervalTime":
      console.log("And it was pickupIntervalTime. Restarting Interval");
      clearInterval(pickupIntervalID);
      pickupIntervalID = setInterval(function() 
      {
        requestPickupDocAndHandle();
      }, settings.pickupIntervalTime * 60 * 1000);
      break;
  }
}



// Objects
var tabs = require("sdk/tabs");
var panel;
var notifications = require("sdk/notifications");


// Arrays
var foodsharingTabs = [];
var unreadMsgArray = [];
var pickupsTodayArray = [];

// Numbers
var msgIntervalID;
var blinkIntervalID;
var pickupIntervalID;
var checkLoginIntervalID;
var failedLogins = 0;
var numberOfUpcomingDates = 0;

// Login data
var email;
var pass;

// Functions
var { setInterval, clearInterval, setTimeout } = require("sdk/timers");

// Strings
var buttonActive = "#00AAAA";
var buttonInactive = "#FFFFFF";
var buttonAlert = "#AA0000";
var pickupURL;
var messageURL;
var msgSoundURL = data.url(utils.getSoundFileName(settings.soundFileNr));
console.log("msgSoundURL: " + msgSoundURL);
var loginURL = "/?page=login&amp;ref=%2F%3Fpage%3Ddashboard";

// Bools
var b_originalTabText = true;
var b_requestInstantOnLogin = true;
var b_loggedIn = false;
var b_passwordPresent = true;
var b_readyForNextNotify = true;

// Test Settings
var b_useFakeData = true;
var b_useLoginRequest = false;
var b_useFakeLogin = true;
var b_useFakePickupDates = true;
var b_useFakeMessages = false;
                                                                        // REMOVE THIS LATER ON!
if(b_useFakeData)
{
  settings.msgIntervalTime = 1;
  settings.pickupIntervalTime = 1;
  
  if(b_useFakeLogin)
  {
    b_passwordPresent = true;
    var email = "max.dusemund@trash-mail.com";
    var pass = "wegwerfpasswort";
  }
  else
  {
    b_passwordPresent = true;
    var email = "markus.schmieder@gmx.de";
    var pass = "Joe5023234";
  }
}

if(b_useFakePickupDates)
{
  pickupURL = data.url("fakePickupsHTML.html");
}
else
{
  pickupURL = "https://foodsharing.de/?page=dashboard";
}

if(b_useFakeMessages)
{
  messageURL = data.url("fakeMsgHTML.html");
}
else
{
  messageURL = "https://foodsharing.de/?page=msg";
}

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

// console.log("creating loginWorker");

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
panel.resize(770, 500);

panel.port.on("login", function(){
  console.log("received button click");
  getPasswordsForFsAndLogin();
});

panel.port.on("openFsTab", function()
{
  tabs.open("https://foodsharing.de");
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

  if(!b_loggedIn)
  {
    console.log("something went pretty wrong here mate");
    return;
  }
  panel.port.emit("showLoggedIn");
  // UI
  button.badgeColor = buttonActive;
  
  
  // foodsharingTabs.forEach(function(tab)
  // {
  //   tab.reload();
  // });

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
  console.log("request login-notification");
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
  console.log("informing loginWorker to refresh");
  loginWorker.port.emit("refresh");


  // UI
  button.badgeColor = buttonInactive;
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

      console.log("show panel now");
      showPanel();
    }
    else
    {
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
  // if(b_loggedIn)
  //   panel.port.emit("showLoggedIn", pickupHTMLElement, unreadMsgArray);
  // else
  //   panel.port.emit("showLoggedOff");
  
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
      console.log("failed to open fakeMsgHTML.html file");
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
    msgListLength = convList.length;
    console.log("there are " + msgListLength + " unread messages");
    for(var i = 0; i < msgListLength; i++)
    {
      var name = convList[i].querySelector(".names").innerHTML;
      var msg = convList[i].querySelector(".msg").innerHTML;
      var time = convList[i].querySelector(".time").innerHTML;

      var msgObject = utils.createMessageObject(name, msg, time);
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
      console.log("failed to open htmlTempStorage.html file");
    });
    return;
  }

  function handlePickupDocReload(doc)
  {
    console.log("handlePickupDocReload()");
    pickupsTodayArray = [];

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
          console.log("href: " + pageLink);
          var timeElement = item.querySelector("span:nth-child(1)");
          var placeElement = item.querySelector("span:nth-child(2)");
          // console.log("Place: " + placeElement.innerHTML);
          // console.log("Time: " + timeElement.innerHTML);

          // CHECK FOR TODAY's PICKUPS
          if(Boolean(timeElement.innerHTML.search("Heute")+1))
          {
            console.log("pickup at " + placeElement.innerHTML + " is today");
            var timeDate = utils.parseTime(timeElement.innerHTML);
            // console.log("at " + timeDate + " o'clock"); 
            // console.log("at " + utils.extractTimeString(timeElement.innerHTML) + " o'clock");
   
            var pickupObject = utils.createPickupObject(placeElement.innerHTML, timeElement.innerHTML, pageLink);
            pickupsTodayArray.push(pickupObject);
            // console.log(pickupObject);

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
        console.log("check pickupArray.length: " + numberOfUpcomingDates);
        if(numberOfUpcomingDates > 0)
        {
          console.log("trying to notify about upcoming pickups");
          var str = "You have " + numberOfUpcomingDates + " pickup(s) coming up soon: ";
          str = str + pickupsText;
          showNotification(str);
          // console.log(str);
        }
        panel.port.emit("updatePickups", pickupsTodayArray);

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
    // console.log("getPasswordsForFsAndLogin()");
    if(b_passwordPresent)                                                                   // Only for debugging purposes more or lesss
    {
      console.log("b_passwordPresent = true. Sending login now");
      sendLoginRequest();
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

          sendLoginRequest();
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
  }

  function sendLoginRequest()
  {
    if(b_passwordPresent)
    {
      if(b_useLoginRequest)
      {
        console.log("sending login POST");
        utils.makeDocRequest(data.url("submitForm.html"), 
        function(submitForm) // OnSuccess
        {
          console.log("Got submitForm.html! Passing to makeLoginPost() now");
          // submit loginData using submitForm.html
          utils.makeLoginPost(submitForm, email, pass);

          console.log("starting loginCheck Interval");
          // And start checking (repeatedly) for login....
          checkLoginIntervalID = setInterval(function() 
          {
            console.log("loginCheck tick");
            utils.makeDocRequest("loginURL", function(doc)
            {
                console.log("requesting page for loginCheck");
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
          }, 2000);
        },
        function()  // onError
        {
          console.log("could not open submitForm.html");
        });
      }
      else
      {
        loginWorker.port.emit("login", email, pass);
      }
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
    // var AudioContext = window.AudioContext || window.webkitAudioContext;
    // console.log("AudioContext : " + AudioContext);
    const {XMLHttpRequest} = require("sdk/net/xhr");
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var source = audioCtx.createBufferSource();
    var request = new XMLHttpRequest();

    request.open('GET', msgSoundURL, true);

    request.responseType = 'arraybuffer';


    request.onload = function() {
      var audioData = request.response;

      audioCtx.decodeAudioData(audioData, function(buffer) {
          source.buffer = buffer;

          source.connect(audioCtx.destination);
          source.loop = false;
        },

        function(e){"Error with decoding audio data" + e.err});

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

// EXTRAS and DEBUGGING____________________________________________________________________________

  // var window;
  // if (window === null || typeof window !== "object") 
  // {
  //     window = require('sdk/window/utils').getMostRecentBrowserWindow();
  // }
  // console.log("Got the window: " + window);
  // var AudioContext = window.AudioContext || window.webkitAudioContext;
  // console.log("AudioContext : " + AudioContext);
  // const {XMLHttpRequest} = require("sdk/net/xhr");
  // var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // var source;

  // function getData(filePath) 
  // {
  //   source = audioCtx.createBufferSource();
  //   var request = new XMLHttpRequest();

  //   request.open('GET', filePath, true);

  //   request.responseType = 'arraybuffer';


  //   request.onload = function() {
  //     var audioData = request.response;

  //     audioCtx.decodeAudioData(audioData, function(buffer) {
  //         source.buffer = buffer;

  //         source.connect(audioCtx.destination);
  //         source.loop = false;
  //       },

  //       function(e){"Error with decoding audio data" + e.err});

  //   }

  //   request.send();
  // }

  // function playMsgSound()
  // {
  //   console.log("playSound("+ msgSoundURL + ")");
  //     // var intervalID = window.setInterval(function()
  //     // {
  //       // getData(filePath);
  //       getData(msgSoundURL);
  //       source.start(0);  
  //     // }, 5000);
      
  // }

}
catch (e)
{
  console.log("error code: ", e);
}