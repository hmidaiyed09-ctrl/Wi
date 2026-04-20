// Web stub for react-native-qrcode-svg
import React from 'react';
import { View, Text } from 'react-native';

const QRCode = ({ value, size = 100 }) =>
  React.createElement(View, {
    style: { width: size, height: size, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  }, React.createElement(Text, { style: { fontSize: 10, color: '#888', textAlign: 'center' } }, 'QR: ' + (value || '')));

export default QRCode;
