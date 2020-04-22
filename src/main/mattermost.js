// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import path from 'path';

import {BrowserView, app, Notification} from 'electron';
import contextMenu from 'electron-context-menu';
import log from 'electron-log';

const TAB_BAR_HEIGHT = 38;
const notificationList = [];

export class Server {
  constructor(name, serverUrl, browserWin) {
    this.name = name;
    this.url = new URL(serverUrl);
    const view = new BrowserView({
      webPreferences: {
        preload: path.resolve(__dirname, 'preload.js'),
        spellcheck: true,
      },
    });
    this.win = browserWin; // can it change??
    this.isVisible = false;
    this.view = view;

    view.webContents.on('dom-ready', () => {
      log.info('[' + name + '] dom-ready');
    });

    // explicitly setup the context menu for the contents
    contextMenu({window: view.webContents});

    view.webContents.on('did-fail-load', (event, errCode) => {
      log.info('[' + name + '] [' + errCode + '] failed loading: ' + event + '.');
    });

    view.webContents.on('did-finish-load', () => {
      log.info('[' + name + '] finished loading');
    });
  }

  load = (someURL) => {
    // on a real app we would want to check uf `someURL` is safe
    const loadURL = (typeof someURL === 'undefined') ? `${this.url}` : someURL;
    log.info(`[${this.name}] Loading ${loadURL}`);

    // copying what webview sends
    //const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.146 Electron/6.1.7 Safari/537.36 Mattermost/${app.getVersion()}`;
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.146 Safari/537.36';
    const loading = this.view.webContents.loadURL(loadURL, {userAgent});
    loading.then((result) => {
      log.info(`[${this.name}] finished loading ${loadURL}: ${result}`);
    }).catch((err) => {
      log.info(`[${this.name}] failed loading ${loadURL}: ${err}`);
    });
  }

  show = (requestedVisibility) => {
    const request = typeof requestedVisibility === 'undefined' ? true : requestedVisibility;
    if (request && !this.isVisible) {
      this.win.addBrowserView(this.view);
      this.setBounds(getWindowBoundaries(this.win));
    } else if (!request && this.isVisible) {
      this.win.removeBrowserView(this.view);
    }
    this.isVisible = request;
  }

  hide = () => {
    this.show(false);
  }

  setBounds = (boundaries) => {
    this.view.setBounds(boundaries);
    this.view.setAutoResize({
      height: true,
      width: true,
      horizontal: true,
      vertical: true,
    });
  }

  sameOrigin = (origin) => {
    const originURL = new URL(origin);
    return this.url.origin === originURL.origin;
  }

  // this is basic, some of this could be handled by the index or even the receiver,
  // but I'd like to move as much stuff from the server to its own process at some point,
  // so having the server be autonomous is crucial for that
  handleMessage = (data) => {
    const {type, message} = data;
    switch (type) {
    case 'webapp-ready': {
      // register with the webapp to enable custom integration functionality
      log.info(`registering into the webapp with version ${app.getVersion()}`);
      this.postMessage(
        'register-desktop',
        {
          version: app.getVersion(),
        },
      );
      break;
    }
    case 'dispatch-notification': {
      // this should be a separate module
      const {title, body, channel, teamId, silent} = message;
      log.info(`notification received: ${title}`);
      log.info(message);
      sendNotification(title, body, channel, teamId, silent, () => {
        log.info(`notification clicked, going to ${channel}`);
        this.postMessage('notification-clicked', {channel, teamId});
      });
      break;
    }
    }
  }
  postMessage = (msgType, msgData) => {
    this.view.webContents.send('webappMessage', msgType, msgData);
  }
  sendKeyInputEvent = (input) => {
    this.view.webContents.focus();
    this.view.webContents.sendInputEvent({type: 'keyDown', ...input});
    this.view.webContents.sendInputEvent({type: 'char', ...input});
    this.view.webContents.sendInputEvent({type: 'keyUp', ...input});
  }
  switchDevTools = () => {
    const wc = this.view.webContents;
    if (wc.isDevToolsOpened()) {
      wc.closeDevTools();
    } else {
      wc.openDevTools({mode: 'detach'});
    }
  }
}

const channelTypes = {
  O: 'Public',
  G: 'Group',
  P: 'Private',
  D: 'Direct',
};

// this should probably have its own module
// this also would allow us to choose between main notifications and renderer process (html5) notifications
export function sendNotification(title, body, channel, teamId, silent, clickCallback) {
  if (Notification.isSupported()) {
    const modTitle = `Title is: ${title}`;
    const options = {
      title: modTitle,
      body,
      silent,
      timeoutType: 'never',
    };
    if (channel) {
      if (channel.type === 'D') {
        options.subtitle = `from ${channel.display_name}`;
      } else {
        options.subtitle = channelTypes[channel.type];
      }
    }
    log.info('creating notification with options');
    const n = new Notification(options);

    n.on('click', (e) => {
      // hack: see https://github.com/electron/electron/issues/21610#issuecomment-569857509
      if (process.platform === 'win') {
        n.removeAllListeners(['click']);
      }
      this.win.show();
      log.info('notification clicked');
      if (typeof clickCallback !== 'undefined') {
        clickCallback(e);
      }
    });
    notificationList.push(n); // without ever removing them, this can cause problems, but this is only a PoC
    log.info(`notification added to the list: ${notificationList.length}`);

    n.show();
  } else {
    log.info('notifications are not supported');
  }
}

export function createServers(serverConfig, win) {
  const servers = serverConfig.map(({name, serverUrl}) => {
    return new Server(name, serverUrl, win);
  });

  const boundaries = getWindowBoundaries(win);
  initialLoad(servers);
  setServersBounds(servers, boundaries);
  return servers;
}

export function getWindowBoundaries(win) {
  const {width, height} = win.getContentBounds();
  return {
    x: 0,
    y: TAB_BAR_HEIGHT,
    width,
    height: height - TAB_BAR_HEIGHT,
  };
}

function initialLoad(servers) {
  log.info('loading servers');
  servers.forEach((server, index) => {
    if (index === 0) {
      server.show();
    } else {
      server.hide();
    }
    server.load();
  });
}

function setServersBounds(servers, boundary) {
  servers.forEach((server) => {
    server.setBounds(boundary);
  });
}

export function getActiveServer(servers) {
  for (let index = 0; index < servers.length; index++) {
    const server = servers[index];
    if (server.isVisible) {
      return server;
    }
  }
  throw new Error('No visible server');
}
