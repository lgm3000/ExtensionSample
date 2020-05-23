// Copyright 2020 Max Wang.
// This source code is free-for-all.
// I live in constant fear that decimal commas will devastate this code

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
  'nothing':'Nothin\''
  //,'online_gaming':'Vidya Gaem'
  ,'video_streaming':'Netflix no chill'
  //,'audio_streaming':'Stream Music'
  //,'page_browsing':'Page Browsing'
  };

const activityWeight = {
  'other': 3,
  'nothing': 0,
  'online_gaming': 3,
  'video_streaming': 10,
  'audio_streaming':5,
  'page_browsing':2 };

// define the refresh interval of weather-checking

const refreshInterval = 0 /*mins*/ * 60 * 1000 +
                        5 /*secs*/ * 1000;

const notificationInterval =   Math.floor(
                                (1 /*mins*/ * 60 * 1000 +
                                 0 /*secs*/ * 1000) / refreshInterval);

// define the constant coefficient used to calculate BEnv Score

const BEnvA = 2;

// define the size / length of the activity FIFO stack
const actStackLength = 3;
                            
/*****************************************************************************************/

//export {timeranges,leisureOptions,dayOfWeek};

var weather = true;
var activeType = "Unknown";
var prevactiveType = "Unknown";
var actStack = new Array();
var EnvImp = 0; // Env. Impact Score (BEnv Score)
var BEnvImp = 0; // Behavior-offset Env. Impact Score (BEnv Score)
var forecast = {};
var arr2 = {};
var notArr = {};
for(var i in dayOfWeek){
	forecast[i] = {};
	arr2[i] = {};
	notArr[i] = {};
	}
var fset = false;
var rset = false;
var muteUntil = new Date();
const channel = new BroadcastChannel('sw-messages');
var vidQuality = {};
var notCount = 0;
var siteOptions = {};
siteOptions['green'] = ['reddit.com'];
siteOptions['red'] = ['youtube.com'];
//export {EnvImp,BEnvImp};

var currentTab;

const forecastInit = '5,t1:9;5,t2:7;5,t3:8;5,t4:7;5,t5:6;5,t6:5;5,t7:5;5,t8:5;6,t1:2;6,t2:8;6,t3:3;6,t4:7;6,t5:9;6,t6:3;6,t7:3;6,t8:2;0,t1:3;0,t2:4;0,t3:4;0,t4:4;0,t5:4;0,t6:4;0,t7:4;0,t8:3;1,t1:5;1,t2:6;1,t3:6;1,t4:5;1,t5:6;1,t6:7;1,t7:7;1,t8:7;2,t1:6;2,t2:6;2,t3:6;2,t4:5;2,t5:6;2,t6:5;2,t7:5;2,t8:5;3,t1:5;3,t2:5;3,t3:6;3,t4:6;3,t5:6;3,t6:5;3,t7:5;3,t8:4;4,t1:5;4,t2:6;4,t3:7;4,t4:7;4,t5:7;4,t6:7;4,t7:7;4,t8:7';

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
	console.log(siteOptions);
	var greensite = siteOptions['green'][Math.floor(Math.random() * 100) % siteOptions['green'].length];
	if(!(Date.parse(today) < muteUntil)){
		console.log(activeType);
      	if(activeType == 'video_streaming'){
      		// We want to know if we can try lowering the quality of video, but currently only works when the current tab is youtube
      		if (vidQuality['cur'].startsWith('h')){
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
				addText = addText + " Try lowering your video quality!";
      		} else {
      			options = [
					{
						action: "reset to " + greensite,
						title: "Be Inspired!"
					},
					{
						action: "disable",
						title: "mute notifications"
					}
				];
				addText = addText + " Check out some environment-friendly sites!";
      		}
  	    } else{
  	        options = [
					{
						action: "reset to " + greensite,
						title: "Be Inspired!"
					},
					{
						action: "disable",
						title: "mute notifications"
					}
				];
			addText = addText + " Check out some environment-friendly sites!";
  	    }
  	    var time = /(..)(:..)/.exec(today);     // The prettyprinted time.
		var hour = time[1] % 12 || 12;               // The prettyprinted hour.
		var period = time[1] < 12 ? 'a.m.' : 'p.m.'; // The period of the day.
		swRegistration.showNotification(hour + time[2] + ' ' + period, {
					icon: 'images/redWeather.png',
					body: addText,
					actions: options
				});
		var muteU = new Date();
		notArr[getCurDay()][getCurTime()][0] = Number(notArr[getCurDay()][getCurTime()][0]) + 1;
		muteU.setSeconds(muteU.getSeconds() + 300);
		muteNotification(muteU);
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
    chrome.tabs.query({active: true,currentWindow: true}, function(tabs) {
    	console.log(tabs[0].url);
    	if(tabs[0]!=null){
    		if(tabs[0].url.includes("youtube.com"))
		    chrome.tabs.sendMessage(tabs[0].id, {type: "sendQ"}, function(response) {
    		    console.log(response);
    		});
    		else vidQuality = {cur: 'unknown', ful:'unknown'};
    	}
    	else vidQuality = {cur: 'unknown', ful:'unknown'};
	});
}

