// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable import/no-commonjs */
/* eslint-disable comma-dangle */
/* eslint-disable quotes */
/* eslint-disable indent */
/* eslint-disable semi */
/* eslint-disable func-names */

const merge = require('webpack-merge')

// module.exports = function(config) {
//   return merge.smart(config, {
//     module: {
//       rules: [
//         {
//           test: /\.js?$/,
//           loader: "babel-loader",
//           options: {
//             include: ["@babel/plugin-proposal-class-properties"]
//           }
//         }
//       ]
//     },
//     resolve: {
//         extensions: ['.js', '.jsx']
//       },
//   });
// }

module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader",
        options: {
          include: ["@babel/plugin-proposal-class-properties"]
        }
      }
    ]
  },
  resolve: {
      extensions: ['.js', 'jsx']
    }
};