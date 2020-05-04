// Copyright 2020 Max Wang.
// This source code is free-for-all.

'use strict';

import {EnvImp,BEnvImp,getWeather,pullForecast} from './background.js';

let icon = document.getElementById('icon');

function loadImage(){
    const weatherMod = getWeather();
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
	loadImage();
}

icon.onclick = function(element) {
	var weatherMod = getWeather();
	pullForecast();
	loadImage();
	console.log(weatherMod);
};