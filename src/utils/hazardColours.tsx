import { colors } from '../styles/designTokens.js';

export type HazardSeverity = 'significant' | 'moderate' | 'emerging' | 'default';

export function getHazardSeverity(titleRaw: string): HazardSeverity {
  const normalized = (titleRaw || '').trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  const firstWord = normalized.split(' ')[0] || '';

  if (
    firstWord === 'significant' ||
    normalized.endsWith('- significant') ||
    normalized.includes(' - significant')
  ) return 'significant';

  if (
    firstWord === 'moderate' ||
    normalized.endsWith('- moderate') ||
    normalized.includes(' - moderate')
  ) return 'moderate';

  if (
    firstWord === 'emerging' ||
    normalized.endsWith('- emerging') ||
    normalized.includes(' - emerging')
  ) return 'emerging';

  return 'default';
}

export function getHazardColourFromTitle(titleRaw: string): string {
  const severity = getHazardSeverity(titleRaw);
  switch (severity) {
    case 'significant': return colors.hazardHigh;
    case 'moderate':    return colors.hazardModerate;
    case 'emerging':    return colors.hazardEmerging;
    default:            return colors.hazardDefault;
  }
}

export function getHazardTextColour(titleRaw: string): string {
  const severity = getHazardSeverity(titleRaw);
  switch (severity) {
    case 'significant': return colors.hazardHigh;
    case 'moderate':    return colors.hazardModerateText;
    case 'emerging':    return colors.hazardEmergingText;
    default:            return colors.hazardDefaultText;
  }
}

export function getHazardBorderColour(titleRaw: string): string {
  const severity = getHazardSeverity(titleRaw);
  switch (severity) {
    case 'significant': return colors.hazardHighBorder;
    case 'moderate':    return colors.hazardModerateBorder;
    case 'emerging':    return colors.hazardEmergingBorder;
    default:            return colors.hazardDefaultBorder;
  }
}

export function getHazardSeverityLabel(titleRaw: string): string {
  const severity = getHazardSeverity(titleRaw);
  switch (severity) {
    case 'significant': return 'High';
    case 'moderate':    return 'Moderate';
    case 'emerging':    return 'Emerging';
    default:            return '';
  }
}
