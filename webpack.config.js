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
    alias: {
      'react-native$': 'react-native-web',
      'react-native-qrcode-svg$': path.resolve(
        __dirname,
        'web-stubs/react-native-qrcode-svg.js',
      ),
      'react-native-svg$': path.resolve(__dirname, 'web-stubs/react-native-svg.js'),
      'react-native-vision-camera$': path.resolve(
        __dirname,
        'web-stubs/vision-camera.js',
      ),
    },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules[\\/](?!react-native-web|@react-native)/,
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
    port: 3000,
    host: 'localhost',
  },
};
