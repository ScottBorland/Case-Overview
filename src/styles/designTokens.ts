// Design tokens — 1c timeline warm palette

// ── Colours (oklch) ──────────────────────────────────────────────────
export const colors = {
  // App chrome — light warm header with red-orange accent
  appBg: 'oklch(0.97 0.005 70)',
  headerBg: 'oklch(0.995 0.005 70)',
  headerBorder: 'oklch(0.89 0.012 70)',
  headerPillBg: 'oklch(0.93 0.01 70)',
  headerText: 'oklch(0.25 0.02 50)',
  headerMuted: 'oklch(0.5 0.02 50)',
  headerPillText: 'oklch(0.35 0.02 50)',
  brandAccent: 'oklch(0.62 0.16 25)',

  // Interactive
  hoverBg: 'oklch(0.95 0.008 70)',

  // Sidebar
  sidebarBg: 'oklch(0.995 0.005 70)',

  // Borders — warm
  borderLight: 'oklch(0.89 0.012 70)',
  borderMedium: 'oklch(0.85 0.015 70)',
  borderOuter: 'oklch(0.87 0.012 70)',

  // Text — warm greys (hue 50)
  textPrimary: 'oklch(0.25 0.02 50)',
  textSecondary: 'oklch(0.3 0.02 50)',
  textMuted: 'oklch(0.5 0.02 50)',
  textMutedLight: 'oklch(0.55 0.02 50)',
  textDark: 'oklch(0.28 0.02 50)',

  // Category colours — unchanged
  hazardHigh: 'oklch(0.55 0.18 25)',
  hazardHighBg: 'oklch(0.55 0.18 25 / 0.08)',
  hazardHighBorder: 'oklch(0.55 0.18 25 / 0.32)',
  hazardHighThread: 'oklch(0.55 0.18 25 / 0.22)',

  hazardModerate: 'oklch(0.75 0.13 75)',
  hazardModerateText: 'oklch(0.6 0.13 75)',
  hazardModerateBorder: 'oklch(0.75 0.13 75 / 0.35)',
  hazardModerateThread: 'oklch(0.75 0.13 75 / 0.25)',

  hazardEmerging: 'oklch(0.6 0.15 145)',
  hazardEmergingText: 'oklch(0.5 0.15 145)',
  hazardEmergingBorder: 'oklch(0.6 0.15 145 / 0.32)',
  hazardEmergingThread: 'oklch(0.6 0.15 145 / 0.22)',

  hazardDefault: 'oklch(0.45 0.08 300)',
  hazardDefaultText: 'oklch(0.4 0.08 300)',
  hazardDefaultBorder: 'oklch(0.45 0.08 300 / 0.32)',
  hazardDefaultThread: 'oklch(0.45 0.08 300 / 0.22)',

  missingEpisode: 'oklch(0.55 0.12 250)',
  missingEpisodeText: 'oklch(0.5 0.12 250)',
  missingEpisodeBorder: 'oklch(0.55 0.12 250 / 0.32)',
  missingEpisodeThread: 'oklch(0.55 0.12 250 / 0.22)',

  assetPlus: 'oklch(0.5 0.16 300)',
  assetPlusText: 'oklch(0.45 0.16 300)',
  assetPlusBorder: 'oklch(0.5 0.16 300 / 0.32)',
  assetPlusThread: 'oklch(0.5 0.16 300 / 0.22)',

  intervention: 'oklch(0.55 0.16 145)',
  interventionText: 'oklch(0.45 0.16 145)',
  interventionBorder: 'oklch(0.55 0.16 145 / 0.32)',
  interventionThread: 'oklch(0.55 0.16 145 / 0.22)',

  offence: 'oklch(0.65 0.15 50)',
  offenceText: 'oklch(0.55 0.15 50)',
  offenceBorder: 'oklch(0.65 0.15 50 / 0.32)',
  offenceThread: 'oklch(0.65 0.15 50 / 0.22)',

  exclusion: 'oklch(0.45 0.03 250)',
  exclusionText: 'oklch(0.4 0.03 250)',
  exclusionBorder: 'oklch(0.45 0.03 250 / 0.32)',
  exclusionThread: 'oklch(0.45 0.03 250 / 0.22)',

  pdat: 'oklch(0.55 0.12 190)',
  pdatText: 'oklch(0.45 0.12 190)',
  pdatBorder: 'oklch(0.55 0.12 190 / 0.32)',
  pdatThread: 'oklch(0.55 0.12 190 / 0.22)',

  contact: 'oklch(0.55 0.12 160)',
  contactText: 'oklch(0.45 0.12 160)',
  contactBorder: 'oklch(0.55 0.12 160 / 0.32)',
  contactThread: 'oklch(0.55 0.12 160 / 0.22)',

  // Date axis — warm tint, full pill
  datePillBg: 'oklch(0.94 0.014 70)',
  datePillText: 'oklch(0.32 0.02 50)',
  dateConnector: 'oklch(0.85 0.012 70)',
  dateGapText: 'oklch(0.55 0.02 50)',

  // Risk-value red
  riskValue: 'oklch(0.55 0.18 25)',

  // Link/accent
  linkBlue: 'oklch(0.55 0.14 230)',
} as const;

// ── Typography ───────────────────────────────────────────────────────
export const font = {
  family: 'Manrope, Inter, system-ui, -apple-system, sans-serif',
} as const;

// ── Radius ───────────────────────────────────────────────────────────
export const radius = {
  navPill: 6,
  datePill: 20,
  nodeCard: 14,
  fullPill: 20,
  app: 10,
} as const;

// ── Node card shared styles ──────────────────────────────────────────
export const nodeCardBase: React.CSSProperties = {
  background: '#fff',
  borderRadius: radius.nodeCard,
  padding: '8px 12px',
  minWidth: 150,
  fontFamily: font.family,
  boxShadow: '0 1px 2px rgba(0,0,0,.04)',
};

export const nodeEyebrow: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: 0.4,
  textTransform: 'uppercase' as const,
  lineHeight: 1.4,
};

// Pill-shaped eyebrow: category bg, white text
export const nodeEyebrowPill = (categoryColor: string): React.CSSProperties => ({
  ...nodeEyebrow,
  display: 'inline-block',
  background: categoryColor,
  color: '#fff',
  borderRadius: radius.fullPill,
  padding: '2px 8px',
  marginBottom: 3,
});

export const nodeTitle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 12.5,
  color: colors.textPrimary,
  lineHeight: 1.35,
};

export const nodeDot = (color: string): React.CSSProperties => ({
  width: 9,
  height: 9,
  borderRadius: '50%',
  background: color,
  flexShrink: 0,
});
