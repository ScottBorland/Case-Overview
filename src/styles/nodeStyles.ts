import { font } from './designTokens.js';

export const nodeTextStyle = {
  color: 'inherit',
  fontFamily: font.family,
};

export const nodeLabelStyle = {
  ...nodeTextStyle,
  fontWeight: 600,
  fontSize: 11,
};

export const nodeValueStyle = {
  ...nodeTextStyle,
  fontWeight: 600,
  fontSize: 12.5,
};