function lowerVidQuality(){
	refreshVidQuality();
	// check if vid quality can be lowered
	if(vidQuality.ful.some(function(ele){return !ele.startsWith('h');}) && vidQuality.ful[0] != 'unknown'){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		    chrome.tabs.sendMessage(tabs[0].id, {type: "lowerVidQ"}, function(response) {
		    console.log(response);
		});
	});
	}
}

function setScoreArr(sstr){
	if(sstr == null)
	    for(var i in dayOfWeek)
	        for(var j in timeranges)
	            arr2[i][j] = 0;
	else{
		console.log(sstr);
		console.log(arr2);
	    sstr.split(';').forEach(function(item){
    		arr2[item.split(':')[0].split(',')[0]][item.split(':')[0].split(',')[1]] = Number(item.split(':')[1]);
    	});
	}
}
function setNotArr(sstr){
	if(sstr == null)
	    for(var i in dayOfWeek)
	        for(var j in timeranges)
	            notArr[i][j] = [0,0,0,0];
	else{
		console.log(sstr);
		console.log(notArr);
	    sstr.split(';').forEach(function(item){
    		notArr[item.split(':')[0].split(',')[0]][item.split(':')[0].split(',')[1]] = item.split(':')[1].split(',');
    	});
	}
}
function syncScore(){
	var sstr = "";
	    for (var dday in dayOfWeek) 
		    if(dayOfWeek.hasOwnProperty(dday))
		    	for (var ttime in timeranges) 
		    		if(timeranges.hasOwnProperty(ttime)){
		    			if(isNaN(arr2[dday][ttime])){
		    				arr2[dday][ttime] = 0;
		    			}
		    			sstr = sstr + dday + "," + ttime + ":" + arr2[dday][ttime] + ";"
		    			
		    		}
		    			
	sstr = sstr.substring(0, sstr.length - 1);
    chrome.storage.local.set({'score': sstr}, function() {
    })
}
function syncNotification(){
	var sstr = "";
	    for (var dday in dayOfWeek) 
		    if(dayOfWeek.hasOwnProperty(dday))
		    	for (var ttime in timeranges) 
		    		if(timeranges.hasOwnProperty(ttime)){
		    			if(notArr[dday][ttime].length!=4) notArr[dday][ttime] = [0,0,0,0];
		    			for(var i = 0;i<4;i++) if(isNaN(notArr[dday][ttime][i])) notArr[dday][ttime][i] = 0;
		    			sstr = sstr + dday + "," + ttime + ":" + notArr[dday][ttime].join(',') +  ";";		    			
		    		}
		    			
	sstr = sstr.substring(0, sstr.length - 1);
    chrome.storage.local.set({'notinfo': sstr}, function() {
    })
}


/*****************************************************************************************/

// This function will be used to determine the weather which should affect energy source
// Using RNG to generate weather changes - in the final version should be pulling
// actual data
function muteNotification(data){
	console.log('Mute notifications until:' + data);
	var h = Date.parse(data);
  	//chrome.storage.local.set({'mute':h},function(){});
  	muteUntil = h > muteUntil? h:muteUntil;
}

