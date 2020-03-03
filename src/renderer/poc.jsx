// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {Fragment} from 'react';
import Button from 'react-bootstrap/Button';

import 'bootstrap/dist/css/bootstrap.min.css';
import {ipcRenderer} from 'electron';

export default class POC extends React.PureComponent {
  selectTab = (tabIndex) => {
    return (() => {
      ipcRenderer.send('switch-tabs', {tabIndex});
    });
  };

  render() {
    return (
      <Fragment>
        <div>
          <Button onClick={this.selectTab(0)}>{'Tab 1'}</Button>
          <Button onClick={this.selectTab(1)}>{'Tab 2'}</Button>
        </div>
        <div>
          {"This shouldn't be seen"}
        </div>
      </Fragment>
    );
  }
}