// Copyright 2020 Max Wang.
// This source code is free-for-all.

'use strict';

/*****************************************************************************************/
// Changable variables

// Defines the time ranges you would want to monitor
// the time needs to be in format HH:MM-HH:MM

const timeranges = {
  'morning':'09:00-12:00',
  'afternoon':'12:00-18:00',
  'evening':'18:00-23:59'};

// Defines the types of activities you can choose from throughout the day
// currently it is defined in format 'backend name':'display name'
// TODO: assign weights (based on environmental impact) to each activity

const leisureOptions = {
  'online_gaming':'Vidya Gaem',
  'video_streaming':'Netflix no chill',
  'audio_streaming':'Stream Music',
  'page browsing':'Page Browsing'};

// define the refresh interval of weather-checking

const refreshInterval = 0 /*mins*/ * 60 * 1000 +
                        5 /*secs*/ * 1000;
                            
/*****************************************************************************************/

export {timeranges,leisureOptions};

var weather = true;

// Displaying notification. Uses notification API
function show(addText) {
  var time = /(..)(:..)/.exec(new Date());     // The prettyprinted time.
  var hour = time[1] % 12 || 12;               // The prettyprinted hour.
  var period = time[1] < 12 ? 'a.m.' : 'p.m.'; // The period of the day.
  new Notification(hour + time[2] + ' ' + period, {
    icon: 'images/128.png',
    body: 'Fossil fuels are now dominating the UK energy grid! ' + addText
  });
}

// This function will be used to determine the weather which should affect energy source
// currently the weather function returns boolean results.
// TODO: the 'weather' should be a percentage.
function getWeather(){
	// Using RNG to generate weather changes - in the final version should be pulling
	// actual data
	var rnd = Math.random();

	if(rnd > 0.5)
	    return true;
	else
	    return false;
}

function isBetween(timePeriod){
    let startDate = Date.parse('01/01/2000 ' + timePeriod.split('-')[0] + ':00');
    let endDate = Date.parse('01/01/2000 ' + timePeriod.split('-')[1] + ':00')
    let today = new Date();
    let curDate = Date.parse('01/01/2000 ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds())
    return curDate > startDate && curDate <= endDate;
}

chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {schemes:['https']},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});


// Checks weather status every 3 seconds.
// TODO: in reality interval should be longer (5-mins+), as this refresh is not (and should not be)
// very time-sensitive.
// TODO: option to turn off notification for X amount of time. (pop-up)

setInterval(function(){
    // Pulling user planning from storage
    chrome.storage.sync.get('activity',function(data){
    	let tmp = data.activity.split(';');
    	var plan = {};
        for (var item in tmp)
            plan[tmp[item].split(':')[0]] = tmp[item].split(':')[1];
        
        console.log(plan);

    	for (var time in timeranges) 
            if(timeranges.hasOwnProperty(time))
            	if (isBetween(timeranges[time])){
            		console.log('current time is ' + time + ' ' + timeranges[time]);
            		if(!getWeather()){
            			// TODO: we should be weighing activity imact against weather %.
            			// TODO: tracks your active tab & tries to identify if you're doing what you
            			// were supposed to do.

                        //show('You shouldn\'t be doing ' + plan[time]);
    	            }
                }
    });
}, refreshInterval);
