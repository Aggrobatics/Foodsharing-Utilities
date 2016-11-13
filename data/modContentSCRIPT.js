// document.body.innerHTML = "	<button type="button" onclick="">Click Me!</button>" + document.body.innerHTML;

//var badgeValue = document.getElementById("infobar").getElementByClassName("fa fa-comments").getElementByClassName("badge").value;

console.log("Hello, pagemod here");

self.port.emit('foodsharingLoaded', "login successful. We are at foodsharing.de/?page= ... can watch badge now!");

self.port.on("test", function(payload)
{
    console.log("test successful");
});




// var Request = require("sdk/request").Request;
// var latestTweetRequest = Request({
//   url: "https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=mozhacks&count=1",
//   onComplete: function (response) {
//     var tweet = response.json[0];
//     console.log("User: " + tweet.user.screen_name);
//     console.log("Tweet: " + tweet.text);
//   }
// });

// // Be a good consumer and check for rate limiting before doing more.
// Request({
//   url: "https://api.twitter.com/1.1/application/rate_limit_status.json",
//   onComplete: function (response) {
//     if (response.json.remaining_hits) {
//       latestTweetRequest.get();
//     } else {
//       console.log("You have been rate limited!");
//     }
//   }
// }).get();