function pullForecast(){
	var sstr = "";
	fset = false;
	console.log("pulling Fore");
	if(forecastInit == null){
		for (var dday in dayOfWeek)
			for (var time in timeranges)
				if(timeranges.hasOwnProperty(time)){
					var rnd = (Math.floor(Math.random() * 10) + 1);
					forecast[dday][time] = rnd;
					sstr = sstr + dday + ',' + time + ":" + rnd + ";"
				}
	}
	else{
		console.log("setting forecast from initString");
		forecastInit.split(';').forEach(function(item){
		    forecast[item.split(':')[0].split(',')[0]][item.split(':')[0].split(',')[1]] = item.split(':')[1];
	    });
		sstr = forecastInit + ';';
	}
	sstr = sstr.substring(0, sstr.length - 1);
    chrome.storage.local.set({'forecast': sstr}, function() {fset = true;});
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
	chrome.storage.local.get('forecast',function(data){
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

// export {getWeather,getForecast,pullForecast};

function isBetween(timePeriod){
    let startDate = Date.parse('01/01/2000 ' + timePeriod.split('-')[0] + ':00');
    let endDate = Date.parse('01/01/2000 ' + timePeriod.split('-')[1] + ':00')
    let today = new Date();
    let curDate = Date.parse('01/01/2000 ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds())
    return curDate > startDate && curDate <= endDate;
}
function getCurDay(){
	let now = new Date();
	return (now.getDay() + 6) % 7;
}
function getCurTime(){
	for (var time in timeranges) 
	    if(timeranges.hasOwnProperty(time)){
			if (isBetween(timeranges[time])){
                return time;
			}
	    }
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


// Service worker listener
channel.addEventListener('message', event => {
  console.log(event);
  if(event.data.type == 'mute until'){
  	console.log(event.data.val);
  	muteNotification(event.data.val);
  	notArr[getCurDay()][getCurTime()][3] = Number(notArr[getCurDay()][getCurTime()][3]) + 1;
  }
  if(event.data.type == 'resetpage'){
    if(currentTab == null)
        window.open(event.data.val);
    else
        chrome.tabs.update(currentTab.id, {url: event.data.val});
    notArr[getCurDay()][getCurTime()][1] = Number(notArr[getCurDay()][getCurTime()][1]) + 1;
    let today = new Date();
	today.setSeconds(today.getSeconds() + 1800);
    muteNotification(today);
  }   
  if(event.data.type == 'lower'){
  	console.log(event.data.val);
    lowerVidQuality();
    notArr[getCurDay()][getCurTime()][2] = Number(notArr[getCurDay()][getCurTime()][2]) + 1;
    let today = new Date();
    today.setSeconds(today.getSeconds() + 1800);
    muteNotification(today);
  }   
});

// Runtime listener
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
      // console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
      if (request.type == "getQ"){
          sendResponse({farewell: "goodbye"});
          vidQuality = {cur: request.cur, ful:request.ful};
      }
      if (request.type == "getVars"){
          sendResponse({timeranges: timeranges, leisureOptions: leisureOptions, dayOfWeek:dayOfWeek});
      }
      if (request.type == "getWeather"){
          var weathermod = getWeather();
          sendResponse({weather:weathermod});
      }
      if (request.type == "getForecast"){
          
          sendResponse({weather:weathermod});
      }
      if (request.type == "pullForecast"){
          pullForecast();
      }
      if (request.type == "addOption"){
          siteOptions[request.col].unshift(request.val);
          if(siteOptions[request.col].length>4)
              siteOptions[request.col].pop();
          var nameval = request.col + 'sites';
          chrome.storage.local.set({'redsites': siteOptions['red']});
          chrome.storage.local.set({'greensites': siteOptions['green']});
      }

});

/************************************************************************** main function***********************************************************************/
async function main(){
	try{
		getForecast(0,'t1');
	}
	catch(error){
		console.log('resetting forecast');
		pullForecast();
	}
    try{
		chrome.storage.local.get('score',function(data){
			setScoreArr(data.score);
		});
	}
	catch(error){
		setScoreArr();
	}
    try{
		chrome.storage.local.get('notinfo',function(data){
			setNotArr(data.notinfo);
		});
	}
	catch(error){
		setNotArr();
	}
    const swRegistration = await registerServiceWorker();

	// Checks weather status every x seconds.
	// TODO: in reality interval should be longer (5-mins+), as this refresh is not (and should not be)
	// very time-sensitive.
	// TODO: option to turn off notification for X amount of time. (pop-up)

	setInterval(function(){
		syncScore();
		syncNotification();
		console.log(notArr);
		let muuu = new Date(muteUntil);
		console.log(muuu);
		// Pulling user planning from storage
		chrome.storage.local.get('activity',function(data){
			let now = new Date();
			let today = (now.getDay() + 6) % 7;
			let tmp = data.activity.split(';');
			var plan = {};
			tmp.forEach(function(item){
				if(item.split(':')[0].split(',')[0]==today)
					plan[item.split(':')[0].split(',')[1]] = item.split(':')[1];
			});	


			// Maintaining the activity FIFO stack 
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				try{
				    chrome.tabs.sendMessage(tabs[0].id, {type: "isVid"}, function(response) {
				    	try{
						    if(response.isVid){
    							actStack.unshift("video_streaming");
    						} else{
    							actStack.unshift("other");
    						}
				    	} catch(error){
					        console.log("defaulting activity");
					        actStack.unshift("other");
				        }
				        if(tabs[0]!=null)
				            currentTab = tabs[0];
					});
				} catch(error){
					console.log("defaulting activity");
					actStack.unshift("other");
				}

				if(actStack.length > actStackLength){
					actStack.pop();
				}
				
			});
			activeType = getAct(actStack);
			console.log(actStack);
			//console.log(activeType);

			for (var time in timeranges) 
				if(timeranges.hasOwnProperty(time)){

					if (isBetween(timeranges[time])){
						//console.log('current time is ' + time + ' ' + timeranges[time]);

						if(activeType != null){
							// Getting the weather weight
							var weatherWeight = getWeather();
							console.log(weatherWeight);
                            if(weatherWeight >5)
							    chrome.browserAction.setIcon({path: "/images/red-19.png"});
							else
							    chrome.browserAction.setIcon({path: "/images/green-19.png"});
							let p = activityWeight[plan[time]];
							let q = activityWeight[activeType];
							if(activeType=='video_streaming'){
								refreshVidQuality();
								if(vidQuality.cur=='Unknown' || vidQuality.cur.startsWith('h')){
								} else {
								q = q * 0.5;
						        }
							}
							console.log(vidQuality);
							    

							// Calculating the environmental impact score
							EnvImp = EnvImp + q * weatherWeight;
							arr2[today][time] = Number(arr2[today][time]) + Number(q * weatherWeight);

							// Calculating the behaviour-offset Env. Impact score
							BEnvImp = BEnvImp + ((p - q)>=0?0.02:-0.1) * (p - q + (plan[time] == activeType)) * (p - q + (plan[time] == activeType));

							// TODO: calculate the behaviour assessment score
							// TODO: tracks your active tab & tries to identify if you're doing what you
							// were supposed to do.

							console.log("current    plan: " + plan[time]);
							console.log("current weather: " + getWeather());
							console.log("active activity: " + activeType);
							// show('Hey, your current activity type is ' + activeType + ', plan is ' + plan[time],swRegistration);


                            // notification zone
                            
                            
                            	
							if (plan[time]!='disabled'){
								var notStr = "??";
								// first check if the active activity is same as plan
								if (plan[time] == activeType) {
									// if act = plan, then mildly suggest change when wheather is bad
									if(weatherWeight > 5){
										notStr = 'Thanks for sticking to your plan! However, you can consider changing your plan to something more eco-friendly!';
										show(notStr,swRegistration);
										
									}
									else{
										notStr = ('Thanks for sticking to your plan! The weather is good to do anything at this time!');
									}

								}
								else{
									// if act != plan, then strongly suggest change when current activity is bad & wheather is bad
									if(getWeather() > 5){
										if(activityWeight[activeType]> 5){
										    notStr = 'Energy is mostly generated by fossil fuel at this time!';
										    show(notStr,swRegistration);
										}else{
											notStr = 'Doing '+activeType+' during bad weather is great!';
										    
										}
									}else{
										notStr = ('The weather is good to do anything at this time - but please consider sticking to your plan!');
									}
								}
								
								//console.log(getForecast(today,time));
								//console.log(EnvImp);
								//console.log(BEnvImp);	
								console.log(notStr);
                            }
						}
					}
				}
		});
	}, refreshInterval);
}

main();