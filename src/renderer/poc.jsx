// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {Fragment} from 'react';
import Button from 'react-bootstrap/Button';

import 'bootstrap/dist/css/bootstrap.min.css';
import {ipcRenderer} from 'electron';

export default class POC extends React.PureComponent {
  constructor() {
    super();
    this.notifications = [];
    this.state = {active: 0};
  }

  selectTab = (tabIndex) => {
    return (() => {
      // eslint-disable-next-line react/no-set-state
      this.setState({active: tabIndex});
      ipcRenderer.send('switch-tabs', {tabIndex});
      Notification.requestPermission();
      // eslint-disable-next-line no-new
      const c = new Notification(`selecting tab ${tabIndex}`, {body: 'Selected!'});
      this.notifications.push(c);
    });
  };

  render() {
    return (
      <Fragment>
        <div>
          <Button
            variant={this.state.active === 0 ? 'secondary' : 'primary'}
            onClick={this.selectTab(0)}
          >{'Tab 1'}</Button>
          <Button
            variant={this.state.active === 1 ? 'secondary' : 'light'}
            onClick={this.selectTab(1)}
          >{'Tab 2'}</Button>
        </div>
        <div>
          {"This shouldn't be seen once loaded, useful for having a gif as a loader mimic?"}
        </div>
      </Fragment>
    );
  }
}