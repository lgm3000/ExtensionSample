'use strict'

//import {timeranges,leisureOptions,dayOfWeek,getForecast,getWeather} from './background.js';

var timeranges = {};
var leisureOptions = {};
var dayOfWeek = {};
var greensites = [];
var redsites = [];

function initVars(){
    chrome.runtime.sendMessage({type: "getVars"}, function(response) {
    	timeranges = response.timeranges;
    	leisureOptions = response.leisureOptions;
    	dayOfWeek = response.dayOfWeek;
    	init();
    });
}

function getWeather(day,time){
    return new Promise(function(resolve){
    	chrome.runtime.sendMessage({type: "getWeather"}, function(response) {
    	    resolve(response.weather);
        });
    }); 

}

function updateRecs(weathermod){
	if(weathermod > 5){
			// put down red sites
			for (var i = 0; i <redsites.length;i++){
			    document.getElementById("dspdescopt" + i).innerHTML = redsites[i];
			    document.getElementById("dspdescopt" + i).style = "";
			    document.getElementById("dspdescopt" + i).onclick = function(){location.href = "https://" + this,innerHTML;};
			}
			for (var i = redsites.length; i < 4;i++){
				document.getElementById("dspdescopt" + i).innerHTML = "";
				document.getElementById("dspdescopt" + i).style = "pointer-events: none;";
			}
			//document.getElementById("dspdescopt1").innerHTML = '<img src = "https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-114x114.png" align="middle"></img>';
			//document.getElementById("dspdescopt1").onclick = function(){location.href = "https://www.reddit.com";};
			//document.getElementById("dspdescopt2").innerHTML = '<img src = "https://openlibrary.org/static/images/openlibrary-152x152.png" align="middle"></img>';
			//document.getElementById("dspdescopt2").onclick = function(){location.href = "https://openlibrary.org";};
		}else{
			for (var i = 0; i <greensites.length;i++){
			    document.getElementById("dspdescopt" + i).innerHTML = greensites[i];
			    document.getElementById("dspdescopt" + i).style = "";
			    document.getElementById("dspdescopt" + i).onclick = function(){location.href = "https://" + this.innerHTML;};
			}
			for (var i = greensites.length; i < 4;i++){
				document.getElementById("dspdescopt" + i).innerHTML = "";
				document.getElementById("dspdescopt" + i).style = "pointer-events: none;";
			}
			//document.getElementById("dspdescopt1").innerHTML = '<img src = "https://s.ytimg.com/yts/img/favicon_144-vfliLAfaB.png" align="middle"></img>';
			//document.getElementById("dspdescopt1").onclick = function(){location.href = "https://www.youtube.com";};
			//document.getElementById("dspdescopt2").innerHTML = '<img src = "https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.png"></img>';
			//document.getElementById("dspdescopt2").onclick = function(){location.href = "http://www.netfilx.com";};
		}
}

var arr = {};
const initStr = "0,t1:online_gaming;0,t2:nothing;0,t3:nothing;0,t4:nothing;0,t5:nothing;0,t6:nothing;0,t7:nothing;0,t8:nothing;1,t1:nothing;1,t2:nothing;1,t3:nothing;1,t4:nothing;1,t5:nothing;1,t6:nothing;1,t7:nothing;1,t8:nothing;2,t1:nothing;2,t2:nothing;2,t3:nothing;2,t4:nothing;2,t5:nothing;2,t6:nothing;2,t7:nothing;2,t8:nothing;3,t1:nothing;3,t2:nothing;3,t3:nothing;3,t4:nothing;3,t5:nothing;3,t6:nothing;3,t7:nothing;3,t8:nothing;4,t1:nothing;4,t2:nothing;4,t3:nothing;4,t4:nothing;4,t5:nothing;4,t6:nothing;4,t7:nothing;4,t8:nothing;5,t1:nothing;5,t2:nothing;5,t3:nothing;5,t4:nothing;5,t5:nothing;5,t6:nothing;5,t7:nothing;5,t8:nothing;6,t1:nothing;6,t2:nothing;6,t3:nothing;6,t4:nothing;6,t5:nothing;6,t6:nothing;6,t7:nothing;6,t8:nothing";

function getSites(){
    chrome.storage.sync.get('greensites',function(data){greensites = data.greensites;});
	chrome.storage.sync.get('redsites',function(data){redsites = data.redsites;});
}

function perc2color(perc) {
	var r, g, b = 55;
	if(perc < 4) {
		g = 220;
		r = 100;
	}
	else if(perc < 7) {
		r = 255;
		g = 160;
	}
	else {
		g = 55;
		r = 219;
	}
	var h = r * 0x10000 + g * 0x100 + b * 0x1;
	return '#' + ('000000' + h.toString(16)).slice(-6);
}

async function showTime(){
    var date = new Date();
    var h = date.getHours(); // 0 - 23
    var m = date.getMinutes(); // 0 - 59
    var session = "AM";
    
    if(h == 0){
        h = 12;
    }
    
    if(h > 12){
        h = h - 12;
        session = "PM";
    }
    
    h = (h < 10) ? "0" + h : h;
    m = (m < 10) ? "0" + m : m;
    
    var time = h + ":" + m + " " + session;
    document.getElementById("MyClockDisplay").innerText = time;
    document.getElementById("MyClockDisplay").textContent = time;

    // Weather changes
    const weathermod = await getWeather();
    document.getElementById("MyClockDisplay").style.color = perc2color(weathermod);
    console.log(greensites);
    console.log(redsites);
    updateRecs(weathermod);
    setTimeout(showTime, 30000);
    
}

function getColor(val){
	if(val =='disabled')
		return "accent-disabled";
	else if(val=='online_gaming')
		return "accent-cyan";
	else if(val=='video_streaming')
		return "accent-orange";
	else if(val=='audio_streaming')
		return "accent-orange";
	else if(val=='page_browsing')
		return "accent-green";
	else
		return "accent-empty";
}

function setArr(sstr){
	sstr.split(';').forEach(function(item){
		arr[item.split(':')[0].split(',')[0]][item.split(':')[0].split(',')[1]] = item.split(':')[1];
	});
	//refreshColors();
}

function constructTable(timeranges) {
    for (var item in timeranges)
		if(timeranges.hasOwnProperty(item)){
		    // constructing the content table
			for (var wday in dayOfWeek){
				let ddd = document.createElement('div');
				ddd.className = getColor(arr[wday][item]);
				ddd.oncontextmenu= function(){console.log(this.className); return false;};
				document.getElementById('dspgridgrid').appendChild(ddd);
			}
		}
}

function loadClock(){
	const weathermod = getWeather();
	if(weathermod == undefined){
		setTimeout(loadClock,10);
	}
	else{
		console.log(weathermod);
		document.getElementById("MyClockDisplay").style.color = perc2color(weathermod);
		console.log(weathermod);
		updateRecs(weathermod);
		
	}
}

window.onload = function(){
	//loadClock();
};

async function init(){
	
	for(var i in dayOfWeek)
	    arr[i] = {};
	let prom = new Promise((resolve,reject) =>{
		try{
			chrome.storage.sync.get('activity',function(data){
				resolve(data);
			});
		}
		catch(error){
			reject(error);
			console.log("activity from local");
		}
	});
	let result = await prom;
	console.log('done');
	console.log(result);
	setArr(result.activity);
	getSites();
    constructTable(timeranges);
    showTime();
}



initVars();