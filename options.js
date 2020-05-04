// Copyright 2020 Max Wang.
// This source code is free-for-all.

// This module creates dropdowns for each activity against each time range
// (both defined in background.js), which will be modify-able in extension options

'use strict';
import {timeranges,leisureOptions,dayOfWeek,getForecast} from './background.js';

const initStr = "0,t1:online_gaming;0,t2:nothing;0,t3:nothing;0,t4:nothing;0,t5:nothing;0,t6:nothing;0,t7:nothing;0,t8:nothing;1,t1:nothing;1,t2:nothing;1,t3:nothing;1,t4:nothing;1,t5:nothing;1,t6:nothing;1,t7:nothing;1,t8:nothing;2,t1:nothing;2,t2:nothing;2,t3:nothing;2,t4:nothing;2,t5:nothing;2,t6:nothing;2,t7:nothing;2,t8:nothing;3,t1:nothing;3,t2:nothing;3,t3:nothing;3,t4:nothing;3,t5:nothing;3,t6:nothing;3,t7:nothing;3,t8:nothing;4,t1:nothing;4,t2:nothing;4,t3:nothing;4,t4:nothing;4,t5:nothing;4,t6:nothing;4,t7:nothing;4,t8:nothing;5,t1:nothing;5,t2:nothing;5,t3:nothing;5,t4:nothing;5,t5:nothing;5,t6:nothing;5,t7:nothing;5,t8:nothing;6,t1:nothing;6,t2:nothing;6,t3:nothing;6,t4:nothing;6,t5:nothing;6,t6:nothing;6,t7:nothing;6,t8:nothing";

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

var arr = {};

function refreshColors(){
	var children = document.getElementById('content').children;
	for (var i = 0; i < children.length; i++) {
		var contentChild = children[i];
		if(arr[contentChild.getAttribute('att-day')][contentChild.getAttribute('att-time')]=="disabled"){
			contentChild.className = "";
			contentChild.classList.add("accent-empty");
		    contentChild.classList.add("accent-disabled");
		}
		else{
			contentChild.classList.remove("accent-disabled");
			contentChild.className = getColor(arr[contentChild.getAttribute('att-day')][contentChild.getAttribute('att-time')]);
		}
		    
	}
}
function refreshSuggestions(day,time){
	// TODO: Sloppy
    var children = document.getElementById('aside').children;
    var contentchildren = document.getElementById('content').children;
    for (var i = 1; i < children.length; i+=2) {
    	var sd1 = children[i];
    	var sd2 = children[i+1];
    	  var item = sd1.getAttribute('att-time');
    	  var stylestr = '';
          if(time !=item)
            stylestr = stylestr + 'transform: scale(0.7,0.7);';
          if(document.querySelector('[att-day="'+day+'"][att-time="'+item+'"]').classList.contains('accent-disabled')) 
              stylestr = stylestr + 'opacity: 0.2;';
		  if(getForecast(day,item)>5){
            sd1.innerHTML = 'Read Books ' + getForecast(day,item);
            sd1.style = stylestr;
            sd2.innerHTML = '<img src="images/redWeather.png" style="display:block; max-width: 100%; max-height: 80%; display: block;object-fit: contain;' + stylestr + '"/>';
		  }else{
            sd1.innerHTML = 'do whatever ' + getForecast(day,item);
            sd1.style = stylestr;
            sd2.innerHTML = '<img src="images/greenWeather.png" style="display:block; max-width: 100%; max-height: 80%; display: block;object-fit: contain;' + stylestr + '"/>';
		  }
		  
    }
}


