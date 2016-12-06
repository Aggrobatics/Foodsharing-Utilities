const {XMLHttpRequest} = require("sdk/net/xhr");
var browserWindows = require("sdk/windows").browserWindows;
var privateBrowsing = require("sdk/private-browsing");

console.log("utils.js loaded");

// REQUESTS ____________________________________________________________________________

exports.makeDocRequest = function (url, onSuccess, onError) {
    var config = {};
    if (privateBrowsing.isPrivate(browserWindows.activeWindow))
        config.mozAnon = true;

    var httpRequest = new XMLHttpRequest(config);
    if (!httpRequest) {
        console.log("creation of httpRequest failed");
        return false;
    }
    // handle private browsing

    // ON SUCCESS
    httpRequest.onLoad = function () {
        console.log("onLoad. But that's not defined...");
        onLoad(this.responseXML);
    };
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if (httpRequest.status === 200) {
                // console.log("HttpRequest has returned as DONE");
                // document.documentElement
                // or document.body
                onSuccess(this.responseXML);
            }
            else {
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

exports.makeLoginPost = function (doc, email, pass) 
{
    // anonymous posting?!

    // console.log("makeLoginPost()");
    // console.log("doc: " + doc);
    // var form = doc.querySelector("#loginbar");
    // console.log("form: " + form);
    // var emailField = doc.body.getElementById("email");
    // console.log("emailField: " + emailField);
    // emailField.value = email;
    // var passField = doc.body.getElementById("password")
    // console.log("passField: " + passField);
    // passField.value = pass;

    // document = form;

    // var form = doc.createElement("form");
    // form.setAttribute("method", "post");
    // form.setAttribute("action", url);

    // var emailField = document.createElement("input");
    // emailField.setAttribute("type", "email");
    // emailField.setAttribute("name", "email_adress");
    // emailField.setAttribute("value", email);
    // form.appendChild(emailField);

    // var passField = document.createElement("input");
    // passField.setAttribute("type", "password");
    // passField.setAttribute("name", "password");
    // passField.setAttribute("value", pass);
    // form.appendChild(passField);

    // doc.body.appendChild(form);
    doc.submit();
};
// TESTING ____________________________________________________________________________

exports.checkLoginWithDom = function (document) {
    if (document.getElementById("loginbar")) {
        console.log("DOM check returned login failed!");
        return false;
    }
    else {
        console.log("DOM check returned login was succesfull!");
        return true;
    }
};

exports.extractTimeString = function (elementString) {
    i_timeStart = "Heute, ".length - 1;
    i_timeEnd = elementString.indexOf(" Uhr");
    time = elementString.substring(i_timeStart, i_timeEnd);
    return time;
};

exports.parseTime = parseT;


function parseT(timeString) {
    if (timeString == '') return null;

    var time = timeString.match(/(\d+)(:(\d\d))?\s*(p?)/i);
    if (time == null) return null;

    var hours = parseInt(time[1], 10);
    if (hours == 12 && !time[4]) {
        hours = 0;
    }
    else {
        hours += (hours < 12 && time[4]) ? 12 : 0;
    }
    var d = new Date();
    d.setHours(hours);
    d.setMinutes(parseInt(time[3], 10) || 0);
    d.setSeconds(0, 0);
    return d;
};

exports.translateToMinutesOfDay = translateToMinsOfDay;

function translateToMinsOfDay(date) {
    // console.log("utils.transl called");
    return (date.getHours() * 60) + date.getMinutes();
};



exports.remainingTime = remainingT;

function remainingT(timeDate) {
    // console.log("utils.remaining called");
    return translateToMinsOfDay(timeDate) - translateToMinsOfDay(new Date());
};

exports.createPickupObject = createPickupObj;

function createPickupObj(placeString, timeString) {
    // console.log("utils.create called");

    // cannot call parseT to fill property for some reason. crashes every time
    var obj = {
        place_string: placeString,
        time_string: timeString,
        date_formatted: parseT(timeString), // dateFormatted, //  
        minutes_remaining: function () {
            return remainingT(this.date_formatted);
        }
    };
    return obj;
};

exports.createMessageObject = createMsgObject;

function createMsgObject(title, msg, moment) {
    var obj = {
        name: title,
        message: msg,
        time: moment
    }
    return obj;
}