// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let changeColor = document.getElementById('changeColor');

// on boot
chrome.storage.sync.get('ecostatus', function(data) {
		chrome.extension.getBackgroundPage().console.log(data.ecostatus);
		if (data.ecostatus == 'friendly'){
			changeColor.style.backgroundColor = '#3aa757';
			changeColor.setAttribute('value', '#3aa757');  
		}else{
			changeColor.style.backgroundColor = '#e8453c';
			changeColor.setAttribute('value', '#e8453c'); 
		}
	});

// refersh weather status every 1 second
setInterval(function(){ 
	chrome.storage.sync.get('ecostatus', function(data) {
		chrome.extension.getBackgroundPage().console.log(data.ecostatus);
		if (data.ecostatus == 'friendly'){
			changeColor.style.backgroundColor = '#3aa757';
			changeColor.setAttribute('value', '#3aa757');  
		}else{
			changeColor.style.backgroundColor = '#e8453c';
			changeColor.setAttribute('value', '#e8453c'); 
		}
	});
},1000);
