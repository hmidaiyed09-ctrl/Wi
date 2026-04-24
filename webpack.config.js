const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  cache: {
    type: 'filesystem',
  },
  entry: path.resolve(__dirname, 'index.web.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    conditionNames: ['browser', 'require', 'default'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-vision-camera': false,
      'react-native-vision-camera-worklets': false,
      'react-native-worklets-core': false,
      'react-native-qrcode-svg': false,
      'react-native-svg': false,
    },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules\/(?!react-native-web|@react-native|@firebase|firebase|idb)/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: ['@react-native/babel-preset'],
            plugins: ['react-native-web'],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'index.html'),
    }),
  ],
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    hot: true,
    port: 8080,
  },
};
