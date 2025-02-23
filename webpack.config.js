const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './netlify/functions/createBucket.js',
  target: 'node',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'createBucket.js',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'viewer', to: 'viewer' },
      ],
    }),
  ],
};
