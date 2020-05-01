const path = require('path');

module.exports = {
  entry: './lib/CompactDictionary.js',
  mode: 'production',
  output: {
    filename: './dist/freeyubin.js',
    path: path.resolve(__dirname, './'),
    library: 'freeyubin',
    libraryTarget: 'umd'
  }
};