
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

console.log("dateHelper.js loaded");

exports.parseTime = function(timeString) {

    // Is automatically filled with current system-time
    var date = new Date();

    // if date is not today, adjust. Else: leave as is
    if(!Boolean(timeString.indexOf("Heute, ")+1))
    {
        // Date is not today...adjust date-variable
        
        var day = parseInt(timeString.slice(timeString.indexOf(", ") + 2, timeString.indexOf(". ")));
        var monthName = timeString.slice(timeString.indexOf(". ") + 2, timeString.lastIndexOf(", "));
        
        var month;
        switch (monthName)
        {
            case "Januar":
                month = 0;
                break;
            case "Februar":
                month = 1;
                break;
            case "März":
                month = 2;
                break;
            case "April":
                month = 3;
                break;
            case "Mai":
                month = 4;
                break;
            case "Juni":
                month = 5;
                break;
            case "Juli":
                month = 6;
                break;
            case "August":
                month = 7;
                break;
            case "Sep":
                month = 8;
                break;
            case "Okt":
                month = 9;
                break;
            case "Nov":
                month = 10;
                break;
            case "Dez":
                month = 11;
                break;
            default:
                month = -1;
                console.log("Could not recognize name of month!");
        }
        
        date.setDate(day);

        if(month < date.getMonth())
            date.setFullYear(date.getFullYear() + 1);

        date.setMonth(month);
       
        // TESTING     
        // console.log("Month: " + month);
        // console.log("Day: " + day);
        // console.log("Hour: " + time.getHours());
        // console.log("Minute: " + time.getMinutes());
    }
    else
        console.log("Date is today, so leave it at current system-time");

    // Crop down to clock-part of string
    var clockString = timeString.slice(timeString.lastIndexOf(", ") + 2, timeString.indexOf(" Uhr"));

    if (clockString == '') return null;
    var time = clockString.match(/(\d+)(:(\d\d))?\s*(p?)/i);
    if (time == null) return null;


    var hours = parseInt(time[1], 10);
    if (hours == 12 && !time[4]) {
        hours = 0;
    }
    else {
        hours += (hours < 12 && time[4]) ? 12 : 0;
    }
    date.setHours(hours);
    date.setMinutes(parseInt(time[3], 10) || 0);
    date.setSeconds(0, 0);
    return date;
};

exports.remainingTime = function(timeDate) {
    return translateToMinsOfDay(timeDate) - translateToMinsOfDay(new Date());
};

function translateToMinsOfDay(date) {
    return (date.getHours() * 60) + date.getMinutes();
};

/*

Website date-translations:


['month_1'] = 'Januar';

['month_2'] = 'Februar';

['month_3'] = 'März';

['month_4'] = 'April';

['month_5'] = 'Mai';

['month_6'] = 'Juni';

['month_7'] = 'Juli';

['month_8'] = 'August';

['month_9'] = 'Sep';

['month_10'] = 'Okt';

['month_11'] = 'Nov';

['month_12'] = 'Dez';

['smonth_1'] = 'Jan';

['smonth_2'] = 'Feb';

['smonth_3'] = 'März';

['smonth_4'] = 'Apr';

['smonth_5'] = 'Mai';

['smonth_6'] = 'Juni';

['smonth_7'] = 'Juli';

['smonth_8'] = 'Aug';

['smonth_9'] = 'Sep';

['smonth_10'] = 'Okt';

['smonth_11'] = 'Nov';

['smonth_12'] = 'Dez';

['monday'] = 'Montag';

['tuesday'] = 'Dienstag';

['wednesday'] = 'Mittwoch';

['thursday'] = 'Donnerstag';

['friday'] = 'Freitag';

['saturday'] = 'Samstag';

['sunday'] = 'Sonntag';

*/