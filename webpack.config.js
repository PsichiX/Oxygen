var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'bin');
var LIB_DIR = path.resolve(__dirname, 'src');

var config = {
  mode: 'production',
  entry: [
    '@babel/polyfill',
    LIB_DIR + '/index.js'
  ],
  module: {
    rules: [
      { test : /\.jsx?$/, include : LIB_DIR, loader : 'babel-loader' }
    ]
  },
  output: {
    path: BUILD_DIR,
    filename: 'oxygen-core.js',
    library: 'OxygenCore',
    libraryTarget: 'umd',
  },
  devtool: 'source-map',
};

module.exports = config;
