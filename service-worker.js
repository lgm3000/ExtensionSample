// Copyright 2020 Max Wang.
// This source code is free-for-all.

'use strict';

var mute = true;

const channel = new BroadcastChannel('sw-messages');
console.log('Hello from service worker');

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  mute = true;
  if (event.action.startsWith('go to') ) {
    console.log("goto was clicked");
    console.log(event.action);
    var url = "https://"+event.action.substring(6)+".com";
    event.waitUntil(
        clients.matchAll({includeUncontrolled: true,type: 'window'}).then( windowClients => {
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
  } else if (event.action.startsWith('reset to') ) {
    console.log("reset was clicked");
    console.log(event.action);
    var url = "https://"+event.action.substring(9)+".com";
    event.waitUntil(
        clients.matchAll({includeUncontrolled: true,type: 'window'}).then( windowClients => {
            channel.postMessage({type: 'resetpage', val: url});
        })
    );
  } else if (event.action === 'lower') {
    console.log("trying to lower playback quality");
    channel.postMessage({type: 'lower'});
    
  } else if(event.action === 'disable') {
    // Main body of notification was clicked
    console.log("disabling notifications");
    let today = new Date();
    // muting notifications for 30 seconds 
    today.setSeconds( today.getSeconds() + 30);
    channel.postMessage({type: 'mute until', val: today});
  }
}, false);