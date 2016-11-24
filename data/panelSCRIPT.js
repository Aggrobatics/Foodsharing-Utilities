// When the user hits return, send the "text-entered"
// message to main.js.
// The message payload is the contents of the edit box.
// var textArea = document.getElementById("edit-box");
// textArea.addEventListener('keyup', function onkeyup(event) {
//   if (event.keyCode == 13) {
//     // Remove the newline.
//     text = textArea.value.replace(/(\r\n|\n|\r)/gm,"");
//     self.port.emit("text-entered", text);
//     textArea.value = '';
//   }
// }, false);
// // Listen for the "show" event being sent from the
// // main add-on code. It means that the panel's about
// // to be shown.

// // Set the focus to the text area so the user can
// // just start typing.
self.port.on("fillPanel", function(pickupDates, messages) {
  console.log("panel received show-command");
  document.getElementById("pickupDates").innerHTML = pickupDates; // pickupDates;
  var tmp;
  for(var i = 0 ; i < messages.length; i++)
  {
    tmp += messages[i].outerHTML;
  }
  console.log("there you go: " + tmp);
  document.getElementById("messages").innerHTML = tmp;
});

// allegedly there is no self.port.on - functionality!?
// addon.port.on("show", function(pickupDates) {
//     console.log("received show-command via ADDON.port");
//     document.getElementById("pickupDates").innerHTML ="Hello World";// pickupDates;
// });