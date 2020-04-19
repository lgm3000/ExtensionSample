// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
var weather = true;

function show() {
  var time = /(..)(:..)/.exec(new Date());     // The prettyprinted time.
  var hour = time[1] % 12 || 12;               // The prettyprinted hour.
  var period = time[1] < 12 ? 'a.m.' : 'p.m.'; // The period of the day.
  new Notification(hour + time[2] + ' ' + period, {
    icon: 'images/128.png',
    body: 'Fossil fuels are now dominating the UK energy grid!'
  });
}

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({ecostatus: 'friendly'}, function() {
    console.log('The current ecostatus is eco-friendly.');
  });
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {schemes:['https']},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

// Refreshes weather status every 3 seconds.
// TODO: in reality interval should be longer, as this refresh is not (and should not be)
// very time-sensitive.
// TODO: should not be using the sync method, since weather information does not
// need to be synced across devices.
setInterval(function(){ 
	// Using RNG to generate weather changes - in the final version should be pulling
	// actual data
	var rnd = Math.random();
	console.log('Checking weather in London.' + String(rnd));
	
	// 20% weather change
	if( rnd > 0.5){
		if(weather == true){
			weather = false;
			chrome.storage.sync.set({ecostatus: 'unfriendly'}, function() {
				console.log('The current ecostatus is not eco-friendly.');
			});
			//alert("Fossil fuels are now dominating the UK energy grid!");
			show();
		} else{
			weather = true;
			chrome.storage.sync.set({ecostatus: 'friendly'}, function() {
				console.log('The current ecostatus is eco-friendly.');
			});
		}
	}
}, 3000);
