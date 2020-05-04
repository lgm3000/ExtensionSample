// Copyright 2020 Max Wang.
// This source code is free-for-all.

'use strict';

var mute = true;

const channel = new BroadcastChannel('sw-messages');
console.log('Hello from service worker');

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  mute = true;
  if (event.action === 'go to site') {
    console.log("hahahoho was clicked");
    var url = "https://youtube.com";
    event.waitUntil(
        clients.matchAll({includeUncontrolled: true,type: 'window'}).then( windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // If so, just focus it.
                console.log(client.url);
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
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