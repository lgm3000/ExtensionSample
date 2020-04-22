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
  'evening':'18:00-23:59',
  'early morning':'06:00-09:00'};

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
var activeType = "Unknown";
var actStack = new Array();
var T = 0; // Behavior-offset Env. Impact Score (BEnv Score)

/*****************************************************************************************/
// Notification zone

// At first glance, there should be 4 different types of notifications,
// - option A: suggesting user to go offline and 'get some fresh air'
// - option B: suggesting user to stay with same option, but use less bandwidth
// - option C: suggesting user to switch activity
//   - C1: user is not aligned with plan, suggest to re-align (no brainer)
//   - C2: user is aligned with plan, suggest to switch to other activity
// - option D: suggesting user to swap schedules

// Ideally we should track user behaviour based on option.

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



/*****************************************************************************************/
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

function getAct(arr){
	var max = 0;
	var res = '';
	var rset = {};

	for( var i = 0, total = arr.length; i < total; ++i ) {
	var val = arr[i],
		inc = ( rset[val] || 0 ) + 1;
	rset[val] = inc;
	if( inc > max ) { 
		max = inc;
		res = val;
	}
	}
	return res;
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

// Listener for active tab - removed since more beneficial to sample active web page in intervals
/*
chrome.tabs.onActivated.addListener(function (tab) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var activeTab = tabs[0];
        //chrome.extension.getBackgroundPage().console.log(activeTab.url);
        //chrome.extension.getBackgroundPage().console.log(activeTab.title);

        var curtab = new URL(activeTab.url).hostname;
        console.log(curtab);

        if(curtab == "www.youtube.com"){//,"youtube.com","www.netflix.com"]){
        	console.log("video streaming start")
        	activeType = "video_streaming";
        } else{
        	activeType = "Unknown";
        }
    })
});
*/

// Checks weather status every 3 seconds.
// TODO: in reality interval should be longer (5-mins+), as this refresh is not (and should not be)
// very time-sensitive.
// TODO: option to turn off notification for X amount of time. (pop-up)

setInterval(function(){
    // Pulling user planning from storage
    chrome.storage.sync.get('activity',function(data){
    	let tmp = data.activity.split(';');
    	tmp.pop();
    	var plan = {};
        for (var item in tmp)
            plan[tmp[item].split(':')[0]] = tmp[item].split(':')[1];
        
        console.log(plan);

        // Maintaining the activity FIFO stack 
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var curtab = new URL(tabs[0].url).hostname;
            if(curtab == "www.youtube.com"){
            	actStack.unshift("video_streaming");
            } else{
                actStack.unshift("other");
            }

            if(actStack.length > 10){
                actStack.pop();
            }
        });
        activeType = getAct(actStack); 
        console.log(actStack);
        console.log(activeType);


    	for (var time in timeranges) 
            if(timeranges.hasOwnProperty(time))
            	if (isBetween(timeranges[time])){
            		console.log('current time is ' + time + ' ' + timeranges[time]);
            		if(!getWeather()){
            			// TODO: calculate the behaviour-offset Env. Impact score
            			// TODO: calculate the behaviour assessment score
            			// TODO: tracks your active tab & tries to identify if you're doing what you
            			// were supposed to do.
                        if (plan[time] == activeType) {
                            //show('You should change your plan from ' + plan[time] + ' to something eco-friendly!');	
                        }
                        else{
                        	//show('You shouldn\'t be doing ' + plan[time]);
                        }
                        
    	            }
                }
    });
}, refreshInterval);
