// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// eslint-disable-next-line import/no-commonjs
const {ipcRenderer} = require('electron');

console.log('loading preload');

const ignoreList = ['webpackClose', 'webappMessage'];

// this will just pass any message from the app to the ipcMain
// notice it will also catch messages from the server to the webapp
// we might want to figure out a way to filter those.
function handleMessage(event) {
  if (ignoreList.includes(event.data.type)) {
    return;
  }

  console.log('got a message to handle in the preload');
  console.log(event);
  ipcRenderer.send('webcontentsMessage', event.origin, event.data);
}

window.addEventListener('message', handleMessage);

// this function just gets the message from ipcMain and echoes it to the webapp
function sendMessage(event, msgType, msgData) {
  console.log('sending message to webapp ' + msgType);
  window.postMessage({
    type: msgType,
    message: msgData,
  }, window.location.origin);
}

ipcRenderer.on('webappMessage', sendMessage);