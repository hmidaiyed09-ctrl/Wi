// Web stub for react-native-vision-camera (native-only module)
import React from 'react';
import { View } from 'react-native';

export const Camera = (props) => React.createElement(View, props);
export const useCameraDevice = () => null;
export const useCameraPermission = () => ({
  hasPermission: false,
  canRequestPermission: false,
  requestPermission: () => Promise.resolve(false),
});
export const useObjectOutput = () => ({});
export const isScannedCode = (object) =>
  !!object && typeof object.value === 'string';
