
/* ***** BEGIN LICENSE BLOCK *****
 
 * Author: Markus Schmieder (Aggrobatics)
 
 * This file is part of The Firefox Foodsharing-Utilities Addon.
 
 * The Firefox Foodsharing-Utilities Addon is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 
 * The Firefox Foodsharing-Utilities Addon is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 
 * You should have received a copy of the GNU General Public License
 * along with The Firefox Foodsharing-Utilities Addon.  If not, see http://www.gnu.org/licenses/.
 
 * ***** END LICENSE BLOCK ***** */

const {XMLHttpRequest} = require("sdk/net/xhr");
var browserWindows = require("sdk/windows").browserWindows;
var privateBrowsing = require("sdk/private-browsing");
var dateHelper = require("./dateHelper");

console.log("utils.js loaded");

// REQUESTS ____________________________________________________________________________

exports.makeDocRequest = function (url, onSuccess, onError) {
    var config = {};

    // handle private browsing
    if (privateBrowsing.isPrivate(browserWindows.activeWindow))
        config.mozAnon = true;

    var httpRequest = new XMLHttpRequest(config);
    if (!httpRequest) {
        console.log("creation of httpRequest failed");
        return false;
    }

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

// DOES NOT WORK :-(

// exports.makeLoginPost = function (doc, email, pass) 
// {
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
//     doc.submit();
// };

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

exports.PickupObject = function(placeString, timeString, pageLink) {
    console.log("utils.createSimplePickupObj()");

    // cannot call parseT to fill property for some reason. crashes every time
    var obj = {
        place_string: placeString,
        time_string: timeString,
        href: pageLink,
        date_formatted: dateHelper.parseTime(timeString), // dateFormatted, //  
        minutes_remaining: function () {
            return dateHelper.remainingTime(this.date_formatted);
        }
    };
    return obj;
};


exports.MessageObject = function(title, msg, moment) {
    var obj = {
        name: title,
        message: msg,
        time: moment
    }
    return obj;
}

exports.getSoundFileName = function(value)
{
    console.log("getSoundFileName(" + value +")");
    switch(value) 
    {
    case 0:
        return "Apple.wav";
    case 1:
        return "Carrot.wav";
    case 2:
        return "Celery.wav";
    case 3:
        return "Chips.wav";
    case 4:
        return "Cracker.wav";
    case 5:
        return "Nut.wav";
    default:
        console.log("could not find match for value: " + value);
    }
};


exports.currentWindow = function()
{
    return require('sdk/window/utils').getMostRecentBrowserWindow();
}

