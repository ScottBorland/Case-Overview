// src/App.tsx
import {
  Background,
  Controls,
  ReactFlow,
  MiniMap,
  Panel,
  PanOnScrollMode,
  type Node,
  type Edge,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  BackgroundVariant,
  useOnViewportChange,
  useReactFlow,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import type { PersonRow, HazardRow, MissingEpisodeRow, AssetPlusRow, InterventionRow, OffenceRow, ExclusionRow, PdatRow, ContactRow } from './types/csv.js';
import { NodeDisplayContext } from './contexts/NodeDisplayContext.js';
import { createNodesFromPersonHazards } from './CreateNodesFromCSVs.js';


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

function StickyDateHeadersController({ enabled }: { enabled: boolean }) {
  const { setNodes } = useReactFlow();

  const handleViewportChange = useCallback(
    ({ y, zoom }: { x: number; y: number; zoom: number }) => {
      if (!enabled) return;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.type !== 'dateHeader') return node;
          return { ...node, position: { x: node.position.x, y: (STICKY_DATE_TOP_PAD - y) / zoom } };
        })
      );
    },
    [enabled, setNodes]
  );

  useOnViewportChange({ onChange: handleViewportChange });

  // Restore original y positions when disabled
  useEffect(() => {
    if (enabled) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type !== 'dateHeader') return node;
        return { ...node, position: { x: node.position.x, y: (node.data as any).originalY ?? node.position.y } };
      })
    );
  }, [enabled, setNodes]);

  return null;
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
  const [topBarCollapsed, setTopBarCollapsed] = useState(false);
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!uploadMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target as Node)) {
        setUploadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [uploadMenuOpen]);

  const [displayMenuOpen, setDisplayMenuOpen] = useState(false);
  const displayMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!displayMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (displayMenuRef.current && !displayMenuRef.current.contains(e.target as Node)) {
        setDisplayMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [displayMenuOpen]);

  const [datasetsMenuOpen, setDatasetsMenuOpen] = useState(false);
  const datasetsMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!datasetsMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (datasetsMenuRef.current && !datasetsMenuRef.current.contains(e.target as Node)) {
        setDatasetsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [datasetsMenuOpen]);

  const [contactsMenuOpen, setContactsMenuOpen] = useState(false);
  const contactsMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!contactsMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (contactsMenuRef.current && !contactsMenuRef.current.contains(e.target as Node)) {
        setContactsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contactsMenuOpen]);

  // View mode
  const [showCondensed, setShowCondensed] = useState(false);
  const [showCompact, setShowCompact] = useState(true);
  const [showVertical, setShowVertical] = useState(false);
  const [fixDatePositions, setFixDatePositions] = useState(true);

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
    if (!file) return;
    setError('');
    try {
      const rows = await parseCsvFile<HazardRow>(file);
      setHazards(rows);
    } catch (e: any) {
      setError(String(e?.message || e));
      setHazards([]);
    }
  }, []);

  const onUploadEpisodes = useCallback(async (file?: File | null) => {
    if (!file) return;
    setError('');
    try {
      const rows = await parseCsvFile<MissingEpisodeRow>(file);
      setEpisodes(rows);
    } catch (e: any) {
      setError(String(e?.message || e));
      setEpisodes([]);
    }
  }, []);

  const onUploadAssetPlus = useCallback(async (file?: File | null) => {
    if (!file) return;
    setError('');
    try {
      const rows = await parseCsvFile<AssetPlusRow>(file);
      setAssetPlus(rows);
    } catch (e: any) {
      setError(String(e?.message || e));
      setAssetPlus([]);
    }
  }, []);

  const onUploadInterventions = useCallback(async (file?: File | null) => {
    if (!file) return;
    setError('');
    try {
      const rows = await parseCsvFile<InterventionRow>(file);
      setInterventions(rows);
    } catch (e: any) {
      setError(String(e?.message || e));
      setInterventions([]);
    }
  }, []);

  const onUploadOffences = useCallback(async (file?: File | null) => {
    if (!file) return;
    setError('');
    try {
      const rows = await parseCsvFile<OffenceRow>(file);
      setOffences(rows);
    } catch (e: any) {
      setError(String(e?.message || e));
      setOffences([]);
    }
  }, []);

  const onUploadExclusions = useCallback(async (file?: File | null) => {
    if (!file) return;
    setError('');
    try {
      const rows = await parseCsvFile<ExclusionRow>(file);
      setExclusions(rows);
    } catch (e: any) {
      setError(String(e?.message || e));
      setExclusions([]);
    }
  }, []);

  const onUploadPdats = useCallback(async (file?: File | null) => {
    if (!file) return;
    setError('');
    try {
      const rows = await parseCsvFile<PdatRow>(file);
      setPdats(rows);
    } catch (e: any) {
      setError(String(e?.message || e));
      setPdats([]);
    }
  }, []);

  const onUploadContacts = useCallback(async (file?: File | null) => {
    if (!file) return;
    setError('');
    try {
      const rows = await parseCsvFile<ContactRow>(file);
      setContacts(rows);
    } catch (e: any) {
      setError(String(e?.message || e));
      setContacts([]);
    }
  }, []);

  // Filter persons by query (name or case number)
  const filteredPersons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return persons;

    return persons.filter((p) => {
      const name = (p['Full Name'] || '').toLowerCase();
      const cn = (p['Case Number'] || '').toLowerCase();
      return name.includes(q) || cn.includes(q);
    });
  }, [persons, query]);

  // Ensure selected stays in dropdown
  const dropdownPersons = useMemo(() => {
    if (!selectedCaseNumber) return filteredPersons;
    const hasSelected = filteredPersons.some((p) => (p['Case Number'] || '').trim() === selectedCaseNumber);
    if (hasSelected) return filteredPersons;

    const selectedPerson = persons.find((p) => (p['Case Number'] || '').trim() === selectedCaseNumber);
    return selectedPerson ? [selectedPerson, ...filteredPersons] : filteredPersons;
  }, [filteredPersons, persons, selectedCaseNumber]);

  // Selected person row
  const selectedPerson = useMemo(() => {
    if (!selectedCaseNumber) return null;
    return persons.find((p) => (p['Case Number'] || '').trim() === selectedCaseNumber) ?? null;
  }, [persons, selectedCaseNumber]);

  // Rows for selected person
  const selectedHazards = useMemo(() => {
    if (!selectedCaseNumber) return [];
    return hazards.filter((h) => (h['Case Number'] || '').trim() === selectedCaseNumber);
  }, [hazards, selectedCaseNumber]);

  const selectedEpisodes = useMemo(() => {
    if (!selectedCaseNumber) return [];
    return episodes.filter((r) => (r['Case Number'] || '').trim() === selectedCaseNumber);
  }, [episodes, selectedCaseNumber]);

  const selectedAssetPlus = useMemo(() => {
    if (!selectedCaseNumber) return [];
    return assetPlus.filter((a) => (a['Case Number'] || '').trim() === selectedCaseNumber);
  }, [assetPlus, selectedCaseNumber]);

  const selectedInterventions = useMemo(() => {
    if (!selectedCaseNumber) return [];
    return interventions.filter((i) => (i['Case Number'] || '').trim() === selectedCaseNumber);
  }, [interventions, selectedCaseNumber]);

  const selectedOffences = useMemo(() => {
    if (!selectedCaseNumber) return [];
    return offences.filter((o) => (o['Case Number'] || '').trim() === selectedCaseNumber);
  }, [offences, selectedCaseNumber]);

  const selectedExclusions = useMemo(() => {
    if (!selectedCaseNumber) return [];
    return exclusions.filter((x) => (x['Case Number'] || '').trim() === selectedCaseNumber);
  }, [exclusions, selectedCaseNumber]);

  const selectedPdats = useMemo(() => {
    if (!selectedCaseNumber) return [];
    return pdats.filter((p) => (p['Case Number'] || '').trim() === selectedCaseNumber);
  }, [pdats, selectedCaseNumber]);

  const selectedContacts = useMemo(() => {
    if (!selectedCaseNumber) return [];
    return contacts.filter((c) => (c['Case Number'] || '').trim() === selectedCaseNumber);
  }, [contacts, selectedCaseNumber]);

  const contactTypes = useMemo(() => {
    const types = new Set<string>();
    selectedContacts.forEach((c) => {
      const t = (c['contact_type'] ?? '').toString().trim();
      if (t) types.add(t);
    });
    return Array.from(types).sort();
  }, [selectedContacts]);

  // When contact types change, enable all new ones by default
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
        showHazards,
        showMissingEpisodes,
        showAssetPlus,
        showInterventions,
        showOffences,
        showExclusions,
        showPdats,
        showContacts: true,
        condensed: showCondensed,
        compactNodes: showCompact,
        verticalLayout: showVertical,
      },
    });
  }, [
    selectedPerson,
    selectedHazards,
    selectedEpisodes,
    selectedAssetPlus,
    selectedInterventions,
    selectedOffences,
    showHazards,
    showMissingEpisodes,
    showAssetPlus,
    showInterventions,
    showOffences,
    selectedExclusions,
    showExclusions,
    selectedPdats,
    showPdats,
    filteredContacts,
    showCondensed,
    showCompact,
    showVertical,
  ]);

  // Local state for interactable flow (dragging)
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [timelineGroups, setTimelineGroups] = useState<TimelineGroup[]>([]);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
    setTimelineGroups(graph.timelineGroups);
  }, [graph]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
    {/* Header */}
    <div style={{ background: '#006D55', borderBottom: '1px solid #005c46', color: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>

      {/* Always-visible row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: topBarCollapsed ? '8px 14px' : '8px 14px 6px 14px' }}>

        {/* Upload files button + dropdown */}
        <div ref={uploadMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setUploadMenuOpen((v) => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#ffffff', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 11V3M4 7l4-4 4 4"/><path d="M2 13h12" strokeLinecap="round"/></svg>
            Upload files
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ opacity: 0.5, transform: uploadMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M2 3.5l3 3 3-3"/></svg>
          </button>

          {uploadMenuOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'white', border: '1px solid #e2e5e9', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '6px 0', zIndex: 100, minWidth: 240, fontFamily: 'inherit' }}>
              {[
                { label: 'Persons', handler: onUploadPersons, uploaded: persons.length > 0 },
                { label: 'Hazards', handler: onUploadHazards, uploaded: hazards.length > 0 },
                { label: 'Missing Episodes', handler: onUploadEpisodes, uploaded: episodes.length > 0 },
                { label: 'Asset Plus', handler: onUploadAssetPlus, uploaded: assetPlus.length > 0 },
                { label: 'Interventions', handler: onUploadInterventions, uploaded: interventions.length > 0 },
                { label: 'Offences', handler: onUploadOffences, uploaded: offences.length > 0 },
                { label: 'Exclusions', handler: onUploadExclusions, uploaded: exclusions.length > 0 },
                { label: 'PDATs', handler: onUploadPdats, uploaded: pdats.length > 0 },
                { label: 'Contacts', handler: onUploadContacts, uploaded: contacts.length > 0 },
              ].map(({ label, handler, uploaded }) => (
                <label
                  key={label}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#111827', gap: 24 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontWeight: 500 }}>{label}</span>
                  {uploaded
                    ? <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="#22c55e"/><path d="M4.5 7.5l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7" stroke="#d1d5db" strokeWidth="1"/></svg>
                  }
                  <input type="file" accept=".csv" onChange={(e) => handler(e.target.files?.[0])} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />

        {/* Toggle Visible Datasets dropdown */}
        <div ref={datasetsMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setDatasetsMenuOpen((v) => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#ffffff', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}
          >
            Datasets
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ opacity: 0.5, transform: datasetsMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M2 3.5l3 3 3-3"/></svg>
          </button>
          {datasetsMenuOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'white', border: '1px solid #e2e5e9', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '6px 0', zIndex: 100, minWidth: 180, fontFamily: 'inherit' }}>
              {[
                { label: 'Hazards', value: showHazards, set: setShowHazards },
                { label: 'Missing', value: showMissingEpisodes, set: setShowMissingEpisodes },
                { label: 'Asset Plus', value: showAssetPlus, set: setShowAssetPlus },
                { label: 'Interventions', value: showInterventions, set: setShowInterventions },
                { label: 'Offences', value: showOffences, set: setShowOffences },
                { label: 'Exclusions', value: showExclusions, set: setShowExclusions },
                { label: 'PDATs', value: showPdats, set: setShowPdats },
              ].map(({ label, value, set }) => (
                <label
                  key={label}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#111827', userSelect: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} style={{ accentColor: '#6366f1', width: 13, height: 13 }} />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Contacts dropdown */}
        {contacts.length > 0 && (
          <div ref={contactsMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setContactsMenuOpen((v) => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 5, border: 'none', background: enabledContactTypes.size > 0 ? 'rgba(255,255,255,0.15)' : 'transparent', color: enabledContactTypes.size > 0 ? '#ffffff' : 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', userSelect: 'none' }}
            >
              Contacts
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ opacity: 0.6, transform: contactsMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M2 3.5l3 3 3-3"/></svg>
            </button>
            {contactsMenuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'white', border: '1px solid #e2e5e9', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '6px 0', zIndex: 100, minWidth: 200, fontFamily: 'inherit', maxHeight: 300, overflowY: 'auto' }}>
                {contactTypes.length === 0 ? (
                  <div style={{ padding: '7px 14px', fontSize: 13, color: '#6b7280' }}>No contact types found</div>
                ) : contactTypes.map((type) => {
                  const checked = enabledContactTypes.has(type);
                  return (
                    <label
                      key={type}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#111827', userSelect: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
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
                        style={{ accentColor: '#6366f1', width: 13, height: 13 }}
                      />
                      {type}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />

        {/* Display Options dropdown */}
        <div ref={displayMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setDisplayMenuOpen((v) => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#ffffff', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}
          >
            Display Options
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ opacity: 0.5, transform: displayMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M2 3.5l3 3 3-3"/></svg>
          </button>
          {displayMenuOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'white', border: '1px solid #e2e5e9', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '6px 0', zIndex: 100, minWidth: 160, fontFamily: 'inherit' }}>
              {[
                { label: 'Single-Row', value: showCondensed, set: setShowCondensed },
                { label: 'Condensed', value: showCompact, set: setShowCompact },
                { label: 'Vertical', value: showVertical, set: setShowVertical },
                { label: 'Fix Date Positions', value: fixDatePositions, set: setFixDatePositions },
              ].map(({ label, value, set }) => (
                <label
                  key={label}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: '#111827', userSelect: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} style={{ accentColor: '#6366f1', width: 13, height: 13 }} />
                  <span style={{ fontWeight: 500 }}>{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Search + person select */}
        <input
          type="text"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="header-search"
          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', outline: 'none', width: 180, background: 'rgba(255,255,255,0.1)', color: '#ffffff', fontSize: 13, fontFamily: 'inherit' }}
          disabled={persons.length === 0}
        />

        <select
          value={selectedCaseNumber}
          onChange={(e) => setSelectedCaseNumber(e.target.value)}
          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', outline: 'none', minWidth: 220, background: '#005c46', color: '#ffffff', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }}
          disabled={persons.length === 0}
        >
          {dropdownPersons.length > 0 ? (
            dropdownPersons.map((p) => {
              const cn = (p['Case Number'] || '').trim();
              const name = (p['Full Name'] || '').trim();
              return (
                <option key={cn || name} value={cn} style={{ color: '#111827', background: '#ffffff' }}>
                  {name ? `${name} (${cn || 'no case number'})` : cn}
                </option>
              );
            })
          ) : (
            <option value="" disabled style={{ color: '#111827', background: '#ffffff' }}>Upload Persons.csv</option>
          )}
        </select>

      </div>
    </div>

      {/* Main area */}
      <div style={{ flex: 1, backgroundColor: '#f7f7f7', position: 'relative' }}>
        {/* Vertical mode events overlay — rendered outside ReactFlow so positioning is fully controlled */}
        {showVertical && timelineGroups.length > 0 && (
          <div style={{ position: 'absolute', top: 12, right: 50, zIndex: 10, width: 300, height: 315, resize: 'both', overflow: 'hidden', minWidth: 160, minHeight: 120, borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <TimelineContent data={{ groups: timelineGroups }} />
          </div>
        )}
        {selectedPerson ? (
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
            panOnScroll
            panOnScrollSpeed={0.75}
            panOnScrollMode={PanOnScrollMode.Vertical}
            selectionOnDrag={false}
          >
            {!showVertical && <StickyDateHeadersController enabled={fixDatePositions} />}
            <Controls />
            {timelineGroups.length > 0 && !showVertical && (
              <Panel position="bottom-left" style={{ margin: 12, overflow: 'visible' }}>
                <div style={{ width: 360, height: 350, resize: 'both', overflow: 'hidden', minWidth: 210, minHeight: 150, maxWidth: '60vw', maxHeight: '70vh' }}>
                  <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 10 }}>
                    <TimelineNode data={{ groups: timelineGroups }} />
                  </div>
                </div>
              </Panel>
            )}
            <MiniMap
              position="bottom-right"
              pannable
              zoomable
              maskColor="rgba(0,0,0,0.05)"   
              nodeColor={(node) => {
                switch (node.type) {
                  case 'hazard':
                    return '#ef4444'; 
                  case 'missingEpisode':
                    return '#3b82f6'; 
                  case 'assetPlus':
                    return '#a855f7'; 
                  case 'intervention':
                    return '#16a34a'; 
                  case 'caseInfoMovable':
                    return '#d1d5db';
                  case 'dateHeader':
                    return 'transparent';
                  case 'offence':
                    return '#EC7A08';
                  case 'exclusion':
                    return '#475569'
                  case 'pdat':
                    return '#14b8a6';
                  case 'contact':
                    return '#10b981';
                  default:
                    return '#a1a1a1ff'; // grey
                }
              }}
              style={{
                height: 240,
                width: 360,
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #cbd5e1',
                background: 'white',
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
              }}
            />
          </ReactFlow>
          </NodeDisplayContext.Provider>
        ) : (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Upload data to begin</div>
            <div>
              Upload <strong>Persons.csv</strong> (required), then other CSVs as needed.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}