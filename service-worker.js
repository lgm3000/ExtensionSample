// Copyright 2020 Max Wang.
// This source code is free-for-all.

'use strict';

const channel = new BroadcastChannel('sw-messages');
console.log('Hello from service worker');

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  let today = new Date();
  if (event.action.startsWith('go to') ) {
    console.log("goto was clicked");
    console.log(event.action);
    var url = "https://"+event.action.substring(6)+".com";
    event.waitUntil(
        clients.matchAll({includeUncontrolled: true,type: 'window'}).then( windowClients => {
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                clients.openWindow(url);
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
    // muting notifications for 30 minutes 
    today.setSeconds( today.getSeconds() + 1800);
    channel.postMessage({type: 'mute until', val: today});
    return;
  }
  today.setSeconds( today.getSeconds() + 300);
  channel.postMessage({type: 'mute until', val: today});
  return;

}, false);