// src/App.tsx
import {
  Controls,
  ReactFlow,
  MiniMap,
  type Node,
  type Edge,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  useOnViewportChange,
  useReactFlow,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';

import HorizontalNode from './components/HorizontalNode.js';
import DateHeaderNode from './components/DateHeaderNode.js';
import CaseInfoFloatingNode from './components/CaseInfoFloatingNode.js';
import RangeEndNode from './components/RangeEndNode.js';
import HazardNode from './components/HazardNode.js';
import MissingEpisodeNode from './components/MissingEpisodeNode.js';
import AssetPlusNode from './components/AssetPlusNode.js';
import InterventionNode from './components/InterventionNode.js';
import InterventionEndNode from './components/InterventionEndNode.js';
import TimelineNode, { TimelineContent } from './components/TimelineNode.js';
import type { TimelineGroup } from './components/TimelineNode.js';
import OffenceNode from './components/OffenceNode.js';
import GuideAnchorNode from './components/GuideAnchorNode.js';
import ExclusionNode from './components/ExclusionNode.js';
import PdatNode from './components/PdatNode.js';
import ContactNode from './components/ContactNode.js';
import CondensedNode from './components/CondensedNode.js';
import LabelAboveEdge from './components/LabelAboveEdge.js';
import VerticalGuideEdge from './components/VerticalGuideEdge.js';
import { CaseInfoCard } from './components/CaseInfoFloatingNode.js';

import type { PersonRow, HazardRow, MissingEpisodeRow, AssetPlusRow, InterventionRow, OffenceRow, ExclusionRow, PdatRow, ContactRow } from './types/csv.js';
import { NodeDisplayContext } from './contexts/NodeDisplayContext.js';
import { createNodesFromPersonHazards } from './CreateNodesFromCSVs.js';
import { colors, font, radius, nodeEyebrow, nodeEyebrowPill, nodeTitle } from './styles/designTokens.js';


const nodeTypes = {
  caseInfoMovable: CaseInfoFloatingNode,
  horizontal: HorizontalNode,
  dateHeader: DateHeaderNode,
  rangeEnd: RangeEndNode,
  hazard: HazardNode,
  missingEpisode: MissingEpisodeNode,
  assetPlus: AssetPlusNode,
  intervention: InterventionNode,
  interventionEnd: InterventionEndNode,
  timelineMovable: TimelineNode,
  offence: OffenceNode,
  guideAnchor: GuideAnchorNode,
  exclusion: ExclusionNode,
  condensedCard: CondensedNode,
  pdat: PdatNode,
  contact: ContactNode,
};

const edgeTypes = {
  labelAbove: LabelAboveEdge,
  verticalGuide: VerticalGuideEdge,
};

function parseCsvFile<T extends Record<string, string | undefined>>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: true,
      transform: (v) => (typeof v === 'string' ? v.trim() : v),
      complete: (results) => {
        if (results.errors?.length) {
          reject(new Error(results.errors[0]?.message || 'CSV parse error'));
          return;
        }
        resolve((results.data || []).filter((row) => Object.keys(row).length > 0));
      },
      error: (err) => reject(err),
    });
  });
}

const STICKY_DATE_TOP_PAD = 13;

/**
 * Pins date header nodes near the top of the viewport using direct DOM
 * manipulation — no React state updates, so panning stays smooth.
 * Date-to-date edges are hidden separately via edge filtering.
 */
function StickyDateHeadersController({ enabled }: { enabled: boolean }) {
  const rafRef = useRef<number | null>(null);

  const handleViewportChange = useCallback(
    ({ y, zoom }: { x: number; y: number; zoom: number }) => {
      if (!enabled) return;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const stickyY = (STICKY_DATE_TOP_PAD - y) / zoom;
        document.querySelectorAll<HTMLElement>('.react-flow__node-dateHeader').forEach((el) => {
          const m = el.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
          if (m) el.style.transform = `translate(${m[1]}px, ${stickyY}px)`;
        });
      });
    },
    [enabled]
  );

  useEffect(() => () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); }, []);
  useOnViewportChange({ onChange: handleViewportChange });
  return null;
}

function NavigateBridge({ navigateRef }: { navigateRef: React.MutableRefObject<((nodeId: string) => void) | null> }) {
  const { getNode, setCenter, getZoom } = useReactFlow();
  useEffect(() => {
    navigateRef.current = (nodeId: string) => {
      const node = getNode(nodeId);
      if (!node) return;
      const x = node.position.x + (node.measured?.width ?? 200) / 2;
      const y = node.position.y + (node.measured?.height ?? 100) / 2;
      setCenter(x, y, { duration: 600, zoom: getZoom() }).catch(() => {});
    };
    return () => { navigateRef.current = null; };
  }, [getNode, setCenter, getZoom, navigateRef]);
  return null;
}

