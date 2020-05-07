// Copyright 2020 Max Wang.
// This source code is free-for-all.

'use strict';

//import {EnvImp,BEnvImp,getWeather,pullForecast} from './background.js';

var timeranges = {};
var leisureOptions = {};
var dayOfWeek = {};

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

let icon = document.getElementById('icon');

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
}
