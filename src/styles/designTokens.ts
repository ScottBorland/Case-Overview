// Design tokens from the Clinical/Enterprise redesign (direction 1a)

// ── Colours (oklch) ──────────────────────────────────────────────────
export const colors = {
  // App chrome
  appBg: 'oklch(0.98 0.003 250)',
  headerBg: 'oklch(0.24 0.04 255)',
  headerBorder: 'oklch(0.3 0.03 255)',
  headerPillBg: 'oklch(0.3 0.03 255)',
  headerText: '#fff',
  headerMuted: 'oklch(0.8 0.02 255)',
  headerPillText: 'oklch(0.75 0.01 255)',
  brandAccent: 'oklch(0.65 0.14 230)',

  // Interactive
  hoverBg: 'oklch(0.96 0.003 250)',

  // Sidebar
  sidebarBg: 'oklch(0.995 0.002 250)',

  // Borders
  borderLight: 'oklch(0.9 0.006 250)',
  borderMedium: 'oklch(0.87 0.008 250)',
  borderOuter: 'oklch(0.89 0.006 250)',

  // Text
  textPrimary: 'oklch(0.25 0.02 250)',
  textSecondary: 'oklch(0.28 0.02 250)',
  textMuted: 'oklch(0.5 0.01 250)',
  textMutedLight: 'oklch(0.55 0.01 250)',
  textDark: 'oklch(0.3 0.02 250)',

  // Category colours — used for dots, eyebrows, borders, lane threads
  hazardHigh: 'oklch(0.55 0.18 25)',
  hazardHighBg: 'oklch(0.55 0.18 25 / 0.08)',
  hazardHighBorder: 'oklch(0.55 0.18 25 / 0.35)',
  hazardHighThread: 'oklch(0.55 0.18 25 / 0.25)',

  hazardModerate: 'oklch(0.75 0.13 75)',
  hazardModerateText: 'oklch(0.6 0.13 75)',
  hazardModerateBorder: 'oklch(0.75 0.13 75 / 0.4)',
  hazardModerateThread: 'oklch(0.75 0.13 75 / 0.3)',

  hazardEmerging: 'oklch(0.6 0.15 145)',
  hazardEmergingText: 'oklch(0.5 0.15 145)',
  hazardEmergingBorder: 'oklch(0.6 0.15 145 / 0.35)',
  hazardEmergingThread: 'oklch(0.6 0.15 145 / 0.25)',

  hazardDefault: 'oklch(0.45 0.08 300)',
  hazardDefaultText: 'oklch(0.4 0.08 300)',
  hazardDefaultBorder: 'oklch(0.45 0.08 300 / 0.35)',
  hazardDefaultThread: 'oklch(0.45 0.08 300 / 0.25)',

  missingEpisode: 'oklch(0.55 0.12 250)',
  missingEpisodeText: 'oklch(0.5 0.12 250)',
  missingEpisodeBorder: 'oklch(0.55 0.12 250 / 0.35)',
  missingEpisodeThread: 'oklch(0.55 0.12 250 / 0.2)',

  assetPlus: 'oklch(0.5 0.16 300)',
  assetPlusText: 'oklch(0.45 0.16 300)',
  assetPlusBorder: 'oklch(0.5 0.16 300 / 0.35)',
  assetPlusThread: 'oklch(0.5 0.16 300 / 0.2)',

  intervention: 'oklch(0.55 0.16 145)',
  interventionText: 'oklch(0.45 0.16 145)',
  interventionBorder: 'oklch(0.55 0.16 145 / 0.35)',
  interventionThread: 'oklch(0.55 0.16 145 / 0.2)',

  offence: 'oklch(0.65 0.15 50)',
  offenceText: 'oklch(0.55 0.15 50)',
  offenceBorder: 'oklch(0.65 0.15 50 / 0.35)',
  offenceThread: 'oklch(0.65 0.15 50 / 0.2)',

  exclusion: 'oklch(0.45 0.03 250)',
  exclusionText: 'oklch(0.4 0.03 250)',
  exclusionBorder: 'oklch(0.45 0.03 250 / 0.35)',
  exclusionThread: 'oklch(0.45 0.03 250 / 0.2)',

  pdat: 'oklch(0.55 0.12 190)',
  pdatText: 'oklch(0.45 0.12 190)',
  pdatBorder: 'oklch(0.55 0.12 190 / 0.35)',
  pdatThread: 'oklch(0.55 0.12 190 / 0.2)',

  contact: 'oklch(0.55 0.12 160)',
  contactText: 'oklch(0.45 0.12 160)',
  contactBorder: 'oklch(0.55 0.12 160 / 0.35)',
  contactThread: 'oklch(0.55 0.12 160 / 0.2)',

  // Date axis
  datePillBg: 'oklch(0.94 0.03 235)',
  datePillText: 'oklch(0.3 0.05 255)',
  dateConnector: 'oklch(0.85 0.008 250)',
  dateGapText: 'oklch(0.55 0.01 250)',

  // Risk-value red
  riskValue: 'oklch(0.55 0.18 25)',

  // Link/accent
  linkBlue: 'oklch(0.55 0.14 230)',
} as const;

// ── Typography ───────────────────────────────────────────────────────
export const font = {
  family: 'Inter, system-ui, -apple-system, sans-serif',
} as const;

// ── Radius ───────────────────────────────────────────────────────────
export const radius = {
  navPill: 6,
  datePill: 7,
  nodeCard: 8,
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
};

export const nodeEyebrow: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: 0.4,
  textTransform: 'uppercase' as const,
  lineHeight: 1.4,
};

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
