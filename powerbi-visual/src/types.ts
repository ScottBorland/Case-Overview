// src/types.ts — Shared types and design tokens for the Power BI visual
// Colours replicate the web app's designTokens.ts (oklch-based palette)

export type EventType =
  | "Hazard"
  | "MissingEpisode"
  | "AssetPlus"
  | "Intervention"
  | "Offence"
  | "Exclusion"
  | "PDAT"
  | "Contact"
  | "CRA";

export type HazardSeverity = "Significant" | "Moderate" | "Emerging" | "Default";

export interface RiskLevel {
  label: string;
  level: string;
}

export interface TimelineEvent {
  caseNumber: string;
  eventType: EventType;
  label: string;
  startDate: Date | null;
  endDate: Date | null;
  severity: HazardSeverity | string;
  details: string;
  risks?: RiskLevel[];
}

// ── Design tokens (matching the web app) ──

export const FONT = {
  family: "'Manrope', 'Inter', system-ui, -apple-system, sans-serif",
};

export const RADIUS = {
  nodeCard: 8,
  datePill: 7,
  fullPill: 20,
};

export const COLORS = {
  // App chrome
  appBg: "#f5f6f8",
  headerBg: "#1a2f3d",
  headerBorder: "#2a9d8f",
  headerAccent: "#2a9d8f",
  brandAccent: "#2a9d8f",

  // Text
  textPrimary: "#2a2e38",
  textSecondary: "#35394a",
  textMuted: "#6e7280",

  // Borders
  borderLight: "#e0e2e8",
  borderMedium: "#d4d7de",

  // Date pills
  datePillBg: "#dfe7f5",
  datePillText: "#2e3a5c",

  // Canvas
  canvasBg: "#ffffff",
  canvasDot: "#dede80",
};

// ── Category colour system (oklch approximations as hex for PBI compatibility) ──

export interface CategoryColours {
  solid: string;      // Main accent colour
  text: string;       // Text / eyebrow colour
  border: string;     // Border with opacity
  cardBg: string;     // Card background (white + subtle shadow)
  edge: string;       // Edge stroke
  minimap: string;    // Minimap dot
  eyebrowLabel: string; // Uppercase eyebrow text
}

export const CATEGORY_COLOURS: Record<EventType, CategoryColours> = {
  Hazard: {
    // Default/fallback — overridden per severity
    solid: "#7c5ba6",
    text: "#6b4a96",
    border: "rgba(124, 91, 166, 0.35)",
    cardBg: "#ffffff",
    edge: "#7c5ba6",
    minimap: "#ef4444",
    eyebrowLabel: "HAZARD",
  },
  MissingEpisode: {
    solid: "#4775c9",
    text: "#3a66b8",
    border: "rgba(71, 117, 201, 0.35)",
    cardBg: "#ffffff",
    edge: "#4775c9",
    minimap: "#3b82f6",
    eyebrowLabel: "MISSING EPISODE",
  },
  AssetPlus: {
    solid: "#8b3fd9",
    text: "#7a32c4",
    border: "rgba(139, 63, 217, 0.35)",
    cardBg: "#ffffff",
    edge: "#8b3fd9",
    minimap: "#a855f7",
    eyebrowLabel: "ASSET PLUS ASSESSMENT",
  },
  Intervention: {
    solid: "#2d9e5c",
    text: "#1f8a4a",
    border: "rgba(45, 158, 92, 0.35)",
    cardBg: "#ffffff",
    edge: "#2d9e5c",
    minimap: "#16a34a",
    eyebrowLabel: "INTERVENTION",
  },
  Offence: {
    solid: "#ea580c",
    text: "#c2410c",
    border: "rgba(234, 88, 12, 0.35)",
    cardBg: "#ffffff",
    edge: "#ea580c",
    minimap: "#f97316",
    eyebrowLabel: "OFFENCE",
  },
  Exclusion: {
    solid: "#5c6270",
    text: "#505563",
    border: "rgba(92, 98, 112, 0.35)",
    cardBg: "#ffffff",
    edge: "#5c6270",
    minimap: "#475569",
    eyebrowLabel: "EXCLUSION",
  },
  PDAT: {
    solid: "#2a8a7a",
    text: "#1f7568",
    border: "rgba(42, 138, 122, 0.35)",
    cardBg: "#ffffff",
    edge: "#2a8a7a",
    minimap: "#14b8a6",
    eyebrowLabel: "PDAT",
  },
  Contact: {
    solid: "#2d9e6e",
    text: "#1f8a5c",
    border: "rgba(45, 158, 110, 0.35)",
    cardBg: "#ffffff",
    edge: "#2d9e6e",
    minimap: "#10b981",
    eyebrowLabel: "YJ CONTACT",
  },
  CRA: {
    solid: "#3b4fbf",
    text: "#2f42a8",
    border: "rgba(59, 79, 191, 0.35)",
    cardBg: "#ffffff",
    edge: "#3b4fbf",
    minimap: "#6366f1",
    eyebrowLabel: "ROTH ASSESSMENT",
  },
};

// ── Hazard severity overrides ──

export interface HazardSeverityColours {
  solid: string;
  text: string;
  border: string;
  eyebrowSuffix: string;
}

export const HAZARD_SEVERITY: Record<HazardSeverity, HazardSeverityColours> = {
  Significant: {
    solid: "#c43030",
    text: "#c43030",
    border: "rgba(196, 48, 48, 0.35)",
    eyebrowSuffix: " · HIGH",
  },
  Moderate: {
    solid: "#cc9a20",
    text: "#a67d18",
    border: "rgba(204, 154, 32, 0.4)",
    eyebrowSuffix: " · MODERATE",
  },
  Emerging: {
    solid: "#3ba55c",
    text: "#2d8a48",
    border: "rgba(59, 165, 92, 0.35)",
    eyebrowSuffix: " · EMERGING",
  },
  Default: {
    solid: "#7c5ba6",
    text: "#6b4a96",
    border: "rgba(124, 91, 166, 0.35)",
    eyebrowSuffix: "",
  },
};
