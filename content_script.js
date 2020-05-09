'use strict'

var script = document.createElement('script');

script.textContent = `
/*
console.log("lol?");
console.log("js is a cunt");

setInterval(function(){
    var player = document.getElementById('movie_player');
    console.log(player.getPlaybackQuality());
    console.log(player.getAvailableQualityLevels());
},10000);
*/

window.addEventListener("message", function(event) {
  if (event.source != window)
      return;
  if (event.data.type && (event.data.type == "isVidfrombg")) {
      var vid = document.getElementsByTagName('video');
      console.log(vid);
      if (vid.length == 0){
        window.postMessage({
          type: "isVidtobg",
          isVid: false
        });
      } else{
        window.postMessage({
          type: "isVidtobg",
          isVid: true
        });
      }
      return;      
  }

  // only for youtube
  var player = document.getElementById('movie_player');
  var Qlist = player.getAttribute("originalQlist");
  if(Qlist==null){
    Qlist = player.getAvailableQualityLevels();
    player.setAttribute("originalQlist",Qlist);
  } else {
    Qlist = Qlist.split(',');
  }
  if (event.data.type && (event.data.type == "sendQfrombg")) {
      window.postMessage({
          type: "sendQtobg",
          cur: player.getPlaybackQuality(),
          ful: Qlist}, "*");
  }
  if (event.data.type && (event.data.type == "lowerVidQfrombg")) {
      for(var q in Qlist){
        if(!Qlist[q].startsWith('h') && Qlist[q]!='auto'){
          console.log('lowering qualcc');
          player.setPlaybackQualityRange([Qlist[q]]);
          return;
        }
      }
  }

  
});
`
console.log(script.textContent);
(document.head || document.documentElement).appendChild(script);
script.remove();

var isVid = false;

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;
  if (event.data.type && (event.data.type == "sendQtobg")) {
    // Sending messages to bg script
    chrome.runtime.sendMessage({type: "getQ", cur: event.data.cur, ful: event.data.ful }, function(response) {
      // TODO: validate response
    });
  }
  if (event.data.type && (event.data.type == "isVidtobg")) {
    isVid = event.data.isVid;
  }
}, false);

// receiving messages from bg script
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?  "from a content script:" + sender.tab.url : "from the extension");

    if (request.type == "sendQ"){
      sendResponse({farewell: "goodbye"});
      window.postMessage({
        type: "sendQfrombg"});
    }

    if (request.type == "lowerVidQ"){
      console.log('lowering qual');
      window.postMessage({type: "lowerVidQfrombg"});
      sendResponse({farewell: "goodbye"});
    }

    if (request.type == "isVid"){
      window.postMessage({
        type: "isVidfrombg"
      });
      console.log('checking if is vid' + isVid);
      sendResponse({isVid: isVid});
    }
      
  });
