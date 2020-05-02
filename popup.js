// Copyright 2020 Max Wang.
// This source code is free-for-all.

'use strict';

import {EnvImp,BEnvImp,getWeather} from './background.js';

let icon = document.getElementById('icon');

if(getWeather() > 5){
    icon.innerHTML = '<img src="images/redWeather.png" />';
} else{
	icon.innerHTML = '<img src="images/greenWeather.png" />';
}

icon.onclick = function(element) {
};