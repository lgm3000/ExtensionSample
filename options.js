// Copyright 2020 Max Wang.
// This source code is free-for-all.

// This module creates dropdowns for each activity against each time range
// (both defined in background.js), which will be modify-able in extension options

'use strict';
import {timeranges,leisureOptions} from './background.js';

const dayOfWeek = {
	'0': 'Monday',
	'1': 'Tuesday',
	'2': 'Wednesday',
	'3': 'Thursday',
	'4': 'Friday',
	'5': 'Saturday',
	'6': 'Sunday'
}

const initStr = "0,t1:online_gaming;0,t2:nothing;0,t3:nothing;0,t4:nothing;0,t5:nothing;0,t6:nothing;0,t7:nothing;0,t8:nothing;1,t1:nothing;1,t2:nothing;1,t3:nothing;1,t4:nothing;1,t5:nothing;1,t6:nothing;1,t7:nothing;1,t8:nothing;2,t1:nothing;2,t2:nothing;2,t3:nothing;2,t4:nothing;2,t5:nothing;2,t6:nothing;2,t7:nothing;2,t8:nothing;3,t1:nothing;3,t2:nothing;3,t3:nothing;3,t4:nothing;3,t5:nothing;3,t6:nothing;3,t7:nothing;3,t8:nothing;4,t1:nothing;4,t2:nothing;4,t3:nothing;4,t4:nothing;4,t5:nothing;4,t6:nothing;4,t7:nothing;4,t8:nothing;5,t1:nothing;5,t2:nothing;5,t3:nothing;5,t4:nothing;5,t5:nothing;5,t6:nothing;5,t7:nothing;5,t8:nothing;6,t1:nothing;6,t2:nothing;6,t3:nothing;6,t4:nothing;6,t5:nothing;6,t6:nothing;6,t7:nothing;6,t8:nothing";

var arr = {};

function refreshColors(){
	var children = document.getElementById('content').children;
	for (var i = 0; i < children.length; i++) {
		var contentChild = children[i];
		if(arr[contentChild.getAttribute('att-day')][contentChild.getAttribute('att-time')]=='online_gaming')
			contentChild.className = "accent-cyan";
		else if(arr[contentChild.getAttribute('att-day')][contentChild.getAttribute('att-time')]=='video_streaming')
		    contentChild.className = "accent-orange";
		else if(arr[contentChild.getAttribute('att-day')][contentChild.getAttribute('att-time')]=='audio_streaming')
		    contentChild.className = "accent-orange";
		else if(arr[contentChild.getAttribute('att-day')][contentChild.getAttribute('att-time')]=='page_browsing')
		    contentChild.className = "accent-green";
		else
			contentChild.className = "accent-empty";
		
	}
}

function modalClose(modal,day,time,val) {
	console.log(day,time,val);
	arr[day][time] = val;
	modal.style.display = "none";
	refreshColors();
	var sstr = "";
	for (var dday in dayOfWeek) 
		if(dayOfWeek.hasOwnProperty(dday))
			for (var ttime in timeranges) 
				if(timeranges.hasOwnProperty(ttime))
					sstr = sstr + dday + "," + ttime + ":" + arr[dday][ttime] + ";"
	sstr = sstr.substring(0, sstr.length - 1);
    chrome.storage.sync.set({'activity': sstr}, function() {
		console.log('is set to ' + sstr);
    })
}

function setArr(sstr){
	sstr.split(';').forEach(function(item){
		arr[item.split(':')[0].split(',')[0]][item.split(':')[0].split(',')[1]] = item.split(':')[1];
	});
	refreshColors();
}

 function constructTable(timeranges) {
	var mC = document.getElementById("modal").getElementsByClassName("modal-content")[0];
	
	let zone = document.createElement('div');
	zone.className += "modal-options-box";
      for (var lOption in leisureOptions) 
        if(leisureOptions.hasOwnProperty(lOption)){
          let dOption = document.createElement('div');
          dOption.setAttribute("value",lOption);
          dOption.className += "modal-options";
          dOption.innerHTML = leisureOptions[lOption];
          zone.appendChild(dOption);
      }
    mC.appendChild(zone);
	
	for (var item in timeranges)
		if(timeranges.hasOwnProperty(item)){
			let dd = document.createElement('div');
			dd.innerHTML = timeranges[item];
			document.getElementById('time-interval').appendChild(dd);
		  
			for (var i = 0; i<7;i++){
				let ddd = document.createElement('div');
				ddd.className += "accent-empty";
				ddd.setAttribute("att-day",i);
				ddd.setAttribute("att-time",item);
				ddd.addEventListener('click', function(event) {
					event.preventDefault();
					var modal = document.getElementById("modal");
					var span = document.getElementById("modal-close");
					var day = this.getAttribute('att-day');
					var time = this.getAttribute('att-time');
					var modalContent = modal.getElementsByClassName("modal-content")[0];
					modalContent.getElementsByTagName("p")[0].innerHTML = 
						"What is your activity for " + 
						dayOfWeek[day] + ' ' +
						timeranges[time] +"?";
					
					var children = zone.children;
                    var val = arr[day][time];
					for (var i = 0; i < children.length; i++) {
						var opt = children[i];
						var value = opt.getAttribute("value");
						opt.onclick = function() {
							modalClose(modal,day,time,this.getAttribute("value"));
						};
						if (value == val)
							opt.className = "modal-options-sel";
						else
						    opt.className = "modal-options";
						
					}
					
					modal.style.display = "block";
					
					span.onclick = function() {
						modalClose(modal,day,time,val);
					}
					window.onclick = function(event) {
						if (event.target == modal) {
							modalClose(modal,day,time,val);
						}
					}
				})
				
				document.getElementById('content').appendChild(ddd);
		  }
		}
	
	document.getElementById('time-interval').style.gridTemplateRows = 'repeat('+Object.keys(timeranges).length+', 1fr)';	
	document.getElementById('content').style.gridTemplateRows = 'repeat('+Object.keys(timeranges).length+', 1fr)';;
	
 }

for(var i in dayOfWeek)
	arr[i] = {};
try{
    chrome.storage.sync.get('activity',function(data){
    	setArr(data.activity);
    });
}
catch(error){
    setArr(initStr);
}
constructTable(timeranges);
refreshColors();