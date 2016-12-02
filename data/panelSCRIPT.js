var button = document.getElementById("loginButton");
var pickupDatesColumn = document.getElementById("pickupDates");
var messagesColumn = document.getElementById("messages");
var statusDiv = document.getElementById("status");



self.port.on("showLoggedIn", function(/* pickupDates, messages */) {
  console.log("panel received login-info");
  statusDiv.innerHTML = "<center><i>You are now logged in!</i><center>";

  button.innerHTML = "Open Foodsharing";
  button.onclick = function(){self.port.emit("openFsTab")};
});

self.port.on("showLoggedOff", function()
{
  console.log("panel received logoff-info");
  messagesColumn.innerHTML = "";
  pickupDatesColumn.innerHTML = "";
  statusDiv.innerHTML = "<center><b>You are currently not logged in</b><br><sub>There is nothing to see here</sub><center>";

  button.innerHTML = "Login Now!";
  button.onclick = function(){self.port.emit("login");};
});

self.port.on("updateMsg", function(messages)
{
  console.log("panel received message update");
  // console.log(messages);
});

self.port.on("updatePickups", function(pickupDates)
{
    console.log("panel received pickup update");
    // console.log(pickupDates);
    // pickupDatesColumn.innerHTML = 
});


// DOES NOT WORK! ______________________________________________________________
/*
 
// this used to be in the panelHTML.html
var autoLoginCheckbox = document.getElementById("autoLogin");

autoLoginCheckbox.onChange = function(){
  console.log("registered checkbox onChange");
  // self.port.emit("autoLoginChanged", autoLoginCheckbox.checked);
};

autoLoginCheckbox.onClick = function(){
  console.log("registered checkbox onClick");
  // self.port.emit("autoLoginChanged", autoLoginCheckbox.checked);
}; 

autoLoginCheckbox.change = function(){
  console.log("registered checkbox change");
  // self.port.emit("autoLoginChanged", autoLoginCheckbox.checked);
};

autoLoginCheckbox.click = function(){
  console.log("registered checkbox click");
  // self.port.emit("autoLoginChanged", autoLoginCheckbox.checked);
};

*/