// ── Dropdown hook ────────────────────────────────────────────────────
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return { open, setOpen, ref };
}

// ── Dropdown panel component ─────────────────────────────────────────
function DropdownPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 6px)', left: 0,
      background: 'white', border: `1px solid ${colors.borderLight}`,
      borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      padding: '6px 0', zIndex: 100, minWidth: 220,
      fontFamily: font.family,
    }}>
      {children}
    </div>
  );
}

export default function App() {
  // Uploaded data
  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [hazards, setHazards] = useState<HazardRow[]>([]);
  const [episodes, setEpisodes] = useState<MissingEpisodeRow[]>([]);
  const [assetPlus, setAssetPlus] = useState<AssetPlusRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [offences, setOffences] = useState<OffenceRow[]>([]);
  const [exclusions, setExclusions] = useState<ExclusionRow[]>([]);
  const [pdats, setPdats] = useState<PdatRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);

  const [error, setError] = useState<string>('');

  // UI state
  const [query, setQuery] = useState<string>('');
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string>('');

  // Dropdowns
  const upload = useDropdown();
  const datasets = useDropdown();
  const contactsMenu = useDropdown();
  const display = useDropdown();

  // View mode
  const [showCondensed, setShowCondensed] = useState(false);
  const [showCompact, setShowCompact] = useState(true);
  const [showVertical, setShowVertical] = useState(false);
  const [fixDatePositions, setFixDatePositions] = useState(true);
  const [showTimeBetweenDates, setShowTimeBetweenDates] = useState(true);
  const [showFeedView, setShowFeedView] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [caseInfoCollapsed, setCaseInfoCollapsed] = useState(false);

  // Track toggles
  const [showHazards, setShowHazards] = useState(true);
  const [showMissingEpisodes, setShowMissingEpisodes] = useState(true);
  const [showAssetPlus, setShowAssetPlus] = useState(true);
  const [showInterventions, setShowInterventions] = useState(true);
  const [showOffences, setShowOffences] = useState(true);
  const [showExclusions, setShowExclusions] = useState(true);
  const [showPdats, setShowPdats] = useState(true);
  const [enabledContactTypes, setEnabledContactTypes] = useState<Set<string>>(new Set());

  // Upload handlers
  const onUploadPersons = useCallback(async (file?: File | null) => {
    if (!file) return;
    setError('');
    try {
      const rows = await parseCsvFile<PersonRow>(file);
      setPersons(rows);
      const first = rows.find((r) => (r['Case Number'] || '').trim());
      setSelectedCaseNumber((first?.['Case Number'] || '').trim());
    } catch (e: any) {
      setError(String(e?.message || e));
      setPersons([]);
      setSelectedCaseNumber('');
    }
  }, []);

  const onUploadHazards = useCallback(async (file?: File | null) => {
    if (!file) return; setError('');
    try { setHazards(await parseCsvFile<HazardRow>(file)); } catch (e: any) { setError(String(e?.message || e)); setHazards([]); }
  }, []);
  const onUploadEpisodes = useCallback(async (file?: File | null) => {
    if (!file) return; setError('');
    try { setEpisodes(await parseCsvFile<MissingEpisodeRow>(file)); } catch (e: any) { setError(String(e?.message || e)); setEpisodes([]); }
  }, []);
  const onUploadAssetPlus = useCallback(async (file?: File | null) => {
    if (!file) return; setError('');
    try { setAssetPlus(await parseCsvFile<AssetPlusRow>(file)); } catch (e: any) { setError(String(e?.message || e)); setAssetPlus([]); }
  }, []);
  const onUploadInterventions = useCallback(async (file?: File | null) => {
    if (!file) return; setError('');
    try { setInterventions(await parseCsvFile<InterventionRow>(file)); } catch (e: any) { setError(String(e?.message || e)); setInterventions([]); }
  }, []);
  const onUploadOffences = useCallback(async (file?: File | null) => {
    if (!file) return; setError('');
    try { setOffences(await parseCsvFile<OffenceRow>(file)); } catch (e: any) { setError(String(e?.message || e)); setOffences([]); }
  }, []);
  const onUploadExclusions = useCallback(async (file?: File | null) => {
    if (!file) return; setError('');
    try { setExclusions(await parseCsvFile<ExclusionRow>(file)); } catch (e: any) { setError(String(e?.message || e)); setExclusions([]); }
  }, []);
  const onUploadPdats = useCallback(async (file?: File | null) => {
    if (!file) return; setError('');
    try { setPdats(await parseCsvFile<PdatRow>(file)); } catch (e: any) { setError(String(e?.message || e)); setPdats([]); }
  }, []);
  const onUploadContacts = useCallback(async (file?: File | null) => {
    if (!file) return; setError('');
    try { setContacts(await parseCsvFile<ContactRow>(file)); } catch (e: any) { setError(String(e?.message || e)); setContacts([]); }
  }, []);

  // Filter persons by query
  const filteredPersons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return persons;
    return persons.filter((p) => {
      const name = (p['Full Name'] || '').toLowerCase();
      const cn = (p['Case Number'] || '').toLowerCase();
      return name.includes(q) || cn.includes(q);
    });
  }, [persons, query]);

  const dropdownPersons = useMemo(() => {
    if (!selectedCaseNumber) return filteredPersons;
    const hasSelected = filteredPersons.some((p) => (p['Case Number'] || '').trim() === selectedCaseNumber);
    if (hasSelected) return filteredPersons;
    const selectedPerson = persons.find((p) => (p['Case Number'] || '').trim() === selectedCaseNumber);
    return selectedPerson ? [selectedPerson, ...filteredPersons] : filteredPersons;
  }, [filteredPersons, persons, selectedCaseNumber]);

  const selectedPerson = useMemo(() => {
    if (!selectedCaseNumber) return null;
    return persons.find((p) => (p['Case Number'] || '').trim() === selectedCaseNumber) ?? null;
  }, [persons, selectedCaseNumber]);

  // Rows for selected person
  const selectedHazards = useMemo(() => selectedCaseNumber ? hazards.filter((h) => (h['Case Number'] || '').trim() === selectedCaseNumber) : [], [hazards, selectedCaseNumber]);
  const selectedEpisodes = useMemo(() => selectedCaseNumber ? episodes.filter((r) => (r['Case Number'] || '').trim() === selectedCaseNumber) : [], [episodes, selectedCaseNumber]);
  const selectedAssetPlus = useMemo(() => selectedCaseNumber ? assetPlus.filter((a) => (a['Case Number'] || '').trim() === selectedCaseNumber) : [], [assetPlus, selectedCaseNumber]);
  const selectedInterventions = useMemo(() => selectedCaseNumber ? interventions.filter((i) => (i['Case Number'] || '').trim() === selectedCaseNumber) : [], [interventions, selectedCaseNumber]);
  const selectedOffences = useMemo(() => selectedCaseNumber ? offences.filter((o) => (o['Case Number'] || '').trim() === selectedCaseNumber) : [], [offences, selectedCaseNumber]);
  const selectedExclusions = useMemo(() => selectedCaseNumber ? exclusions.filter((x) => (x['Case Number'] || '').trim() === selectedCaseNumber) : [], [exclusions, selectedCaseNumber]);
  const selectedPdats = useMemo(() => selectedCaseNumber ? pdats.filter((p) => (p['Case Number'] || '').trim() === selectedCaseNumber) : [], [pdats, selectedCaseNumber]);
  const selectedContacts = useMemo(() => selectedCaseNumber ? contacts.filter((c) => (c['Case Number'] || '').trim() === selectedCaseNumber) : [], [contacts, selectedCaseNumber]);

  const contactTypes = useMemo(() => {
    const types = new Set<string>();
    selectedContacts.forEach((c) => {
      const t = (c['contact_type'] ?? '').toString().trim();
      if (t) types.add(t);
    });
    return Array.from(types).sort();
  }, [selectedContacts]);

  useEffect(() => {
    setEnabledContactTypes((prev) => {
      const next = new Set(prev);
      contactTypes.forEach((t) => { if (!next.has(t)) next.add(t); });
      return next;
    });
  }, [contactTypes]);

  const filteredContacts = useMemo(() => {
    if (enabledContactTypes.size === 0) return selectedContacts;
    return selectedContacts.filter((c) => {
      const t = (c['contact_type'] ?? '').toString().trim();
      return !t || enabledContactTypes.has(t);
    });
  }, [selectedContacts, enabledContactTypes]);

  // Build graph
  const graph = useMemo(() => {
    if (!selectedPerson) return { nodes: [] as Node[], edges: [] as Edge[], timelineGroups: [] as TimelineGroup[] };
    return createNodesFromPersonHazards({
      person: selectedPerson,
      hazards: selectedHazards,
      missingEpisodes: selectedEpisodes,
      assetPlus: selectedAssetPlus,
      interventions: selectedInterventions,
      offences: selectedOffences,
      exclusions: selectedExclusions,
      pdats: selectedPdats,
      contacts: filteredContacts,
      options: {
        showHazards, showMissingEpisodes, showAssetPlus, showInterventions,
        showOffences, showExclusions, showPdats, showContacts: true,
        condensed: showCondensed, compactNodes: showCompact, verticalLayout: showVertical,
      },
    });
  }, [
    selectedPerson, selectedHazards, selectedEpisodes, selectedAssetPlus,
    selectedInterventions, selectedOffences, showHazards, showMissingEpisodes,
    showAssetPlus, showInterventions, showOffences, selectedExclusions, showExclusions,
    selectedPdats, showPdats, filteredContacts, showCondensed, showCompact, showVertical,
  ]);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [timelineGroups, setTimelineGroups] = useState<TimelineGroup[]>([]);

  // Is a date-to-date edge? (IDs like "date-2025-03-25__to__date-2025-04-14")
  const isDateToDateEdge = useCallback((e: Edge) => /^date-.*__to__date-/.test(e.id), []);

  useEffect(() => {
    // Filter out person and timeline nodes — sidebar handles them now
    setNodes(graph.nodes.filter((n) => n.type !== 'caseInfoMovable' && n.type !== 'timelineMovable'));
    // Hide date-to-date edges when dates are pinned or "show time" is off
    const hideDateEdges = fixDatePositions || !showTimeBetweenDates;
    setEdges(hideDateEdges ? graph.edges.filter((e) => !isDateToDateEdge(e)) : graph.edges);
    setTimelineGroups(graph.timelineGroups);
  }, [graph, fixDatePositions, showTimeBetweenDates, isDateToDateEdge]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // ── Person data for sidebar ──────────────────────────────────────
  const sidebarPersonData = useMemo(() => {
    if (!selectedPerson) return null;
    const p = selectedPerson;
    const meta: Record<string, string | undefined> = {};
    for (const key of Object.keys(p)) {
      if (!['Case Number', 'Full Name'].includes(key)) {
        meta[key] = (p as any)[key];
      }
    }
    return {
      caseId: (p['Case Number'] || '').trim(),
      fullName: (p['Full Name'] || '').trim(),
      age: meta['Current Age'] || meta['Age'],
      gender: meta['Gender'],
      dob: meta['Date of Birth'] || meta['DoB'],
      worker: meta['Latest Allocated Worker'],
      activeReferral: meta['Active Referral?_1'],
      PostCode: meta['Post Code'],
      meta,
    };
  }, [selectedPerson]);

  // Navigation callback for sidebar events → ReactFlow
  const navigateRef = useRef<((nodeId: string) => void) | null>(null);
  const handleNavigateToNode = useCallback((nodeId: string | undefined) => {
    if (nodeId && navigateRef.current) navigateRef.current(nodeId);
  }, []);

  // ── Styles ─────────────────────────────────────────────────────────
  const headerBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 12px', borderRadius: 6, border: 'none',
    background: 'transparent', color: '#fff',
    cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: font.family,
  };

  const headerBtnAccentStyle: React.CSSProperties = {
    ...headerBtnStyle,
    color: '#fff',
    background: 'oklch(0.42 0.1 165)',
  };

  const uploadItems = [
    { label: 'Persons', handler: onUploadPersons, uploaded: persons.length > 0 },
    { label: 'Hazards', handler: onUploadHazards, uploaded: hazards.length > 0 },
    { label: 'Missing Episodes', handler: onUploadEpisodes, uploaded: episodes.length > 0 },
    { label: 'Asset Plus', handler: onUploadAssetPlus, uploaded: assetPlus.length > 0 },
    { label: 'Interventions', handler: onUploadInterventions, uploaded: interventions.length > 0 },
    { label: 'Offences', handler: onUploadOffences, uploaded: offences.length > 0 },
    { label: 'Exclusions', handler: onUploadExclusions, uploaded: exclusions.length > 0 },
    { label: 'PDATs', handler: onUploadPdats, uploaded: pdats.length > 0 },
    { label: 'Contacts', handler: onUploadContacts, uploaded: contacts.length > 0 },
  ];

  const datasetItems = [
    { label: 'Hazards', value: showHazards, set: setShowHazards },
    { label: 'Missing', value: showMissingEpisodes, set: setShowMissingEpisodes },
    { label: 'Asset Plus', value: showAssetPlus, set: setShowAssetPlus },
    { label: 'Interventions', value: showInterventions, set: setShowInterventions },
    { label: 'Offences', value: showOffences, set: setShowOffences },
    { label: 'Exclusions', value: showExclusions, set: setShowExclusions },
    { label: 'PDATs', value: showPdats, set: setShowPdats },
  ];

  const displayItems = [
    { label: 'Single-Row', value: showCondensed, set: setShowCondensed },
    { label: 'Condensed', value: showCompact, set: setShowCompact },
    { label: 'Vertical', value: showVertical, set: setShowVertical },
    { label: 'Feed', value: showFeedView, set: setShowFeedView },
    { label: 'Fix Date Positions', value: fixDatePositions, set: setFixDatePositions },
    { label: 'Show Time Between Dates', value: showTimeBetweenDates, set: setShowTimeBetweenDates },
  ];

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: font.family, background: colors.appBg,
    }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 20px',
        background: colors.headerBg,
        borderBottom: `1px solid ${colors.headerBorder}`,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ width: 26, height: 26, borderRadius: 6, background: colors.brandAccent, flexShrink: 0 }} />
        <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: 0.2 }}>CaseView</div>

        {/* Person search pill */}
        <div style={{
          flex: '0 1 340px', display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.15)', borderRadius: 7, padding: '7px 12px', marginLeft: 12,
        }}>
          <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.5)', borderRadius: '50%', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={persons.length === 0}
            className="search-placeholder-white"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 13, fontFamily: font.family,
              minWidth: 0,
            }}
          />
          <select
            value={selectedCaseNumber}
            onChange={(e) => setSelectedCaseNumber(e.target.value)}
            disabled={persons.length === 0}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 13, fontFamily: font.family,
              cursor: 'pointer',
            }}
          >
            {dropdownPersons.length > 0 ? (
              dropdownPersons.map((p) => {
                const cn = (p['Case Number'] || '').trim();
                const name = (p['Full Name'] || '').trim();
                return (
                  <option key={cn || name} value={cn} style={{ color: '#111', background: '#fff' }}>
                    {name ? `${name} (${cn || 'no case number'})` : cn}
                  </option>
                );
              })
            ) : (
              <option value="" disabled style={{ color: '#111', background: '#fff' }}>Upload Persons.csv</option>
            )}
          </select>
        </div>

        <div style={{ flex: 1 }} />

        {/* Upload files */}
        <div ref={upload.ref} style={{ position: 'relative' }}>
          <button type="button" onClick={() => upload.setOpen((v) => !v)} style={headerBtnStyle}>
            Upload files
          </button>
          {upload.open && (
            <DropdownPanel>
              {uploadItems.map(({ label, handler, uploaded }) => (
                <label
                  key={label}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: colors.textPrimary, gap: 24 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontWeight: 500 }}>{label}</span>
                  {uploaded
                    ? <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill={colors.intervention}/><path d="M4.5 7.5l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7" stroke={colors.borderMedium} strokeWidth="1"/></svg>
                  }
                  <input type="file" accept=".csv" onChange={(e) => handler(e.target.files?.[0])} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                </label>
              ))}
            </DropdownPanel>
          )}
        </div>

        {/* Datasets */}
        <div ref={datasets.ref} style={{ position: 'relative' }}>
          <button type="button" onClick={() => datasets.setOpen((v) => !v)} style={headerBtnStyle}>
            Datasets
          </button>
          {datasets.open && (
            <DropdownPanel>
              {datasetItems.map(({ label, value, set }) => (
                <label
                  key={label}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: colors.textPrimary, userSelect: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} style={{ accentColor: colors.brandAccent, width: 13, height: 13 }} />
                  {label}
                </label>
              ))}
            </DropdownPanel>
          )}
        </div>

        {/* Contacts */}
        {contacts.length > 0 && (
          <div ref={contactsMenu.ref} style={{ position: 'relative' }}>
            <button type="button" onClick={() => contactsMenu.setOpen((v) => !v)} style={headerBtnStyle}>
              Show Contact Types:
            </button>
            {contactsMenu.open && (
              <DropdownPanel>
                <div className="hide-scrollbar" style={{ maxHeight: 320, overflowY: 'auto' as const }}>
                {contactTypes.length === 0 ? (
                  <div style={{ padding: '7px 14px', fontSize: 13, color: colors.textPrimary }}>No contact types found</div>
                ) : contactTypes.map((type) => {
                  const checked = enabledContactTypes.has(type);
                  return (
                    <label
                      key={type}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: colors.textPrimary, userSelect: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = colors.hoverBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setEnabledContactTypes((prev) => {
                          const next = new Set(prev);
                          if (checked) next.delete(type); else next.add(type);
                          return next;
                        })}
                        style={{ accentColor: colors.brandAccent, width: 13, height: 13 }}
                      />
                      {type}
                    </label>
                  );
                })}
                </div>
              </DropdownPanel>
            )}
          </div>
        )}

        {/* Display options */}
        <div ref={display.ref} style={{ position: 'relative' }}>
          <button type="button" onClick={() => display.setOpen((v) => !v)} style={headerBtnAccentStyle}>
            Display options
          </button>
          {display.open && (
            <DropdownPanel>
              {displayItems.map(({ label, value, set }) => (
                <label
                  key={label}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: colors.textPrimary, userSelect: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} style={{ accentColor: colors.brandAccent, width: 13, height: 13 }} />
                  <span style={{ fontWeight: 500 }}>{label}</span>
                </label>
              ))}
            </DropdownPanel>
          )}
        </div>
      </div>

      {/* ── Main area ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        {selectedPerson && sidebarPersonData && (<>
          <div style={{
            width: sidebarCollapsed ? 0 : 400, flexShrink: 0,
            borderRight: sidebarCollapsed ? 'none' : `1px solid ${colors.borderLight}`,
            background: colors.sidebarBg,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: font.family,
            transition: 'width 0.2s ease',
          }}>
            {/* Person card area — collapsible, 1/3 height */}
            <div style={{
              flex: caseInfoCollapsed ? '0 0 auto' : '1 1 33.3%',
              minWidth: 400, boxSizing: 'border-box',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              transition: 'flex 0.2s ease',
            }}>
              {/* Collapse toggle header */}
              <button
                type="button"
                onClick={() => setCaseInfoCollapsed((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 16px',
                  border: 'none',
                  borderBottom: `1px solid ${colors.borderLight}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: font.family,
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  textTransform: 'uppercase' as const,
                  letterSpacing: 0.5,
                  flexShrink: 0,
                }}
              >
                <span>Person</span>
                <span style={{ fontSize: 9 }}>{caseInfoCollapsed ? '\u25BC' : '\u25B2'}</span>
              </button>
              {!caseInfoCollapsed && (
                <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
                  <CaseInfoCard data={sidebarPersonData} small />
                </div>
              )}
            </div>

            {/* Events — feed or simple list, 2/3 height */}
            {timelineGroups.length > 0 && (
              <div style={{
                borderTop: `1px solid ${colors.borderLight}`,
                flex: caseInfoCollapsed ? '1 1 100%' : '2 2 66.6%',
                overflow: 'auto',
                minWidth: 400, boxSizing: 'border-box',
                minHeight: 0,
                transition: 'flex 0.2s ease',
              }}>
                {showFeedView ? (
                  <SidebarFeed groups={timelineGroups} onNavigate={handleNavigateToNode} />
                ) : (
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{
                      fontSize: 12.5, fontWeight: 700,
                      color: colors.textPrimary,
                      marginBottom: 10,
                      textTransform: 'uppercase' as const,
                      letterSpacing: 0.5,
                    }}>
                      Events
                    </div>
                    <SidebarEvents groups={timelineGroups} onNavigate={handleNavigateToNode} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar collapse/expand toggle — outside the sidebar so it's always visible */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            style={{
              position: 'relative',
              zIndex: 20,
              width: 20, height: 48,
              marginLeft: -1,
              borderRadius: '0 6px 6px 0',
              border: `1px solid ${colors.borderLight}`,
              borderLeft: 'none',
              background: colors.sidebarBg,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: colors.textPrimary,
              fontFamily: font.family,
              padding: 0,
              flexShrink: 0,
              alignSelf: 'flex-start',
              marginTop: 12,
              boxShadow: '1px 0 3px rgba(0,0,0,0.06)',
            }}
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {sidebarCollapsed ? '\u25B6' : '\u25C0'}
          </button>
        </>)}

        {/* ── Canvas ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, position: 'relative', background: colors.appBg }}>
          {selectedPerson ? (
            <>
              {showVertical && timelineGroups.length > 0 && (
                <div style={{ position: 'absolute', top: 12, right: 50, zIndex: 10, width: 300, height: 315, resize: 'both', overflow: 'hidden', minWidth: 160, minHeight: 120, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                  <TimelineContent data={{ groups: timelineGroups }} />
                </div>
              )}
              <NodeDisplayContext.Provider value={{ compact: showCompact || showVertical }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                nodesConnectable={false}
                edgesReconnectable={false}
                connectOnClick={false}
                elementsSelectable
                nodesDraggable
                panOnDrag
                zoomOnScroll
                selectionOnDrag={false}
              >
                {!showVertical && <StickyDateHeadersController enabled={fixDatePositions} />}
                <NavigateBridge navigateRef={navigateRef} />
                <Controls />
                <MiniMap
                  position="bottom-right"
                  pannable
                  zoomable
                  maskColor="rgba(0,0,0,0.05)"
                  nodeColor={(node) => {
                    switch (node.type) {
                      case 'hazard':          return colors.hazardHigh;
                      case 'missingEpisode':  return colors.missingEpisode;
                      case 'assetPlus':       return colors.assetPlus;
                      case 'intervention':    return colors.intervention;
                      case 'caseInfoMovable': return colors.borderMedium;
                      case 'dateHeader':      return 'transparent';
                      case 'offence':         return colors.offence;
                      case 'exclusion':       return colors.exclusion;
                      case 'pdat':            return colors.pdat;
                      case 'contact':         return colors.contact;
                      default:                return colors.textPrimary;
                    }
                  }}
                  style={{
                    height: 240, width: 360, borderRadius: 12, overflow: 'hidden',
                    border: `1px solid ${colors.borderMedium}`,
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                  }}
                />
              </ReactFlow>
              </NodeDisplayContext.Provider>
            </>
          ) : (
            <div style={{ padding: 40, maxWidth: 420 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, marginBottom: 8 }}>Upload data to begin</div>
              <div style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 1.5 }}>
                Upload <strong>Persons.csv</strong> (required), then other CSVs as needed.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Feed view ───────────────────────────────────────────────────────
function getFeedAccent(kind: string): { dot: string; text: string; border: string; solid: string } {
  const k = kind.toLowerCase();
  if (k.includes('hazard') && k.includes('high'))     return { dot: colors.hazardHigh, text: colors.hazardHigh, border: colors.hazardHighBorder, solid: colors.hazardHigh };
  if (k.includes('hazard') && k.includes('moderate')) return { dot: colors.hazardModerate, text: colors.hazardModerateText, border: colors.hazardModerateBorder, solid: colors.hazardModerate };
  if (k.includes('hazard') && k.includes('emerging')) return { dot: colors.hazardEmerging, text: colors.hazardEmergingText, border: colors.hazardEmergingBorder, solid: colors.hazardEmerging };
  if (k.includes('hazard'))       return { dot: colors.hazardHigh, text: colors.hazardHigh, border: colors.hazardHighBorder, solid: colors.hazardHigh };
  if (k.includes('missing'))      return { dot: colors.missingEpisode, text: colors.missingEpisodeText, border: colors.missingEpisodeBorder, solid: colors.missingEpisode };
  if (k.includes('asset'))        return { dot: colors.assetPlus, text: colors.assetPlusText, border: colors.assetPlusBorder, solid: colors.assetPlus };
  if (k.includes('intervention')) return { dot: colors.intervention, text: colors.interventionText, border: colors.interventionBorder, solid: colors.intervention };
  if (k.includes('offence'))      return { dot: colors.offence, text: colors.offenceText, border: colors.offenceBorder, solid: colors.offence };
  if (k.includes('exclusion'))    return { dot: colors.exclusion, text: colors.exclusionText, border: colors.exclusionBorder, solid: colors.exclusion };
  if (k.includes('pdat'))         return { dot: colors.pdat, text: colors.pdatText, border: colors.pdatBorder, solid: colors.pdat };
  if (k.includes('contact'))      return { dot: colors.contact, text: colors.contactText, border: colors.contactBorder, solid: colors.contact };
  return { dot: colors.textPrimary, text: colors.textPrimary, border: colors.borderLight, solid: colors.textPrimary };
}

// Severity ordering for choosing the dot color when a date has mixed event types
const SEVERITY_ORDER = ['hazard · high', 'hazard · significant', 'hazard · moderate', 'hazard · emerging', 'hazard'];
function pickDotColor(items: { kind: string }[]): string {
  for (const prefix of SEVERITY_ORDER) {
    const parts = prefix.split(' · ');
    const base = parts[0] ?? '';
    const sub = parts[1];
    const match = items.find((it) => it.kind.toLowerCase().includes(base) &&
      (sub ? it.kind.toLowerCase().includes(sub) : true));
    if (match) return getFeedAccent(match.kind).dot;
  }
  return getFeedAccent(items[0]?.kind ?? '').dot;
}

function formatFeedDate(raw?: string): { dayMonth: string; year: string } {
  if (!raw || raw === '__ONGOING__') return { dayMonth: 'Ongoing', year: '' };
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { dayMonth: raw, year: '' };
  const dayMonth = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(d);
  const year = String(d.getFullYear());
  return { dayMonth, year };
}

function SidebarFeed({ groups, onNavigate }: { groups: TimelineGroup[]; onNavigate?: (nodeId: string | undefined) => void }) {
  return (
    <div style={{ padding: '14px 16px', fontFamily: font.family }}>
      {groups.length === 0 ? (
        <div style={{ fontSize: 13, color: colors.textPrimary }}>No events to show.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {groups.map((g, gi) => {
            const { dayMonth, year } = formatFeedDate(g.dateKey);
            const dotColor = pickDotColor(g.items);
            const isLast = gi === groups.length - 1;

            return (
              <div key={g.dateKey} style={{ display: 'flex', gap: 12 }}>
                {/* Date rail */}
                <div style={{ width: 56, flexShrink: 0, textAlign: 'right', paddingTop: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: colors.textSecondary, fontFamily: font.family }}>{dayMonth}</div>
                  {year && <div style={{ fontSize: 10.5, color: colors.textMutedLight, fontFamily: font.family }}>{year}</div>}
                </div>

                {/* Connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: dotColor, marginTop: 3, flexShrink: 0 }} />
                  {!isLast && <div style={{ width: 2, flex: 1, background: colors.borderLight, minHeight: 16 }} />}
                </div>

                {/* Event cards */}
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {g.items.map((it, idx) => {
                    const accent = getFeedAccent(it.kind);
                    const exclude = new Set(it.excludeKeys ?? []);
                    const detailKeys = Object.keys(it.row ?? {}).filter((k) => !exclude.has(k)).sort();

                    return (
                      <details
                        key={`${g.dateKey}-${idx}`}
                        style={{
                          background: '#fff',
                          border: `1.5px solid ${accent.border}`,
                          borderLeft: `3px solid ${accent.solid}`,
                          borderRadius: radius.nodeCard,
                          overflow: 'hidden',
                          boxShadow: '0 1px 2px rgba(0,0,0,.04)',
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <summary
                          style={{
                            padding: '8px 11px',
                            cursor: it.nodeId ? 'pointer' : 'default',
                            listStyle: 'none',
                            userSelect: 'none',
                          }}
                          onClick={(e) => { e.stopPropagation(); onNavigate?.(it.nodeId); }}
                          onMouseEnter={(e) => { if (it.nodeId) e.currentTarget.style.background = colors.hoverBg; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{ ...nodeEyebrowPill(accent.dot), fontSize: 9.5 }}>{it.kind}</div>
                          <div style={{ ...nodeTitle, fontSize: 12 }}>{it.title}</div>
                        </summary>
                        {detailKeys.length > 0 && (
                          <div
                            style={{
                              padding: '5px 11px 8px',
                              borderTop: `1px solid ${colors.borderLight}`,
                              display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2px 8px',
                              fontSize: 11,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {detailKeys.map((k) => {
                              const v = (it.row?.[k] ?? '').toString().trim() || '—';
                              return (
                                <Fragment key={k}>
                                  <div style={{ fontWeight: 600, color: colors.textPrimary }}>{k}</div>
                                  <div style={{ color: colors.textPrimary }}>{v}</div>
                                </Fragment>
                              );
                            })}
                          </div>
                        )}
                      </details>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sidebar events list ──────────────────────────────────────────────
function SidebarEvents({ groups, onNavigate }: { groups: TimelineGroup[]; onNavigate?: (nodeId: string | undefined) => void }) {
  function formatDate(raw?: string): string {
    if (!raw || raw === '__ONGOING__') return 'Ongoing';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  }

  function getAccent(kind: string): string {
    const k = kind.toLowerCase();
    if (k.includes('hazard'))       return colors.hazardHigh;
    if (k.includes('missing'))      return colors.missingEpisode;
    if (k.includes('intervention')) return colors.intervention;
    if (k.includes('offence'))      return colors.offence;
    if (k.includes('asset'))        return colors.assetPlus;
    if (k.includes('exclusion'))    return colors.exclusion;
    if (k.includes('pdat'))         return colors.pdat;
    if (k.includes('contact'))      return colors.contact;
    return colors.textPrimary;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {groups.map((g) => (
        <div key={g.dateKey}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textPrimary, marginBottom: 5 }}>
            {formatDate(g.dateKey)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 2 }}>
            {g.items.map((it, idx) => (
              <div
                key={`${g.dateKey}-${idx}`}
                style={{ fontSize: 12, color: colors.textPrimary, lineHeight: 1.4, cursor: it.nodeId ? 'pointer' : 'default', borderRadius: 4, padding: '2px 4px', margin: '-2px -4px' }}
                onClick={() => onNavigate?.(it.nodeId)}
                onMouseEnter={(e) => { if (it.nodeId) e.currentTarget.style.background = colors.hoverBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: getAccent(it.kind), fontWeight: 700 }}>{it.kind}</span>{' '}
                {it.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
