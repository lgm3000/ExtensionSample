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
  
const dayOfWeek = {
	'0': 'Monday',
	'1': 'Tuesday',
	'2': 'Wednesday',
	'3': 'Thursday',
	'4': 'Friday',
	'5': 'Saturday',
	'6': 'Sunday'
}
// Defines the types of activities you can choose from throughout the day
// currently it is defined in format 'backend name':'display name'

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
  'page_browsing':2 };

// define the refresh interval of weather-checking

const refreshInterval = 0 /*mins*/ * 60 * 1000 +
                        8 /*secs*/ * 1000;

// define the constant coefficient used to calculate BEnv Score

const BEnvA = 2;

// define the size / length of the activity FIFO stack
const actStackLength = 20;
                            
/*****************************************************************************************/

export {timeranges,leisureOptions,dayOfWeek};

var weather = true;
var activeType = "Unknown";
var actStack = new Array();
var EnvImp = 0; // Env. Impact Score (BEnv Score)
var BEnvImp = 0; // Behavior-offset Env. Impact Score (BEnv Score)
var forecast = {};
var fset = false;
var rset = false;
for(var i in dayOfWeek)
	forecast[i] = {};
var muteUntil = new Date();
const channel = new BroadcastChannel('sw-messages');
var vidQuality = {};

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
function show(addText,swRegistration) {
	var today = new Date();
	var options = [];
	if(!(today < muteUntil)){
		console.log(activeType);
      	if(activeType == 'video_streaming'){
            options = [
                    {
						action: "lower",
						title: "lower vid quality"
					},
					{
						action: "disable",
						title: "mute notifications"
					}
					
				];
  	    }else{
  	        options = [
					{
						action: "go to site",
						title: "go to youtube"
					},
					{
						action: "disable",
						title: "mute notifications"
					}
				];
  	    }
  	    var time = /(..)(:..)/.exec(today);     // The prettyprinted time.
		var hour = time[1] % 12 || 12;               // The prettyprinted hour.
		var period = time[1] < 12 ? 'a.m.' : 'p.m.'; // The period of the day.
		swRegistration.showNotification(hour + time[2] + ' ' + period, {
					icon: 'images/128.png',
					body: addText,
					actions: options
				});
    }
	
}



async function registerServiceWorker() {
    const swRegistration = await navigator.serviceWorker.register('/service-worker.js')
    .then(function(registration) {
        console.log('Service worker successfully registered.');
        return registration;
    })
    .catch(function(err) {
        console.error('Unable to register service worker.', err);
    });
    return swRegistration;
}

function refreshVidQuality(){
    chrome.tabs.query({active: true}, function(tabs) {
    	console.log(tabs[0].url);
		chrome.tabs.sendMessage(tabs[0].id, {type: "sendQ"}, function(response) {
		console.log(response);
		});
	});
}

function lowerVidQuality(){
	refreshVidQuality();
	// check if vid quality can be lowered
	if(vidQuality.ful.some(function(ele){return !ele.startsWith('h');})){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		    chrome.tabs.sendMessage(tabs[0].id, {type: "lowerVidQ"}, function(response) {
		    console.log(response);
		});
	});
	}
}

/*****************************************************************************************/

// This function will be used to determine the weather which should affect energy source
// Using RNG to generate weather changes - in the final version should be pulling
// actual data
function pullForecast(){
	var sstr = "";
	fset = false;
	for (var dday in dayOfWeek)
        for (var time in timeranges)
            if(timeranges.hasOwnProperty(time)){
                sstr = sstr + dday + ',' + time + ":" + (Math.floor(Math.random() * 10) + 1) + ";"
            }
	sstr = sstr.substring(0, sstr.length - 1);
    chrome.storage.sync.set({'forecast': sstr}, function() {fset = true;});
}

function getWeather(){
	for (var time in timeranges)
        if(timeranges.hasOwnProperty(time)){
	        if (isBetween(timeranges[time])){
	            return getForecast((new Date().getDay() + 6) % 7,time);
	            }
	    }
	return 5;
}

function getForecast(day,range){
	chrome.storage.sync.get('forecast',function(data){
		var tmp;
		try{
    	    tmp = data.forecast.split(';');
		}catch(error){
			console.log(data.forecast);
			return;
		}
    	tmp.forEach(function(item){
    		forecast[item.split(':')[0].split(',')[0]][item.split(':')[0].split(',')[1]] = item.split(':')[1];
    	});
    	fset = true;
    });
    if(fset = true){
        return forecast[day][range];
    }
	else return undefined;
}

export {getWeather,getForecast,pullForecast};

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
        pageUrl: {schemes:['https','chrome']},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
  pullForecast();
  registerServiceWorker();
});

channel.addEventListener('message', event => {
  console.log(event);
  if(event.data.type == 'mute until'){
  	console.log('Mute notifications until:' + Date.parse(event.data.val));
  	var h = Date.parse(event.data.val).toString();
  	chrome.storage.sync.set({'mute':h},function(){});
  	muteUntil = h;
  }
  if(event.data.type == 'lower'){
  	console.log(event.data.val);
    lowerVidQuality();
  }   
});

// Getting data from content script
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
      // console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
      if (request.type == "getQ"){
          sendResponse({farewell: "goodbye"});
          vidQuality = {cur: request.cur, ful:request.ful};
      }
      console.log(request);
});

// main function
async function main(){
	try{
		getForecast(0,'t1');
	}
	catch(error){
		console.log('resetting forecast');
		pullForecast();
	}
    const swRegistration = await registerServiceWorker();
    
//    show('Hi',swRegistration);

	// Checks weather status every 3 seconds.
	// TODO: in reality interval should be longer (5-mins+), as this refresh is not (and should not be)
	// very time-sensitive.
	// TODO: option to turn off notification for X amount of time. (pop-up)

	setInterval(function(){
		refreshVidQuality();
		// Pulling user planning from storage
		chrome.storage.sync.get('activity',function(data){
			let today = (new Date().getDay() + 6) % 7;
			let tmp = data.activity.split(';');
			var plan = {};
			tmp.forEach(function(item){
				if(item.split(':')[0].split(',')[0]==today)
					plan[item.split(':')[0].split(',')[1]] = item.split(':')[1];
			});	


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

				if(actStack.length > actStackLength){
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
							console.log("current weather: " + getWeather());
							console.log("active activity: " + activeType);
							show('Hey, your current activity type is ' + activeType + ', plan is ' + plan[time],
							swRegistration);

							if (plan[time]!='disabled'){

								// first check if the active activity is same as plan
								if (plan[time] == activeType) {

									// if act = plan, then mildly suggest change when wheather is bad
									if(getWeather() >= 7){
										console.log('Thanks for sticking to your plan!');
										console.log('However, you can consider changing your plan to something more eco-friendly!');
									}else{
										console.log('Thanks for sticking to your plan! The weather is good to do anything at this time!');
									}

								}
								else{
									// if act != plan, then strongly suggest change when wheather is bad
									if(getWeather() >= 7){
										console.log('You shouldn\'t be doing ' + activeType + ' at this time! Consider sticking to your plan!');
									}else{
										console.log('The weather is good to do anything at this time - but please consider sticking to your plan!');
									}
								}
							}
							//console.log(getForecast(today,time));
							//console.log(EnvImp);
							//console.log(BEnvImp);
						}
					}
				}
		});
	}, refreshInterval);
}


main();