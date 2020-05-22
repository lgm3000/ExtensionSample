// Copyright 2020 Max Wang.
// This source code is free-for-all.

'use strict';

//import {EnvImp,BEnvImp,getWeather,pullForecast} from './background.js';

var timeranges = {};
var leisureOptions = {};
var dayOfWeek = {};

var csvstring = [];

let icon = document.getElementById('icon');
let exp  = document.getElementById('export');


function initVars(){
    chrome.runtime.sendMessage({type: "getVars"}, function(response) {
    	timeranges = response.timeranges;
    	leisureOptions = response.leisureOptions;
    	dayOfWeek = response.dayOfWeek;
    	main();
    });
}

function getWeather(){
    return new Promise(function(resolve){
    	chrome.runtime.sendMessage({type: "getWeather"}, function(response) {
    	    resolve(response.weather);
        });
    }); 

}

function getCSVLinkElement(arr){
    var link = document.createElement("a");
    link.download = "GreenShiftMetadata.csv";
    link.target = '_blank';
    console.log(arr[0]);
    console.log(arr[1]);
    var csv = [arr[0].join(','),arr[1].map(function(v){return v.join(',')}).join('\n')].join('\n');
    link.href = encodeURI("data:text/csv,"+csv);
    return link;
}

function exportData(){
	csvstring = [];
	chrome.storage.local.get(['score','forecast','notinfo'],function(data){
		data.score.split(';').forEach(function(item){
			var val = ['score',item.split(':')[0].split(',')[0],item.split(':')[0].split(',')[1],item.split(':')[1]];
			csvstring.push(val);
		});
		data.forecast.split(';').forEach(function(item){
			var val = ['forecast',item.split(':')[0].split(',')[0],item.split(':')[0].split(',')[1],item.split(':')[1]];
			csvstring.push(val);
		});
		data.notinfo.split(';').forEach(function(item){
			var val = ['not0',item.split(':')[0].split(',')[0],item.split(':')[0].split(',')[1],item.split(':')[1].split(',')[0]];
			csvstring.push(val);
			var val = ['not1',item.split(':')[0].split(',')[0],item.split(':')[0].split(',')[1],item.split(':')[1].split(',')[1]];
			csvstring.push(val);
			var val = ['not2',item.split(':')[0].split(',')[0],item.split(':')[0].split(',')[1],item.split(':')[1].split(',')[2]];
			csvstring.push(val);
			var val = ['not3',item.split(':')[0].split(',')[0],item.split(':')[0].split(',')[1],item.split(':')[1].split(',')[3]];
			csvstring.push(val);
		});
		var link = getCSVLinkElement([['type','day','time','val','order'],csvstring]);
        link.click();
	});
    
}

async function loadImage(){
    const weatherMod = await getWeather();
    console.log(weatherMod);
	if (weatherMod != undefined){
        console.log(weatherMod);
		if(weatherMod > 5){
			icon.innerHTML = '<img src="images/redWeather.png" />';
		} else{
			icon.innerHTML = '<img src="images/greenWeather.png" />';
		}
		icon.hidden = false;
	}else{
		setTimeout(loadImage,10);
	}
}

window.onload = function() {
	initVars();
}

function main(){
	loadImage();
	icon.onclick = function(element) {
		chrome.runtime.sendMessage({type: "pullForecast"}, function() {});
		loadImage();
	};
	exp = document.getElementById('export');
	exp.onclick = function(){exportData();};
}
