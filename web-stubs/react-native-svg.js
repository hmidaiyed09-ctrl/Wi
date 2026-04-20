// Web stub for react-native-svg
import React from 'react';

const createSvgComponent = (name) => (props) => React.createElement('div', props);

export const Svg = createSvgComponent('Svg');
export const Rect = createSvgComponent('Rect');
export const Circle = createSvgComponent('Circle');
export const Path = createSvgComponent('Path');
export const G = createSvgComponent('G');
export const Text = createSvgComponent('Text');
export const Line = createSvgComponent('Line');

export default Svg;