function syncActivities(){
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

function modalClose(modal,day,time,val) {
	console.log(day,time,val);
	arr[day][time] = val;
	modal.style.display = "none";
	refreshColors();
	syncActivities();
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
		  
		    // constructing the content table
			for (var wday in dayOfWeek){
				let ddd = document.createElement('div');
				ddd.className = getColor(arr[wday][item])
				ddd.setAttribute("att-day",wday);
				ddd.setAttribute("att-time",item);
				ddd.onclick = function(event){

				};
				ddd.oncontextmenu= function(){return false;};
				ddd.addEventListener('mouseenter',function(event) {
					refreshSuggestions(this.getAttribute('att-day'),this.getAttribute('att-time'));
				});
				ddd.addEventListener('dblclick', function(event) {
					if(this.classList.contains("accent-disabled")) return;
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
		  // constructing the preferred schedule
		  let sd1 = document.createElement('div');
		  let sd2 = document.createElement('div');
          
          sd1.setAttribute('att-time',item);
          sd2.getAttribute('att-time',item);
		  document.getElementById('aside').appendChild(sd1);
		  document.getElementById('aside').appendChild(sd2);
		}
	
	
	document.getElementById('aside').style.gridTemplateRows = '60px repeat('+Object.keys(timeranges).length+', 1fr)';;
	document.getElementById('time-interval').style.gridTemplateRows = 'repeat('+Object.keys(timeranges).length+', 1fr)';	
	document.getElementById('content').style.gridTemplateRows = 'repeat('+Object.keys(timeranges).length+', 1fr)';;
	
	var but = document.getElementById('savebutton');
	but.onclick = function(){
		
	};
 }


function initContent(){

};

function initHeaders(){
    var d1 = document.getElementById('week-names');
    var d2 = document.getElementById('time-interval');
    d1.onclick = function(event){event.preventDefault()};
    d2.onclick = function(event){event.preventDefault()};

}


var timeout = 500;


/****************************************Main*************/
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
//refreshColors();
initHeaders();

var Mdown = false;

function selstart(event){
	var c = document.getElementById('forefront');
	c.hidden = 0;
	var div = document.getElementById('selbox');
	div.x1 = event.clientX;
	div.y1 = event.clientY;
	div.x2 = event.clientX;
	div.y2 = event.clientY;
	var x3 = Math.min(div.x1,div.x2); //Smaller X
	var x4 = Math.max(div.x1,div.x2); //Larger X
	var y3 = Math.min(div.y1,div.y2); //Smaller Y
	var y4 = Math.max(div.y1,div.y2); //Larger Y
	div.style.left = x3 + 'px';
	div.style.top = y3 + 'px';
	div.style.width = x4 - x3 + 'px';
	div.style.height = y4 - y3 + 'px';
	div.setAttribute('mode','unknown');
	div.hidden = 0;
}
function selend(event){
	document.getElementById('selbox').hidden = 1;
	document.getElementById('forefront').hidden = 1;
}

onmousedown = function(e) {
	e.preventDefault();
    console.log("mousedown");
    if(e.button == 2){
    	console.log("right");
    	[...document.getElementById('content').children].forEach(function(element){
			var box = element.getBoundingClientRect();
			if (
			  (e.clientX < box.right) &&
			  (e.clientX > box.left) &&
			  (e.clientY < box.bottom) &&
			  (e.clientY > box.top)
			  ){
				if(arr[element.getAttribute('att-day')][element.getAttribute('att-time')]=="disabled"){
                    arr[element.getAttribute('att-day')][element.getAttribute('att-time')]="nothing";
				}else{
					arr[element.getAttribute('att-day')][element.getAttribute('att-time')]="disabled";
				}
				syncActivities();
				refreshColors();
			  }
		});
		return;
    }
    Mdown = true;
    setTimeout(function(){
    	if(Mdown){
    	    console.log("hold");
    	    selstart(e);
    	}
    }, timeout || 100);
};

onmouseup = function(e){
	Mdown = false;
	var div = document.getElementById('selbox');
	var rect = div.getBoundingClientRect();
	var x3 = rect.left;
	var x4 = rect.right;
	var y3 = rect.top;
	var y4 = rect.bottom;
	[...document.getElementById('content').children].forEach(function(element){
			var box = element.getBoundingClientRect();
			if (
			  !(x3 > box.right) &&
			  !(x4 < box.left) &&
			  !(y3 > box.bottom) &&
			  !(y4 < box.top)
			  ){
			  	if(div.getAttribute('mode')=='on')
			  	    arr[element.getAttribute('att-day')][element.getAttribute('att-time')]=arr[element.getAttribute('att-day')][element.getAttribute('att-time')]=="disabled"?"nothing":arr[element.getAttribute('att-day')][element.getAttribute('att-time')];
			  	else if(div.getAttribute('mode')=='off')
			  	    arr[element.getAttribute('att-day')][element.getAttribute('att-time')]="disabled";
				else if(arr[element.getAttribute('att-day')][element.getAttribute('att-time')]=="disabled"){
                    arr[element.getAttribute('att-day')][element.getAttribute('att-time')]="nothing";
				}else{
					arr[element.getAttribute('att-day')][element.getAttribute('att-time')]="disabled";
				}
				
			  }
		});
	syncActivities();
	selend();
};

var c = document.getElementById('forefront');

onmousemove = function(event){
	if(!c.hidden){
		console.log("haha");
		var div = document.getElementById('selbox');
		var rect = c.getBoundingClientRect();
		div.x2 = event.clientX;
		div.y2 = event.clientY;
		var x3 = Math.min(div.x1,div.x2); //Smaller X
		var x4 = Math.max(div.x1,div.x2); //Larger X
		var y3 = Math.min(div.y1,div.y2); //Smaller Y
		var y4 = Math.max(div.y1,div.y2); //Larger Y
		div.style.left = Math.max(x3,rect.left) + 'px';
		div.style.top = Math.max(y3,rect.top) + 'px';
		div.style.width = Math.min(x4,rect.right) - Math.max(x3,rect.left) + 'px';
		div.style.height = Math.min(y4,rect.bottom) - Math.max(y3,rect.top) + 'px';
		[...document.getElementById('content').children].forEach(function(element){
			var box = element.getBoundingClientRect();
			if (
			  !(x3 > box.right) &&
			  !(x4 < box.left) &&
			  !(y3 > box.bottom) &&
			  !(y4 < box.top)
			  ){
				if(arr[element.getAttribute('att-day')][element.getAttribute('att-time')]=="disabled"){
                    //arr[element.getAttribute('att-day')][element.getAttribute('att-time')]="nothing";
                    if(div.getAttribute('mode')=='unknown'){
                    	div.setAttribute('mode','on');
                    }
                    if(div.getAttribute('mode')=='on')
                        element.classList.remove("accent-disabled");
                    else if(div.getAttribute('mode')=='off')
					    element.classList.add("accent-disabled");
					else
					    element.classList.remove("accent-disabled");
				}else{
					//arr[element.getAttribute('att-day')][element.getAttribute('att-time')]="disabled";
					if(div.getAttribute('mode')=='unknown'){
                    	div.setAttribute('mode','off');
                    }

                    if(div.getAttribute('mode')=='on')
                        element.classList.remove("accent-disabled");
                    else if(div.getAttribute('mode')=='off')
					    element.classList.add("accent-disabled");
					else
                        element.classList.add("accent-disabled");
				}
				
			  }
		    else{
		    	if(arr[element.getAttribute('att-day')][element.getAttribute('att-time')]=="disabled"){
                    //arr[element.getAttribute('att-day')][element.getAttribute('att-time')]="nothing";
					element.classList.add("accent-disabled");
				}else{
					//arr[element.getAttribute('att-day')][element.getAttribute('att-time')]="disabled";
                    element.classList.remove("accent-disabled");
		        }
		    }
		});
	}
}
