// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import ReactDOM from 'react-dom';
import {remote} from 'electron';

import Poc from './poc.jsx';

const content = document.getElementById('app');

ReactDOM.render(
  <Poc window={remote.getCurrentWindow()}/>,
  content,
);