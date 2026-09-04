// src/CreateNodesFromCSVs.ts
import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

import type { DateHeaderData } from './components/DateHeaderNode.js';
import type { HorizontalNodeData } from './components/HorizontalNode.js';
import type { RangeEndData } from './components/RangeEndNode.js';
import type { HazardNodeData } from './components/HazardNode.js';
import type { MissingEpisodeNodeData } from './components/MissingEpisodeNode.js';
import type { AssetPlusNodeData } from './components/AssetPlusNode.js';
import type { InterventionNodeData } from './components/InterventionNode.js';
import type { InterventionEndData } from './components/InterventionEndNode.js';
import type { OffenceNodeData } from './components/OffenceNode.js';
import type { GuideAnchorData } from './components/GuideAnchorNode.js';
import type { ExclusionNodeData } from './components/ExclusionNode.js';
import type { CondensedNodeData } from './components/CondensedNode.js';
import type { PdatNodeData } from './components/PdatNode.js';
import type { ContactNodeData } from './components/ContactNode.js';
import type { CraNodeData } from './components/CraNode.js';
import type { CraStartNodeData } from './components/CraStartNode.js';

import type { TimelineNodeData, TimelineGroup, TimelineItem } from './components/TimelineNode.js';

import { getHazardColourFromTitle } from './utils/hazardColours.js';
import { colors } from './styles/designTokens.js';

import type {
  PersonRow,
  HazardRow,
  MissingEpisodeRow,
  AssetPlusRow,
  InterventionRow,
  OffenceRow,
  ExclusionRow,
  PdatRow,
  ContactRow,
  CraRow,
  CsvRowBase,
} from './types/csv.js';

type AnyNodeData =
  | DateHeaderData
  | HorizontalNodeData
  | RangeEndData
  | HazardNodeData
  | MissingEpisodeNodeData
  | AssetPlusNodeData
  | InterventionNodeData
  | InterventionEndData
  | OffenceNodeData
  | GuideAnchorData
  | TimelineNodeData
  | ExclusionNodeData
  | CondensedNodeData
  | PdatNodeData
  | ContactNodeData
  | CraNodeData
  | CraStartNodeData;

type AnyNode = Node<AnyNodeData>;

export type TimelineOptions = {
  showHazards: boolean;
  showMissingEpisodes: boolean;
  showAssetPlus: boolean;
  showInterventions: boolean;
  showOffences: boolean;
  showExclusions: boolean;
  showPdats: boolean;
  showContacts: boolean;
  showCras: boolean;
  compactNodes?: boolean;
};

type TrackKind = 'point' | 'range';

type TrackConfig<Row extends CsvRowBase> = {
  id: string;
  enabled: boolean;
  kind: TrackKind;
  nodeType: string;
  startField: string;
  endField?: string;
  width: number;
  topPad?: number;
  stackGap?: number;
  laneGapAfter?: number;
  edgeColour?: (row: Row) => string;
  hasValidStart: (row: Row) => boolean;
};

const ONGOING_KEY = '__ONGOING__';
const STACK_GAP = 20;
const LANE_GAP_DEFAULT = 12;

