import React from 'react';

import ReactDOM from 'react-dom';

const content = document.getElementById('app');

ReactDOM.render(
  <POC window={remote.getCurrentWindow()} />,
  content,
);