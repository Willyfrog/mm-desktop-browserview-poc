# mattermost browserview proof of concept
  based on electron 6 (to match desktop), this aims to foresee basic changes on architecture and feature handling

  what's being checkec:
  - use of multiple browserviews to manage multiple connection to different servers. There is one there that is always unnaccessible as part of the test.
  - relationship between main and renderer processes once we move most of the handling to the main process (as oposed to webview tag that was on renderer)
  - notification management
  - input management

## Getting Started

The use of the [yarn](https://yarnpkg.com/) package manager is **strongly** recommended, as opposed to using `npm`.

### Development Scripts

```bash
# run application in development mode
yarn dev

# compile source code and create webpack output
yarn compile

# `yarn compile` & create build with electron-builder
yarn dist

# `yarn compile` & create unpacked build with electron-builder
yarn dist:dir
```

### Other

Thanks to the power of `electron-webpack` this template comes packed with...

* Use of [`webpack-dev-server`](https://github.com/webpack/webpack-dev-server) for development
* HMR for both `renderer` and `main` processes
* Use of [`babel-preset-env`](https://github.com/babel/babel-preset-env) that is automatically configured based on your `electron` version
* Use of [`electron-builder`](https://github.com/electron-userland/electron-builder) to package and build a distributable electron application

Make sure to check out [`electron-webpack`'s documentation](https://webpack.electron.build/) for more details.
