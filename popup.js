// Copyright 2020 Max Wang.
// This source code is free-for-all.

'use strict';

import {EnvImp,BEnvImp} from './background.js';

let changeColor = document.getElementById('changeColor');

changeColor.style.backgroundColor = '#3aa757';
			changeColor.setAttribute('value', '#3aa757'); 

changeColor.onclick = function(element) {
  EnvImp = 0;
  BEnvImp = 0;
};