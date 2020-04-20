// Copyright 2020 Max Wang.
// This source code is free-for-all.

// This module creates dropdowns for each activity against each time range
// (both defined in background.js), which will be modify-able in extension options

'use strict';
import {timeranges,leisureOptions} from './background.js';

let dropdownSection = document.getElementById('dropdownSection');

let buttonSection = document.getElementById('buttonSubmit');


function constructDropdowns(timeranges,leisureOptions) {
  for (var item in timeranges)
    if(timeranges.hasOwnProperty(item)){
      let dd = document.createElement('div');
      dd.id = item;

      // Text for time range
      let divText = document.createElement('p'); 
      divText.innerHTML = timeranges[item];
      dd.appendChild(divText);

      // Options for what do to
      let dropdown = document.createElement('select');
      for (var lOption in leisureOptions) 
        if(leisureOptions.hasOwnProperty(lOption)){
          let dOption = document.createElement('option');
          dOption.value = lOption;
          dOption.text = leisureOptions[lOption];
          dropdown.appendChild(dOption);
      }
      dd.appendChild(dropdown);

      dropdownSection.appendChild(dd);
    }
}


function constructButton(timeranges) {
  let button = document.createElement('button');
  button.value = 'Save Changes';

  button.addEventListener('click', function() {
    var sstr = "";
    for (var item in timeranges) 
      if(timeranges.hasOwnProperty(item)){
        let tmp = document.getElementById(item).getElementsByTagName('select')[0];
        let activity = tmp.options[tmp.selectedIndex].value;
        sstr = sstr + item + ":" + activity + ";"
      }
    chrome.storage.sync.set({'activity': sstr}, function() {
      console.log('is set to ' + sstr);
    })
  });
  buttonSection.appendChild(button);
}

constructDropdowns(timeranges,leisureOptions);

constructButton(timeranges);
