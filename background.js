// Copyright 2020 Max Wang.
// This source code is free-for-all.

'use strict';

/*****************************************************************************************/
// Changable variables

// Defines the time ranges you would want to monitor
// the time needs to be in format HH:MM-HH:MM

const timeranges = {
  't1':'08:00-10:00',
  't2':'10:00-12:00',
  't3':'12:00-14:00',
  't4':'14:00-16:00',
  't5':'16:00-18:00',
  't6':'18:00-20:00',
  't7':'20:00-22:00',
  't8':'22:00-23:59'
  };

// Defines the types of activities you can choose from throughout the day
// currently it is defined in format 'backend name':'display name'
// TODO: assign weights (based on environmental impact) to each activity

const leisureOptions = {
  'nothing':'Nothin\'',
  'online_gaming':'Vidya Gaem',
  'video_streaming':'Netflix no chill',
  'audio_streaming':'Stream Music',
  'page_browsing':'Page Browsing'};

const activityWeight = {
  'other': 5,
  'nothing': 0,
  'online_gaming': 3,
  'video_streaming': 10,
  'audio_streaming':5,
  'page browsing':2 };

// define the refresh interval of weather-checking

const refreshInterval = 0 /*mins*/ * 60 * 1000 +
                        3 /*secs*/ * 1000;

// define the constant coefficient used to calculate BEnv Score

const BEnvA = 2;
                            
/*****************************************************************************************/

export {timeranges,leisureOptions};

var weather = true;
var activeType = "Unknown";
var actStack = new Array();
var EnvImp = 0; // Env. Impact Score (BEnv Score)
var BEnvImp = 0; // Behavior-offset Env. Impact Score (BEnv Score)

export {EnvImp,BEnvImp};

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
// returns an integer between 1 and 10.
function getWeather(){
	// Using RNG to generate weather changes - in the final version should be pulling
	// actual data
	var rnd = Math.random() * 10;

	//return Math.floor(rnd) + 1;
	return 1;
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
	var res = null;
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
    	let today = (new Date().getDay() + 6) % 7;
    	let tmp = data.activity.split(';');
    	var plan = {};
    	tmp.forEach(function(item){
    		if(item.split(':')[0].split(',')[0]==today)
    		    plan[item.split(':')[0].split(',')[1]] = item.split(':')[1];
	    });	
        
        console.log(plan);

        // Maintaining the activity FIFO stack 
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        	try{
                var curtab = new URL(tabs[0].url).hostname;
                if(curtab == "www.youtube.com"){
            	    actStack.unshift("video_streaming");
                    } else{
                    actStack.unshift("other");
                    }
        	}
            catch(error){
            	actStack.unshift("other");
            }

            if(actStack.length > 10){
                actStack.pop();
            }
        });
        activeType = getAct(actStack); 
        //console.log(actStack);
        //console.log(activeType);


    	for (var time in timeranges) 
            if(timeranges.hasOwnProperty(time)){

            	if (isBetween(timeranges[time])){
            		//console.log('current time is ' + time + ' ' + timeranges[time]);

                    if(activeType != null){
						// Getting the weather weight
						var weatherWeight = getWeather();
						let p = activityWeight[plan[time]];
						let q = activityWeight[activeType];

						// Calculating the environmental impact score
						EnvImp = EnvImp + q * weatherWeight;

						// Calculating the behaviour-offset Env. Impact score
						BEnvImp = BEnvImp + 
						    ((p - q)>=0?0.02:-0.1) * (p - q + (plan[time] == activeType)) * (p - q + (plan[time] == activeType));

						// TODO: calculate the behaviour assessment score
						// TODO: tracks your active tab & tries to identify if you're doing what you
						// were supposed to do.
						console.log("current    plan: " + plan[time]);
						console.log("active activity: " + activeType);
						if (plan[time] == activeType) {
							//show('You should change your plan from ' + plan[time] + ' to something eco-friendly!');	
						}
						else{
							//show('You shouldn\'t be doing ' + plan[time]);
						}

						console.log(EnvImp);
						console.log(BEnvImp);
                    }
                }
            }
    });
}, refreshInterval);
