import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { name as appName } from './app.json';

const Root = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

AppRegistry.registerComponent(appName, () => Root);
AppRegistry.runApplication(appName, {
  rootTag: document.getElementById('root'),
});