function normalizeDateKey(raw?: string): string {
  const s = (raw ?? '').trim();
  if (!s || s === 'NaT' || s === 'Unknown' || s === 'NULL' || s === 'null') return '';

  const datePart = s.split(/\s+/)[0];

  // DD/MM/YYYY
  const ukMatch = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const day = ukMatch[1].padStart(2, '0');
    const month = ukMatch[2].padStart(2, '0');
    const year = ukMatch[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD
  const isoMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return '';
}

function parseDateForDiff(raw?: string): Date | null {
  const key = normalizeDateKey(raw);
  if (!key) return null;

  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const d = new Date(Date.UTC(year, month - 1, day));
  return isNaN(d.getTime()) ? null : d;
}

function formatDateLabel(dateKey: string): string {
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateKey;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const d = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const utcA = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const utcB = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((utcB - utcA) / MS_PER_DAY);
}

// Compact estimate now that cards are much shorter
function estimateCardHeight(row: Record<string, string | undefined>): number {
  const keys = Object.keys(row || {}).length;
  const base = 72;
  const perField = 6;
  const maxExtra = 28;
  return base + Math.min(keys * perField, maxExtra);
}

const COMPACT_CARD_HEIGHT = 34;
const HAZARD_STACK_EXTRA = 30;

function estimateLaneHeightPoint<Row extends CsvRowBase>(cfg: TrackConfig<Row>, rows: Row[], compact?: boolean): number {
  const cursorByStart = new Map<string, number>();
  let maxY = 0;
  const gap = cfg.stackGap ?? (compact ? 10 : STACK_GAP);

  for (const r of rows) {
    const startKey = normalizeDateKey((r as any)[cfg.startField]);
    if (!parseDateForDiff(startKey)) continue;

    const cur = cursorByStart.get(startKey) ?? 0;
    const h = (cfg.topPad ?? 0) + (compact ? COMPACT_CARD_HEIGHT : estimateCardHeight(r));
    const next = cur + h + gap;

    cursorByStart.set(startKey, next);
    if (next > maxY) maxY = next;
  }

  return maxY;
}

function estimateLaneHeightRange<Row extends CsvRowBase>(cfg: TrackConfig<Row>, rows: Row[], compact?: boolean, extraGap = 0): number {
  if (!cfg.endField) return 0;

  const cursorByStart = new Map<string, number>();
  const cursorByEnd = new Map<string, number>();
  let maxY = 0;
  const gap = (compact ? 10 : STACK_GAP) + extraGap;

  for (const r of rows) {
    const startKey = normalizeDateKey((r as any)[cfg.startField]);
    if (!parseDateForDiff(startKey)) continue;

    const endKey = normalizeDateKey((r as any)[cfg.endField]);
    const endKeyFinal = parseDateForDiff(endKey) ? endKey : ONGOING_KEY;

    const curStart = cursorByStart.get(startKey) ?? 0;
    const curEnd = cursorByEnd.get(endKeyFinal) ?? 0;

    const y = Math.max(curStart, curEnd);
    const h = (cfg.topPad ?? 0) + (compact ? COMPACT_CARD_HEIGHT : estimateCardHeight(r));
    const next = y + h + gap;

    cursorByStart.set(startKey, next);
    cursorByEnd.set(endKeyFinal, next);

    if (next > maxY) maxY = next;
  }

  return maxY;
}

export function createNodesFromPersonHazards(params: {
  person: PersonRow;
  hazards: HazardRow[];
  missingEpisodes: MissingEpisodeRow[];
  assetPlus: AssetPlusRow[];
  interventions: InterventionRow[];
  offences: OffenceRow[];
  exclusions: ExclusionRow[];
  pdats: PdatRow[];
  contacts: ContactRow[];
  cras: CraRow[];
  options: TimelineOptions;
}): { nodes: AnyNode[]; edges: Edge[]; timelineGroups: TimelineGroup[] } {
  const { person, hazards, missingEpisodes, assetPlus, interventions, offences, exclusions, pdats, contacts, cras, options } = params;

  const compact = options.compactNodes ?? false;
  const effectiveStackGap = compact ? 10 : STACK_GAP;
  const effectiveCardHeight = (row: CsvRowBase) => compact ? COMPACT_CARD_HEIGHT : estimateCardHeight(row);
  const effectiveNodeWidth = (cfgWidth: number) => compact ? 180 : cfgWidth;

  const nodes: AnyNode[] = [];
  const edges: Edge[] = [];
  const minYByDateKey = new Map<string, number>();
  const rowToNodeId = new Map<CsvRowBase, string>();
  const rowToEndNodeId = new Map<CsvRowBase, string>();

  function trackMaxY(dateKey: string, y: number, _height: number) {
    if (!minYByDateKey.has(dateKey) || y < minYByDateKey.get(dateKey)!) {
      minYByDateKey.set(dateKey, y);
    }
  }

  let xPos = 0;
  const baseY = 0;
  // Gap = left-edge to left-edge distance between consecutive date columns.
  // Must always exceed HEADER_WIDTH (200/300) so nodes never overlap.
  const xGapMin = compact ? 250 : 420;
  const xGapMax = compact ? 700 : 1600;
  // Linear scale: 0 days → min, 365 days → max
  function scaledGap(days: number) {
    return Math.round(xGapMin + Math.min(days, 365) / 365 * (xGapMax - xGapMin));
  }
  const xGapBase = compact ? 350 : 600;
  // In compact mode, date pill is ~21px tall; offset from baseY to date header
  const headerOffset = compact ? 50 : 80;

  const CASE_INFO_WIDTH = 420;
  const caseInfoX = compact ? -(CASE_INFO_WIDTH + 24) : 0;
  const floatingTopY = baseY - 100;
  const timelineWidth = 600;
  const timelineHeight = 600;
  const floatingGap = 24;
  const timelineX = caseInfoX - timelineWidth - floatingGap;

  const HEADER_WIDTH = compact ? 200 : 300;
  const END_WIDTH = 170;
  const COLUMN_CENTER_OFFSET = HEADER_WIDTH / 2;
  const COMPACT_NODE_WIDTH = 190;

  const HAZARD_WIDTH = 420;
  const EPISODE_WIDTH = 360;
  const ASSETPLUS_WIDTH = 360;
  const INTERVENTION_WIDTH = 360;
  const OFFENCE_WIDTH = 360;
  const EXCLUSION_WIDTH = 360;
  const PDAT_WIDTH = 360;
  const CONTACT_WIDTH = 360;
  const CRA_WIDTH = 360;

  const personExclude = new Set([
    'Case Number',
    'Full Name',
    'Date of Birth',
    'Current Age',
    'Gender',
    'Active Referral?',
    'Post Code',
    'Latest Allocated Worker',
  ]);

  const dynamicMeta = Object.fromEntries(
    Object.entries(person).filter(([key]) => !personExclude.has(key))
  );

  nodes.push({
    id: 'person-floating',
    type: 'caseInfoMovable',
    position: { x: caseInfoX, y: floatingTopY },
    data: {
      caseId: person['Case Number'] ?? '',
      fullName: person['Full Name'] ?? '',
      worker: person['Latest Allocated Worker'] ?? '',
      age: person['Current Age'] ?? '',
      gender: person['Gender'] ?? '',
      dob: person['Date of Birth'] ?? person['DoB'] ?? '',
      activeReferral: person['Active Referral?'] ?? person['Active Referral?_1'] ?? '',
      PostCode: person['Post Code'] ?? '',
      meta: dynamicMeta,
    } as any,
    draggable: true,
    selectable: true,
  });

  xPos = compact ? 0 : caseInfoX + xGapBase;

  const hazardTrack: TrackConfig<HazardRow> = {
    id: 'hazards',
    enabled: options.showHazards,
    kind: 'range',
    nodeType: 'hazard',
    startField: 'Date Hazard Started',
    endField: 'Date Hazard Ended',
    width: HAZARD_WIDTH,
    edgeColour: (h) => getHazardColourFromTitle(h['Hazard Type'] ?? ''),
    hasValidStart: (h) => !!parseDateForDiff(h['Date Hazard Started']),
    laneGapAfter: 24,
  };

  const episodeTrack: TrackConfig<MissingEpisodeRow> = {
    id: 'missingEpisodes',
    enabled: options.showMissingEpisodes,
    kind: 'point',
    nodeType: 'missingEpisode',
    startField: 'Missing Person Start Date',
    width: EPISODE_WIDTH,
    hasValidStart: (m) => !!parseDateForDiff(m['Missing Person Start Date']),
    laneGapAfter: 24,
  };

  const assetPlusTrack: TrackConfig<AssetPlusRow> = {
    id: 'assetPlus',
    enabled: options.showAssetPlus,
    kind: 'point',
    nodeType: 'assetPlus',
    startField: 'Start Date',
    width: ASSETPLUS_WIDTH,
    hasValidStart: (a) => !!parseDateForDiff(a['Start Date']),
    laneGapAfter: 24,
  };

  const interventionsTrack: TrackConfig<InterventionRow> = {
    id: 'interventions',
    enabled: options.showInterventions,
    kind: 'range',
    nodeType: 'intervention',
    startField: 'Start Date',
    endField: 'End Date',
    width: INTERVENTION_WIDTH,
    topPad: 48,
    edgeColour: () => 'rgba(22, 163, 74)',
    hasValidStart: (i) => !!parseDateForDiff(i['Start Date']),
    laneGapAfter: 24,
  };

  const offenceTrack: TrackConfig<OffenceRow> = {
    id: 'offences',
    enabled: options.showOffences,
    kind: 'point',
    nodeType: 'offence',
    startField: 'Offence Date',
    width: OFFENCE_WIDTH,
    hasValidStart: (o) => !!parseDateForDiff(o['Offence Date']),
    laneGapAfter: 24,
    topPad: 55,
  };

  const exclusionTrack: TrackConfig<ExclusionRow> = {
    id: 'exclusions',
    enabled: options.showExclusions,
    kind: 'range',
    nodeType: 'exclusion',
    startField: 'Start Date',
    endField: 'End Date',
    width: EXCLUSION_WIDTH,
    edgeColour: () => 'rgb(71, 85, 105)',
    hasValidStart: (x) => !!parseDateForDiff(x['Start Date']),
    laneGapAfter: 24,
  };

  const pdatTrack: TrackConfig<PdatRow> = {
    id: 'pdats',
    enabled: options.showPdats,
    kind: 'point',
    nodeType: 'pdat',
    startField: 'End Date',
    width: PDAT_WIDTH,
    hasValidStart: (p) => !!parseDateForDiff(p['End Date']),
    laneGapAfter: 24,
  };

  const contactTrack: TrackConfig<ContactRow> = {
    id: 'contacts',
    enabled: options.showContacts,
    kind: 'point',
    nodeType: 'contact',
    startField: 'contact_date',
    width: CONTACT_WIDTH,
    hasValidStart: (c) => !!parseDateForDiff(c['contact_date']),
    stackGap: 30,
    laneGapAfter: 24,
  };

  const craTrack: TrackConfig<CraRow> = {
    id: 'cras',
    enabled: options.showCras,
    kind: 'range',
    nodeType: 'cra',
    startField: 'Start Date',
    endField: 'Completed Date',
    width: CRA_WIDTH,
    hasValidStart: (c) => !!parseDateForDiff(c['Start Date']) || !!parseDateForDiff(c['Completed Date']),
    laneGapAfter: 24,
    topPad: -50,
  };

  const allTracks: Array<{ cfg: TrackConfig<any>; rows: CsvRowBase[] }> = [
    { cfg: craTrack, rows: cras },
    { cfg: hazardTrack, rows: hazards },
    { cfg: episodeTrack, rows: missingEpisodes },
    { cfg: assetPlusTrack, rows: assetPlus },
    { cfg: interventionsTrack, rows: interventions },
    { cfg: offenceTrack, rows: offences },
    { cfg: exclusionTrack, rows: exclusions },
    { cfg: pdatTrack, rows: pdats },
    { cfg: contactTrack, rows: contacts },
  ];

  // Track ID → category accent color (for end pills and date header dashes)
  const trackColor: Record<string, string> = {
    cras: colors.cra,
    hazards: colors.hazardHigh,
    missingEpisodes: colors.missingEpisode,
    assetPlus: colors.assetPlus,
    interventions: colors.intervention,
    offences: colors.offence,
    exclusions: colors.exclusion,
    pdats: colors.pdat,
    contacts: colors.contact,
  };

  // Collect which category colors appear under each dateKey
  const categoryColorsByDate = new Map<string, Set<string>>();
  function recordDateCategory(dateKey: string, color: string) {
    if (!categoryColorsByDate.has(dateKey)) categoryColorsByDate.set(dateKey, new Set());
    categoryColorsByDate.get(dateKey)!.add(color);
  }



  const activeTracks = allTracks
    .filter((t) => t.cfg.enabled)
    .map((t) => ({
      cfg: t.cfg,
      rows: t.rows.filter((r) => t.cfg.hasValidStart(r)),
    }))
    .filter((t) => t.rows.length > 0);

  // Collect dates from enabled tracks
  const dateKeys = new Set<string>();

  for (const { cfg, rows } of activeTracks) {
    for (const row of rows) {
      const startKey = normalizeDateKey((row as any)[cfg.startField]);
      if (parseDateForDiff(startKey)) dateKeys.add(startKey);

      if (cfg.kind === 'range' && cfg.endField) {
        const endKey = normalizeDateKey((row as any)[cfg.endField]);
        if (parseDateForDiff(endKey)) dateKeys.add(endKey);
      }
    }
  }

  const sortedDates = Array.from(dateKeys).sort((a, b) => a.localeCompare(b));
  if (sortedDates.length > 0) sortedDates.push(ONGOING_KEY);

  // Pre-compute gap to advance AFTER placing each column (keyed by the column we just placed)
  const gapAfterKey = new Map<string, number>();
  {
    const realDates = sortedDates.filter(k => k !== ONGOING_KEY);
    for (let i = 0; i < realDates.length; i++) {
      const cur = parseDateForDiff(realDates[i]);
      const next = i + 1 < realDates.length ? parseDateForDiff(realDates[i + 1]) : null;
      if (cur && next) {
        const diff = daysBetween(cur, next);
        gapAfterKey.set(realDates[i], scaledGap(diff));
      } else {
        gapAfterKey.set(realDates[i], xGapBase);
      }
    }
    gapAfterKey.set(ONGOING_KEY, xGapBase);
  }

  const dateToX = new Map<string, number>();
  const dateNodeInfo = new Map<string, { nodeId: string; centerX: number }>();

  let prevDateNodeId: string | null = null;
  let prevDateValue: Date | null = null;

  for (const dateKey of sortedDates) {
    const isOngoing = dateKey === ONGOING_KEY;
    const dateNodeId = isOngoing ? `date-ongoing` : `date-${dateKey}`;
    const currentDate = isOngoing ? null : parseDateForDiff(dateKey);

    dateToX.set(dateKey, xPos + COLUMN_CENTER_OFFSET);
    dateNodeInfo.set(dateKey, { nodeId: dateNodeId, centerX: xPos + COLUMN_CENTER_OFFSET });

    nodes.push({
      id: dateNodeId,
      type: 'dateHeader',
      position: { x: xPos, y: baseY - headerOffset },
      data: { label: isOngoing ? '📍 Ongoing' : `📅 ${formatDateLabel(dateKey)}`, originalY: baseY - headerOffset },
      style: { width: HEADER_WIDTH },
      draggable: false,
      selectable: false,
      zIndex: 10,
    });

    if (!isOngoing && prevDateNodeId && prevDateValue && currentDate) {
      const diff = daysBetween(prevDateValue, currentDate);
      edges.push({
        id: `${prevDateNodeId}__to__${dateNodeId}`,
        source: prevDateNodeId,
        target: dateNodeId,
        type: compact ? 'labelAbove' : 'smoothstep',
        sourceHandle: 'right',
        targetHandle: 'left',
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: '#64748b' },
        label: `${diff} day${diff === 1 ? '' : 's'}`,
        ...(compact ? {} : {
          labelBgPadding: [6, 4] as [number, number],
          labelBgBorderRadius: 6,
          labelStyle: { fontSize: 13, fontWeight: 400, fill: '#64748b', fontFamily: 'Inter, system-ui, sans-serif' },
        }),
        style: { stroke: '#64748b', strokeWidth: 3 },
      });
    }

    xPos += gapAfterKey.get(dateKey) ?? xGapBase;

    if (!isOngoing) {
      prevDateNodeId = dateNodeId;
      prevDateValue = currentDate;
    }
  }

  // Dynamic lane planning
  const laneOrder = ['cras', 'hazards', 'missingEpisodes', 'exclusions', 'assetPlus', 'interventions', 'offences', 'pdats', 'contacts'];
  const laneBaseYById = new Map<string, number>();
  let laneCursor = baseY;

  const orderedActiveTracks = laneOrder
    .map((id) => activeTracks.find((t) => t.cfg.id === id))
    .filter(Boolean) as Array<{ cfg: TrackConfig<any>; rows: CsvRowBase[] }>;

  for (const lane of orderedActiveTracks) {
    const { cfg, rows } = lane;

    laneBaseYById.set(cfg.id, laneCursor);

    const laneHeight =
      cfg.kind === 'point'
        ? estimateLaneHeightPoint(cfg as any, rows as any, compact)
        : estimateLaneHeightRange(cfg as any, rows as any, compact, cfg.id === 'hazards' ? HAZARD_STACK_EXTRA : 0);

    const gapAfter = cfg.laneGapAfter ?? LANE_GAP_DEFAULT;
    laneCursor += laneHeight + gapAfter;
  }

  // Hazards (kept special because of hazard-specific colours / end node)
  if (hazardTrack.enabled) {
    const rows = hazards
      .map((h, i) => ({ h, i }))
      .filter(({ h }) => hazardTrack.hasValidStart(h))
      .sort((a, b) => {
        const ad = parseDateForDiff(a.h['Date Hazard Started'])!.getTime();
        const bd = parseDateForDiff(b.h['Date Hazard Started'])!.getTime();
        if (ad !== bd) return ad - bd;

        const ae = parseDateForDiff(a.h['Date Hazard Ended'])?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const be = parseDateForDiff(b.h['Date Hazard Ended'])?.getTime() ?? Number.MAX_SAFE_INTEGER;
        if (ae !== be) return ae - be;

        return String(a.h['Hazard'] ?? '').localeCompare(String(b.h['Hazard'] ?? ''));
      });

    const bandY = laneBaseYById.get(hazardTrack.id) ?? baseY;
    const yCursorByStart = new Map<string, number>();

    for (const { h, i } of rows) {
      const startKey = normalizeDateKey(h['Date Hazard Started']);
      const endKey = normalizeDateKey(h['Date Hazard Ended']);
      const endKeyFinal = parseDateForDiff(endKey) ? endKey : ONGOING_KEY;

      const startCenterX = dateToX.get(startKey);
      const endCenterX = dateToX.get(endKeyFinal);
      if (startCenterX == null || endCenterX == null) continue;

      const currentCursor = yCursorByStart.get(startKey) ?? bandY;
      const y = currentCursor;

      const estHeight = effectiveCardHeight(h);
      yCursorByStart.set(startKey, y + estHeight + effectiveStackGap + HAZARD_STACK_EXTRA);
      trackMaxY(startKey, y, estHeight);

      const startId = `hazard-${i}`;
      const endId = `hazard-${i}-end`;
      rowToEndNodeId.set(h, endId);

      const edgeColour = hazardTrack.edgeColour ? hazardTrack.edgeColour(h) : '#64748b';
      recordDateCategory(startKey, edgeColour);
      recordDateCategory(endKeyFinal, edgeColour);

      nodes.push({
        id: startId,
        type: 'hazard',
        position: { x: startCenterX - effectiveNodeWidth(hazardTrack.width) / 2, y },
        data: { row: h } as any,
        draggable: true,
        selectable: true,
      });
      rowToNodeId.set(h, startId);

      // Invisible end node to preserve arrow positioning
      nodes.push({
        id: endId,
        type: 'rangeEnd',
        position: { x: endCenterX - END_WIDTH / 2, y },
        data: { kind: endKeyFinal === ONGOING_KEY ? 'ongoing' : 'end', categoryColor: edgeColour },
        draggable: false,
        selectable: false,
        zIndex: -1,
        style: { opacity: 0, pointerEvents: 'none' as const },
      });

      const startDate = parseDateForDiff(startKey)!;
      const endDate = parseDateForDiff(endKey);
      const ongoingDays = daysBetween(startDate, new Date());
      const label = endDate
        ? `${daysBetween(startDate, endDate)} day${daysBetween(startDate, endDate) === 1 ? '' : 's'}`
        : `${ongoingDays} day${ongoingDays === 1 ? '' : 's'}`;

      edges.push({
        id: `${startId}__to__${endId}`,
        source: startId,
        target: endId,
        type: 'smoothstep',
        sourceHandle: 'right',
        targetHandle: 'left',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: edgeColour,
        },
        label,
        labelBgPadding: [10, 6],
        labelBgBorderRadius: 10,
        labelBgStyle: {
          fill: '#ffffff',
          stroke: '#cbd5e1',
          strokeWidth: 1,
        },
        labelStyle: {
          fontSize: compact ? 9 : 15,
          fontWeight: 700,
          fill: '#111827',
        },
        style: { stroke: edgeColour },
      });
    }
  }

  // CRA custom rendering (start + completed nodes with connecting arrows)
  if (craTrack.enabled) {
    const sorted = cras
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => craTrack.hasValidStart(c))
      .sort((a, b) => {
        const ad = (parseDateForDiff(a.c['Start Date']) ?? parseDateForDiff(a.c['Completed Date']))!.getTime();
        const bd = (parseDateForDiff(b.c['Start Date']) ?? parseDateForDiff(b.c['Completed Date']))!.getTime();
        return ad - bd;
      });

    const bandY = laneBaseYById.get(craTrack.id) ?? baseY;
    const topPad = craTrack.topPad ?? 0;
    const yCursorByStart = new Map<string, number>();
    const yCursorByEnd = new Map<string, number>();
    const catColor = trackColor[craTrack.id] ?? colors.cra;

    for (const { c, i } of sorted) {
      const startKey = normalizeDateKey(c['Start Date']);
      const completedKey = normalizeDateKey(c['Completed Date']);

      const hasStart = !!parseDateForDiff(startKey);
      const hasCompleted = !!parseDateForDiff(completedKey);

      const startCenterX = hasStart ? dateToX.get(startKey) : undefined;
      const completedCenterX = hasCompleted ? dateToX.get(completedKey) : undefined;

      // Need at least one valid position
      if (startCenterX == null && completedCenterX == null) continue;

      // Calculate y position considering both columns
      const cursorStart = hasStart && startCenterX != null ? (yCursorByStart.get(startKey) ?? bandY) : bandY;
      const cursorEnd = hasCompleted && completedCenterX != null ? (yCursorByEnd.get(completedKey) ?? bandY) : bandY;
      const y = Math.max(cursorStart, cursorEnd);

      const estHeight = topPad + effectiveCardHeight(c);
      if (hasStart && startCenterX != null) {
        yCursorByStart.set(startKey, y + estHeight + effectiveStackGap);
        trackMaxY(startKey, y + topPad, estHeight);
        recordDateCategory(startKey, catColor);
      }
      if (hasCompleted && completedCenterX != null) {
        yCursorByEnd.set(completedKey, y + estHeight + effectiveStackGap);
        trackMaxY(completedKey, y + topPad, estHeight);
        recordDateCategory(completedKey, catColor);
      }

      const startId = `cras-start-${i}`;
      const completedId = `cras-${i}`;

      // Create start node
      if (hasStart && startCenterX != null) {
        nodes.push({
          id: startId,
          type: 'craStart',
          position: { x: startCenterX - effectiveNodeWidth(CRA_WIDTH) / 2, y: y + topPad },
          data: { row: c } as any,
          draggable: true,
          selectable: true,
        });
        rowToNodeId.set(c, startId);
      }

      // Create completed node
      if (hasCompleted && completedCenterX != null) {
        nodes.push({
          id: completedId,
          type: 'cra',
          position: { x: completedCenterX - effectiveNodeWidth(CRA_WIDTH) / 2, y: y + topPad },
          data: { row: c } as any,
          draggable: true,
          selectable: true,
        });
        if (!hasStart) rowToNodeId.set(c, completedId);
        rowToEndNodeId.set(c, completedId);
      }

      // Arrow connecting start → completed
      if (hasStart && hasCompleted && startCenterX != null && completedCenterX != null) {
        const startDate = parseDateForDiff(startKey)!;
        const endDate = parseDateForDiff(completedKey)!;
        const days = daysBetween(startDate, endDate);
        const label = `${days} day${days === 1 ? '' : 's'}`;

        edges.push({
          id: `${startId}__to__${completedId}`,
          source: startId,
          target: completedId,
          type: 'smoothstep',
          sourceHandle: 'right',
          targetHandle: 'left',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
            color: catColor,
          },
          label,
          labelBgPadding: [10, 6],
          labelBgBorderRadius: 10,
          labelBgStyle: {
            fill: '#ffffff',
            stroke: '#cbd5e1',
            strokeWidth: 1,
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
          },
          labelStyle: {
            fontSize: compact ? 9 : 15,
            fontWeight: 700,
            fill: '#111827',
          },
          style: { stroke: catColor },
        });
      }
    }
  }

  function renderPointTrack<Row extends CsvRowBase>(cfg: TrackConfig<Row>, rows: Row[]) {
    const sorted = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => cfg.hasValidStart(r))
      .sort((a, b) => {
        const ad = parseDateForDiff((a.r as any)[cfg.startField])!.getTime();
        const bd = parseDateForDiff((b.r as any)[cfg.startField])!.getTime();
        return ad - bd;
      });

    const yCursorByStart = new Map<string, number>();
    const bandY = laneBaseYById.get(cfg.id) ?? baseY;
    const topPad = cfg.topPad ?? 0;

    for (const { r, i } of sorted) {
      const startKey = normalizeDateKey((r as any)[cfg.startField]);
      const startCenterX = dateToX.get(startKey);
      if (startCenterX == null) continue;

      recordDateCategory(startKey, trackColor[cfg.id] ?? colors.textPrimary);

      const currentCursor = yCursorByStart.get(startKey) ?? bandY;
      const y = currentCursor;

      const estHeight = topPad + effectiveCardHeight(r);
      const gap = cfg.stackGap ?? effectiveStackGap;
      yCursorByStart.set(startKey, y + estHeight + gap);
      trackMaxY(startKey, y + topPad, estHeight);

      nodes.push({
        id: `${cfg.id}-${i}`,
        type: cfg.nodeType,
        position: { x: startCenterX - effectiveNodeWidth(cfg.width) / 2, y: y + topPad },
        data: { row: r } as any,
        draggable: true,
        selectable: true,
      });
      rowToNodeId.set(r, `${cfg.id}-${i}`);
    }
  }

  function renderRangeTrack<Row extends CsvRowBase>(cfg: TrackConfig<Row>, rows: Row[]) {
    if (!cfg.endField) return;

    const sorted = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => cfg.hasValidStart(r))
      .sort((a, b) => {
        const ad = parseDateForDiff((a.r as any)[cfg.startField])!.getTime();
        const bd = parseDateForDiff((b.r as any)[cfg.startField])!.getTime();
        return ad - bd;
      });

    const bandY = laneBaseYById.get(cfg.id) ?? baseY;
    const topPad = cfg.topPad ?? 0;

    const yCursorByStart = new Map<string, number>();
    const yCursorByEnd = new Map<string, number>();

    for (const { r, i } of sorted) {
      const startKey = normalizeDateKey((r as any)[cfg.startField]);
      const endKey = normalizeDateKey((r as any)[cfg.endField]);
      const endKeyFinal = parseDateForDiff(endKey) ? endKey : ONGOING_KEY;

      const startCenterX = dateToX.get(startKey);
      const endCenterX = dateToX.get(endKeyFinal);
      if (startCenterX == null || endCenterX == null) continue;

      const cursorStart = yCursorByStart.get(startKey) ?? bandY;
      const cursorEnd = yCursorByEnd.get(endKeyFinal) ?? bandY;
      const y = Math.max(cursorStart, cursorEnd);

      const estHeight = topPad + effectiveCardHeight(r);
      yCursorByStart.set(startKey, y + estHeight + effectiveStackGap);
      yCursorByEnd.set(endKeyFinal, y + estHeight + effectiveStackGap);
      trackMaxY(startKey, y + topPad, estHeight);

      const startId = `${cfg.id}-${i}`;
      const endId = `${cfg.id}-${i}-end`;
      rowToEndNodeId.set(r, endId);

      const catColor = trackColor[cfg.id] ?? colors.textPrimary;
      const edgeColour = cfg.edgeColour ? cfg.edgeColour(r) : '#475569';
      recordDateCategory(startKey, catColor);
      recordDateCategory(endKeyFinal, catColor);

      nodes.push({
        id: startId,
        type: cfg.nodeType,
        position: { x: startCenterX - effectiveNodeWidth(cfg.width) / 2, y: y + topPad },
        data: { row: r } as any,
        draggable: true,
        selectable: true,
      });
      rowToNodeId.set(r, startId);

      let endLabel: string | undefined;

      if (cfg.id === 'interventions') {
        const interventionType = ((r as any)['Intervention Type'] ?? '').toString().trim();
        endLabel = `${interventionType || 'Intervention'} ended`;
      }

      if (cfg.id === 'exclusions') {
        endLabel = 'Exclusion Ended';
      }

      const endNodeType =
        cfg.id === 'interventions'
          ? 'interventionEnd'
          : 'rangeEnd';

      nodes.push({
        id: endId,
        type: endNodeType,
        position: { x: endCenterX - END_WIDTH / 2, y },
        data:
          endNodeType === 'interventionEnd'
            ? ({ label: endKeyFinal === ONGOING_KEY ? 'Ongoing' : endLabel, categoryColor: catColor } as any)
            : ({
                kind: endKeyFinal === ONGOING_KEY ? 'ongoing' : 'end',
                label: endLabel,
                categoryColor: catColor,
              } as any),
        draggable: false,
        selectable: false,
        zIndex: -1,
      });

      const startDate = parseDateForDiff(startKey)!;
      const endDate = parseDateForDiff(endKey);
      const ongoingDays = daysBetween(startDate, new Date());
      const label = endDate
        ? `${daysBetween(startDate, endDate)} day${daysBetween(startDate, endDate) === 1 ? '' : 's'}`
        : `${ongoingDays} day${ongoingDays === 1 ? '' : 's'}`;

      edges.push({
        id: `${startId}__to__${endId}`,
        source: startId,
        target: endId,
        type: 'smoothstep',
        sourceHandle: 'right',
        targetHandle: 'left',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: edgeColour,
        },
        label,
        labelBgPadding: [10, 6],
        labelBgBorderRadius: 10,
        labelBgStyle: {
          fill: '#ffffff',
          stroke: '#cbd5e1',
          strokeWidth: 1,
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
        },
        labelStyle: {
          fontSize: compact ? 9 : 15,
          fontWeight: 700,
          fill: '#111827',
        },
        style: { stroke: edgeColour },
      });
    }
  }

  if (episodeTrack.enabled) renderPointTrack(episodeTrack, missingEpisodes);
  if (assetPlusTrack.enabled) renderPointTrack(assetPlusTrack, assetPlus);
  if (interventionsTrack.enabled) renderRangeTrack(interventionsTrack, interventions);
  if (offenceTrack.enabled) renderPointTrack(offenceTrack, offences);
  if (exclusionTrack.enabled) renderRangeTrack(exclusionTrack, exclusions);
  if (pdatTrack.enabled) renderPointTrack(pdatTrack, pdats);
  if (contactTrack.enabled) renderPointTrack(contactTrack, contacts);

  // Patch date header nodes with the collected category colors for their dashes
  for (const node of nodes) {
    if (node.type === 'dateHeader') {
      const dateKey = node.id.replace('date-', '');
      const catSet = categoryColorsByDate.get(dateKey);
      if (catSet && catSet.size > 0) {
        (node.data as any).categoryColors = Array.from(catSet);
      }
    }
  }

  function buildTimelineGroups(): TimelineGroup[] {
    const byDate = new Map<string, TimelineItem[]>();

    const add = (dateKey: string, item: TimelineItem) => {
      if (!dateKey) return;
      const arr = byDate.get(dateKey) ?? [];
      arr.push(item);
      byDate.set(dateKey, arr);
    };

    if (hazardTrack.enabled) {
      for (const h of hazards) {
        if (!hazardTrack.hasValidStart(h)) continue;
        const startKey = normalizeDateKey(h['Date Hazard Started']);
        const endKey = normalizeDateKey(h['Date Hazard Ended']);
        const hazardType = (h['Hazard Type'] ?? 'Hazard').toString().trim();

        add(startKey, {
          kind: 'Hazard',
          title: hazardType,
          row: h,
          excludeKeys: ['Case Number'],
          nodeId: rowToNodeId.get(h),
        });

        if (parseDateForDiff(endKey)) {
          add(endKey, {
            kind: 'Hazard ended',
            title: hazardType,
            row: h,
            excludeKeys: ['Case Number'],
            nodeId: rowToEndNodeId.get(h),
          });
        }
      }
    }

    if (episodeTrack.enabled) {
      for (const m of missingEpisodes) {
        if (!episodeTrack.hasValidStart(m)) continue;
        const startKey = normalizeDateKey(m['Missing Person Start Date']);
        add(startKey, {
          kind: 'Missing Episode',
          title: (m['REASON'] ?? '').toString().trim() || 'Unknown',
          row: m,
          excludeKeys: ['Case Number'],
          nodeId: rowToNodeId.get(m),
        });
      }
    }

    if (assetPlusTrack.enabled) {
      for (const a of assetPlus) {
        if (!assetPlusTrack.hasValidStart(a)) continue;
        const startKey = normalizeDateKey(a['Start Date']);
        add(startKey, {
          kind: 'Asset Plus',
          title: (a['Rosh judgement'] ?? '').toString().trim() ? `ROSH Judgement: ${(a['Rosh judgement'] ?? '').toString().trim()}` : 'Assessment',
          row: a,
          excludeKeys: ['Case Number'],
          nodeId: rowToNodeId.get(a),
        });
      }
    }

    if (interventionsTrack.enabled) {
      for (const itv of interventions) {
        if (!interventionsTrack.hasValidStart(itv)) continue;
        const startKey = normalizeDateKey(itv['Start Date']);
        const endKey = normalizeDateKey(itv['End Date']);
        const t = (itv['Intervention Type'] ?? 'Intervention').toString().trim();

        add(startKey, {
          kind: 'Intervention',
          title: t,
          row: itv,
          excludeKeys: ['Case Number'],
          nodeId: rowToNodeId.get(itv),
        });

        if (parseDateForDiff(endKey)) {
          add(endKey, {
            kind: 'Intervention ended',
            title: t,
            row: itv,
            excludeKeys: ['Case Number'],
            nodeId: rowToEndNodeId.get(itv),
          });
        }
      }
    }

    if (offenceTrack.enabled) {
      for (const o of offences) {
        if (!offenceTrack.hasValidStart(o)) continue;
        const startKey = normalizeDateKey(o['Offence Date']);
        add(startKey, {
          kind: 'Offence',
          title: (o['Offence'] ?? 'Offence').toString().trim(),
          row: o,
          excludeKeys: ['Case Number'],
          nodeId: rowToNodeId.get(o),
        });
      }
    }

    if (exclusionTrack.enabled) {
      for (const e of exclusions) {
        if (!exclusionTrack.hasValidStart(e)) continue;
        const startKey = normalizeDateKey(e['Start Date']);
        const endKey = normalizeDateKey(e['End Date']);
        const t = (e['Exclusion Reason'] ?? 'Exclusion').toString().trim();

        add(startKey, {
          kind: 'Exclusion',
          title: t,
          row: e,
          excludeKeys: ['Case Number'],
          nodeId: rowToNodeId.get(e),
        });

        if (parseDateForDiff(endKey)) {
          add(endKey, {
            kind: 'End Date',
            title: t,
            row: e,
            excludeKeys: ['Case Number'],
            nodeId: rowToEndNodeId.get(e),
          });
        }
      }
    }

    if (pdatTrack.enabled) {
      for (const p of pdats) {
        if (!pdatTrack.hasValidStart(p)) continue;
        const startKey = normalizeDateKey(p['End Date']);
        add(startKey, {
          kind: 'PDAT',
          title: p['instance_no'] ? `Stage ${(p['instance_no'] ?? '').toString().trim()}` : 'PDAT',
          row: p,
          excludeKeys: ['Case Number'],
          nodeId: rowToNodeId.get(p),
        });
      }
    }

    if (contactTrack.enabled) {
      const titleFields = ['title', 'Title', 'contact_type', 'Contact Type', 'type', 'Type'];
      for (const c of contacts) {
        if (!contactTrack.hasValidStart(c)) continue;
        const startKey = normalizeDateKey(c['contact_date']);
        const titleVal = titleFields.map(f => ((c as any)[f] ?? '').toString().trim()).find(v => v) || 'Contact';
        add(startKey, {
          kind: 'Contact',
          title: titleVal,
          row: c,
          excludeKeys: ['Case Number'],
          nodeId: rowToNodeId.get(c),
        });
      }
    }

    if (craTrack.enabled) {
      for (const c of cras) {
        if (!craTrack.hasValidStart(c)) continue;
        const sKey = normalizeDateKey(c['Start Date']);
        if (sKey && parseDateForDiff(sKey)) {
          add(sKey, {
            kind: 'ROTH Assessment Started',
            title: 'ROTH Assessment Started',
            row: c,
            excludeKeys: ['Case Number'],
            nodeId: rowToNodeId.get(c),
          });
        }
        const cKey = normalizeDateKey(c['Completed Date']);
        if (cKey && parseDateForDiff(cKey)) {
          add(cKey, {
            kind: 'ROTH Assessment Completed',
            title: 'ROTH Assessment Completed',
            row: c,
            excludeKeys: ['Case Number'],
            nodeId: rowToEndNodeId.get(c),
          });
        }
      }
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, items]) => ({
        dateKey,
        label: formatDateLabel(dateKey),
        items,
      }));
  }

  const timelineGroups = buildTimelineGroups();

  return { nodes, edges, timelineGroups };
}