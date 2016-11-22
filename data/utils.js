const {XMLHttpRequest} = require("sdk/net/xhr");
var browserWindows = require("sdk/windows").browserWindows;
var privateBrowsing = require("sdk/private-browsing");

// REQUESTS ____________________________________________________________________________

exports.makeRequest = function(url, onSuccess, onError) 
{
    var httpRequest = new XMLHttpRequest(); 
    if (!httpRequest) {
      console.log("creation of httpRequest failed");
      return false;
    }
    // handle private browsing
    var config = {};
     if(privateBrowsing.isPrivate(browserWindows.activeWindow))
        cfg.mozAnon = true;

    // ON SUCCESS
    httpRequest.onLoad = function() 
    {
        console.log("onLoad"); 
        onLoad(this.responseXML); 
    };
    httpRequest.onreadystatechange = function() 
    {    
        console.log("onReadyStateChange");
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if (httpRequest.status === 200) 
            {
                console.log("HttpRequest has returned as DONE");
                // document.documentElement
                // or document.body
                onSuccess(this.responseXML); 
            }
            else
            {
                console.log("there was a problem with the response.status");
            }
        }
    };

    // ON ERROR
    httpRequest.onError = onError;

    httpRequest.open('GET', url);
    httpRequest.responseType = "document";
    httpRequest.send();
};

// TESTING ____________________________________________________________________________

  exports.testFunction = function(text)
{
    console.log("utils function has been called with text: " + text);
}