import { colors, font } from './designTokens.js';

export const nodeTextStyle = {
  color: colors.textPrimary,
  fontFamily: font.family,
};

export const nodeLabelStyle = {
  ...nodeTextStyle,
  fontWeight: 600,
  fontSize: 11,
  color: colors.textPrimary,
};

export const nodeValueStyle = {
  ...nodeTextStyle,
  fontWeight: 600,
  fontSize: 12.5,
  color: colors.textPrimary,
};
