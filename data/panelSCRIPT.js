document.getElementById("loginButton").onclick = function(){
  console.log("registered button click");
  self.port.emit("login");
};

var autoLoginCheckbox = document.getElementById("autoLogin");
console.log("autoLoginCheckbox: " + autoLoginCheckbox);
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




self.port.on("fillPanel", function(pickupDates, messages, b_autoLogin) {
  console.log("panel received show-command");
  document.getElementById("pickupDates").innerHTML = pickupDates;
  autoLoginCheckbox.checked = b_autoLogin;
  var tmp;
  for(var i = 0 ; i < messages.length; i++)
  {
    tmp += messages[i].outerHTML;
  }
  console.log("there you go: " + tmp);
  document.getElementById("messages").innerHTML = tmp;
});