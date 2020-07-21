// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
'use strict';

import * as path from 'path';
import {format as formatUrl} from 'url';

import {app, BrowserWindow, ipcMain, Notification} from 'electron';

import {HKEY, enumerateValues, RegistryValueType} from 'registry-js';

//import {ToastNotification} from 'electron-windows-notifications';

import contextMenu from 'electron-context-menu';
import installExtension, {REACT_DEVELOPER_TOOLS} from 'electron-devtools-installer';

import {createServers, getActiveServer} from './mattermost.js';

const isDevelopment = process.env.NODE_ENV !== 'production';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;
const notificationList = []; // let's try to keep track of notifications

const ELECTRON_APP_ID = 'Mattermost.desktop_poc';

function createMainWindow() {
  contextMenu();

  if (process.platform === 'win32') {
    const version = enumerateValues(
      HKEY.HKEY_LOCAL_MACHINE,
      'SOFTWARE\\Microsoft\\Windows\\CurrentVersion',
    );
    for (const value of version) {
      if (value.type === RegistryValueType.REG_SZ) {
        const stringData = value.data;
        console.log(`Found: ${value.name} is ${stringData}`);
      } else if (value.type === RegistryValueType.REG_DWORD) {
        // 32-bit number is converted into a JS number
        const numberData = value.data;
        console.log(`Found: ${value.name} is ${numberData}`);
      }
    }
  }

  const window = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }});

  if (isDevelopment) {
    installExtension(
      REACT_DEVELOPER_TOOLS,
    ).then(
      (name) => console.log(`Added Extension:  ${name}`),
    ).catch((err) => console.log('An error occurred: ', err));
  }
  window.webContents.openDevTools({mode: 'undocked'});

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
  } else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true,
    }));
  }

  window.on('closed', () => {
    mainWindow = null;
  });

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  const serverConfig = [
    {name: 'community', serverUrl: 'https://community-daily.mattermost.com'},
    //{name: 'test', serverUrl: 'http://10.211.55.2:8065'},

    {name: 'rc', serverUrl: 'https://rc.test.mattermost.com'},
    {name: 'taco', serverUrl: 'https://subpath.test.mattermost.com'},
  ];

  //const serverConfig = [{name: 'community', serverUrl: 'https://community-release.mattermost.com'}];

  const servers = createServers(serverConfig, window);

  ipcMain.on('switch-tabs', (event, content) => {
    const {tabIndex} = content;
    if (typeof tabIndex !== 'undefined') {
      servers.forEach((server, index) => {
        if (index === tabIndex) {
          server.show(true);
        } else {
          server.hide();
        }
      });
    }
  });

  window.webContents.on('before-input-event',
    (event, input) => {
      // sendinputevent changes on electron v7
      // all webapp shortcuts should be listed here, since that would change
      // in the future it would be great to have that info from the webapp itself
      if (input.key === 'k' && (input.meta || input.control)) {
        event.preventDefault();
        const server = getActiveServer(servers);
        const keyCode = 'K';
        const modifiers = [];
        if (process.platform === 'darwin') {
          modifiers.push('meta');
        } else {
          modifiers.push('control');
        }
        server.sendKeyInputEvent({modifiers, keyCode});
      }
      if (input.key === 'j' && input.control) {
        const server = getActiveServer(servers);
        console.log('opening server devtools');
        server.switchDevTools();
      }
    });

  // sample notification
  const n = new Notification({
    title: 'Started!',
    subtitle: 'Dpoc started',
    body: 'hey this is a custom notification! with a lot of text to display',
    timeoutType: 'never',
  });
  n.on('click', () => {
    // hack: see https://github.com/electron/electron/issues/21610#issuecomment-569857509
    if (process.platform === 'win') {
      n.removeAllListeners(['click']);
    }
    console.log('user clicked on the notification');
    if (!window.isVisible()) {
      window.show();
    }
  });
  console.log('showing initial notification');
  n.show();

  notificationList.push(n);

  // const tn = new ToastNotification({
  //   appId: ELECTRON_APP_ID,
  //   template: `<toast><visual><binding template="ToastText01"><text id="1">%s</text></binding></visual></toast>`,
  //   strings: ['this is a sample toast notification'],
  // });

  // handle messages from webapp
  ipcMain.on('webcontentsMessage', (_event, origin, originalData) => {
    const data = {type: 'unknown', message: '', ...originalData};
    console.log(`Got an event:\n
    origin: ${origin}\n
    type: ${data.type}\n
    msg: ${data.message}
    `);
    servers.forEach((server) => {
      if (server.sameOrigin(origin)) {
        server.handleMessage(data);
      }
    });
  });

  return window;
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
});

app.setAppUserModelId(ELECTRON_APP_ID);
