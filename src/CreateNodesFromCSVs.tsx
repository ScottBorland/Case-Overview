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

import type { TimelineNodeData, TimelineGroup, TimelineItem } from './components/TimelineNode.js';

import { getHazardColourFromTitle } from './utils/hazardColours.js';

import type {
  PersonRow,
  HazardRow,
  MissingEpisodeRow,
  AssetPlusRow,
  InterventionRow,
  OffenceRow,
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
  | TimelineNodeData;

type AnyNode = Node<AnyNodeData>;

export type TimelineOptions = {
  showHazards: boolean;
  showMissingEpisodes: boolean;
  showAssetPlus: boolean;
  showInterventions: boolean;
  showOffences: boolean;
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
  laneGapAfter?: number;
  edgeColour?: (row: Row) => string;
  hasValidStart: (row: Row) => boolean;
};

const ONGOING_KEY = '__ONGOING__';
const STACK_GAP = 25;
const LANE_GAP_DEFAULT = 28;

function normalizeDateKey(raw?: string): string {
  const s = (raw ?? '').trim();
  if (!s || s === 'NaT' || s === 'Unknown') return '';
  return s.endsWith(' 00:00:00') ? s.slice(0, 10) : s;
}

function parseDateForDiff(raw?: string): Date | null {
  const clean = normalizeDateKey(raw);
  if (!clean) return null;
  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
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

function estimateLaneHeightPoint<Row extends CsvRowBase>(cfg: TrackConfig<Row>, rows: Row[]): number {
  const cursorByStart = new Map<string, number>();
  let maxY = 0;

  for (const r of rows) {
    const startKey = normalizeDateKey((r as any)[cfg.startField]);
    if (!parseDateForDiff(startKey)) continue;

    const cur = cursorByStart.get(startKey) ?? 0;
    const h = (cfg.topPad ?? 0) + estimateCardHeight(r);
    const next = cur + h + STACK_GAP;

    cursorByStart.set(startKey, next);
    if (next > maxY) maxY = next;
  }

  return maxY;
}

function estimateLaneHeightRange<Row extends CsvRowBase>(cfg: TrackConfig<Row>, rows: Row[]): number {
  if (!cfg.endField) return 0;

  const cursorByStart = new Map<string, number>();
  const cursorByEnd = new Map<string, number>();
  let maxY = 0;

  for (const r of rows) {
    const startKey = normalizeDateKey((r as any)[cfg.startField]);
    if (!parseDateForDiff(startKey)) continue;

    const endKey = normalizeDateKey((r as any)[cfg.endField]);
    const endKeyFinal = parseDateForDiff(endKey) ? endKey : ONGOING_KEY;

    const curStart = cursorByStart.get(startKey) ?? 0;
    const curEnd = cursorByEnd.get(endKeyFinal) ?? 0;

    const y = Math.max(curStart, curEnd);
    const h = (cfg.topPad ?? 0) + estimateCardHeight(r);
    const next = y + h + STACK_GAP;

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
  options: TimelineOptions;
}): { nodes: AnyNode[]; edges: Edge[] } {
  const { person, hazards, missingEpisodes, assetPlus, interventions, offences, options } = params;

  const nodes: AnyNode[] = [];
  const edges: Edge[] = [];

  let xPos = 0;
  const baseY = 0;
  const xGap = 600;
  const headerOffset = 140;

  const HEADER_WIDTH = 250;
  const END_WIDTH = 170;
  const COLUMN_CENTER_OFFSET = HEADER_WIDTH / 2;

  const HAZARD_WIDTH = 420;
  const EPISODE_WIDTH = 360;
  const ASSETPLUS_WIDTH = 360;
  const INTERVENTION_WIDTH = 360;
  const OFFENCE_WIDTH = 360;

  // Floating case node
  nodes.push({
    id: 'person-floating',
    type: 'caseInfoMovable',
    position: { x: xPos, y: baseY - 100 },
    data: {
      caseId: person['Case Number'] ?? '',
      fullName: person['Full Name'] ?? '',
      worker: person['Latest Allocated Worker'] ?? '',
      age: person['Current Age'] ?? '',
      gender: person['Gender'] ?? '',
      activeReferral: person['Active Referral?'] ?? '',
      PostCode: person['Post Code'] ?? '',
      meta: {
        DoB: person['Date of Birth'] ?? '',
        Nationality: person['Nationanlity Description'] ?? '',
        Ethnicity: person['Ethnicity Description'] ?? '',
        'Missing Episodes in last 3 Months': person['Missing Episodes (3M)'] ?? '',
        'Missing Episodes in last 12 Months': person['Missing Episodes (12M)'] ?? '',
        'Active Hazards': person['Count of Hazards'] ?? '',
        'Allocated Worker Department': person['Allocated Worker Department'] ?? '',
      },
    } as any,
    draggable: true,
    selectable: true,
  });

  xPos += xGap;

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
    topPad: 34,
    edgeColour: () => '#f97316',
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

  const allTracks: Array<{ cfg: TrackConfig<any>; rows: CsvRowBase[] }> = [
    { cfg: hazardTrack, rows: hazards },
    { cfg: episodeTrack, rows: missingEpisodes },
    { cfg: assetPlusTrack, rows: assetPlus },
    { cfg: interventionsTrack, rows: interventions },
    { cfg: offenceTrack, rows: offences},
  ];

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

  const sortedDates = Array.from(dateKeys).sort();
  if (sortedDates.length > 0) sortedDates.push(ONGOING_KEY);

  const dateToX = new Map<string, number>();

  let prevDateNodeId: string | null = null;
  let prevDateValue: Date | null = null;

  for (const dateKey of sortedDates) {
    const isOngoing = dateKey === ONGOING_KEY;
    const dateNodeId = isOngoing ? `date-ongoing` : `date-${dateKey}`;

    dateToX.set(dateKey, xPos + COLUMN_CENTER_OFFSET);

    nodes.push({
      id: dateNodeId,
      type: 'dateHeader',
      position: { x: xPos, y: baseY - headerOffset },
      data: { label: isOngoing ? '📍 Ongoing' : `📅 ${dateKey}` },
      draggable: false,
      selectable: false,
      zIndex: -1,
    });

    const guideAnchorId = `date-guide-anchor-${dateKey}`;

    nodes.push({
      id: guideAnchorId,
      type: 'guideAnchor',
      position: {
        x: xPos + COLUMN_CENTER_OFFSET,
        y: baseY + 2200,
      },
      data: {} as GuideAnchorData,
      draggable: false,
      selectable: false,
    });

    edges.push({
      id: `date-guide-edge-${dateKey}`,
      source: dateNodeId,
      target: guideAnchorId,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'straight',
      selectable: false,
      style: {
        stroke: 'rgba(148,163,184,0.25)',
        strokeWidth: 2,
        strokeDasharray: '6 8',
      },
    });

    if (!isOngoing) {
      const currentDate = parseDateForDiff(dateKey);

      if (prevDateNodeId && prevDateValue && currentDate) {
        const diff = daysBetween(prevDateValue, currentDate);
        edges.push({
          id: `${prevDateNodeId}__to__${dateNodeId}`,
          source: prevDateNodeId,
          target: dateNodeId,
          type: 'smoothstep',
          sourceHandle: 'right',
          targetHandle: 'left',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
            color: '#4a5568',
          },
          label: `${diff} day${diff === 1 ? '' : 's'}`,
          labelBgPadding: [6, 4],
          labelBgBorderRadius: 6,
          labelStyle: { fontSize: 15, fontWeight: 600, fill: '#2d3748' },
          style: { stroke: '#94a3b8' },
        });
      }

      prevDateNodeId = dateNodeId;
      prevDateValue = currentDate;
    }

    xPos += xGap;
  }

  // Dynamic lane planning
  const laneOrder = ['hazards', 'missingEpisodes', 'assetPlus', 'interventions', 'offences'];
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
        ? estimateLaneHeightPoint(cfg as any, rows as any)
        : estimateLaneHeightRange(cfg as any, rows as any);

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

      const estHeight = estimateCardHeight(h);
      yCursorByStart.set(startKey, y + estHeight + STACK_GAP);

      const startId = `hazard-${i}`;
      const endId = `hazard-${i}-end`;

      const edgeColour = hazardTrack.edgeColour ? hazardTrack.edgeColour(h) : '#64748b';

      nodes.push({
        id: startId,
        type: 'hazard',
        position: { x: startCenterX - hazardTrack.width / 2, y },
        data: { row: h } as any,
        draggable: true,
        selectable: true,
      });

      nodes.push({
        id: endId,
        type: 'rangeEnd',
        position: { x: endCenterX - END_WIDTH / 2, y },
        data: { kind: endKeyFinal === ONGOING_KEY ? 'ongoing' : 'end' },
        draggable: false,
        selectable: false,
      });

      const startDate = parseDateForDiff(startKey)!;
      const endDate = parseDateForDiff(endKey);
      const label = endDate
        ? `${daysBetween(startDate, endDate)} day${daysBetween(startDate, endDate) === 1 ? '' : 's'}`
        : 'ongoing';

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
        labelBgStyle:{
          fill: '#ffffff',
          stroke: '#cbd5e1',
          strokeWidth: 1,
        },
        labelStyle:{
          fontSize: 15,
          fontWeight: 700,
          fill: '#111827'
        },
        style: { stroke: edgeColour },
      });
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

      const currentCursor = yCursorByStart.get(startKey) ?? bandY;
      const y = currentCursor;

      const estHeight = topPad + estimateCardHeight(r);
      yCursorByStart.set(startKey, y + estHeight + STACK_GAP);

      nodes.push({
        id: `${cfg.id}-${i}`,
        type: cfg.nodeType,
        position: { x: startCenterX - cfg.width / 2, y: y + topPad },
        data: { row: r } as any,
        draggable: true,
        selectable: true,
      });
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

      const estHeight = topPad + estimateCardHeight(r);
      yCursorByStart.set(startKey, y + estHeight + STACK_GAP);
      yCursorByEnd.set(endKeyFinal, y + estHeight + STACK_GAP);

      const startId = `${cfg.id}-${i}`;
      const endId = `${cfg.id}-${i}-end`;

      const edgeColour = cfg.edgeColour ? cfg.edgeColour(r) : '#475569';

      nodes.push({
        id: startId,
        type: cfg.nodeType,
        position: { x: startCenterX - cfg.width / 2, y: y + topPad },
        data: { row: r } as any,
        draggable: true,
        selectable: true,
      });

      const interventionType =
        cfg.id === 'interventions'
          ? ((r as any)['Intervention Type'] ?? '').toString().trim()
          : '';

      const endLabel =
        cfg.id === 'interventions'
          ? `${interventionType || 'Intervention'} ended`
          : undefined;

      const endNodeType = cfg.id === 'interventions' ? 'interventionEnd' : 'rangeEnd';

      nodes.push({
        id: endId,
        type: endNodeType,
        position: { x: endCenterX - END_WIDTH / 2, y },
        data:
          endNodeType === 'interventionEnd'
            ? ({ label: endKeyFinal === ONGOING_KEY ? 'Ongoing' : endLabel } as any)
            : ({ kind: endKeyFinal === ONGOING_KEY ? 'ongoing' : 'end' } as any),
        draggable: false,
        selectable: false,
      });

      const startDate = parseDateForDiff(startKey)!;
      const endDate = parseDateForDiff(endKey);
      const label = endDate
        ? `${daysBetween(startDate, endDate)} day${daysBetween(startDate, endDate) === 1 ? '' : 's'}`
        : 'ongoing';

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
        labelBgStyle:{
          fill: '#ffffff',
          stroke: '#cbd5e1',
          strokeWidth: 1,
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
        },
        labelStyle:{
          fontSize: 15,
          fontWeight: 700,
          fill: '#111827'
        },
        style: { stroke: edgeColour },
      });
    }
  }

  if (episodeTrack.enabled) renderPointTrack(episodeTrack, missingEpisodes);
  if (assetPlusTrack.enabled) renderPointTrack(assetPlusTrack, assetPlus);
  if (interventionsTrack.enabled) renderRangeTrack(interventionsTrack, interventions);
  if(offenceTrack.enabled) renderPointTrack(offenceTrack, offences);

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
          });

          if (parseDateForDiff(endKey)) {
            add(endKey, {
              kind: 'Hazard ended',
              title: hazardType,
              row: h,
              excludeKeys: ['Case Number'],
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
            title: 'Started',
            row: m,
            excludeKeys: ['Case Number'],
          });
        }
      }

      if (assetPlusTrack.enabled) {
        for (const a of assetPlus) {
          if (!assetPlusTrack.hasValidStart(a)) continue;
          const startKey = normalizeDateKey(a['Start Date']);
          add(startKey, {
            kind: 'AssetPlus',
            title: (a['Rosh judgement'] ?? 'Assessment').toString().trim() || 'Assessment',
            row: a,
            excludeKeys: ['Case Number'],
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
          });

          if (parseDateForDiff(endKey)) {
            add(endKey, {
              kind: 'Intervention ended',
              title: t,
              row: itv,
              excludeKeys: ['Case Number'],
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
          });
        }
      }

      return Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateKey, items]) => ({
          dateKey,
          label: dateKey,
          items,
        }));
    }

  const timelineGroups = buildTimelineGroups();

  nodes.push({
    id: 'timeline-floating',
    type: 'timelineMovable',
    position: { x: -460, y: baseY - 100 },
    data: { groups: timelineGroups } as TimelineNodeData,
    draggable: true,
    selectable: true,
  });

  return { nodes, edges };
}