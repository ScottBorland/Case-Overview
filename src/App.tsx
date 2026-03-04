// src/App.tsx
import {
  Background,
  Controls,
  ReactFlow,
  type Node,
  type Edge,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

import type { PersonRow, HazardRow, MissingEpisodeRow, AssetPlusRow, InterventionRow } from './types/csv.js';
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

export default function App() {
  // Uploaded data
  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [hazards, setHazards] = useState<HazardRow[]>([]);
  const [episodes, setEpisodes] = useState<MissingEpisodeRow[]>([]);
  const [assetPlus, setAssetPlus] = useState<AssetPlusRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);

  const [error, setError] = useState<string>('');

  // UI state
  const [query, setQuery] = useState<string>('');
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string>('');
  const [showCombined, setShowCombined] = useState<boolean>(false); // reserved for later

  // Track toggles
  const [showHazards, setShowHazards] = useState(true);
  const [showMissingEpisodes, setShowMissingEpisodes] = useState(true);
  const [showAssetPlus, setShowAssetPlus] = useState(true);
  const [showInterventions, setShowInterventions] = useState(true);

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

  // Build graph
  const graph = useMemo(() => {
    if (!selectedPerson) return { nodes: [] as Node[], edges: [] as Edge[] };

    return createNodesFromPersonHazards({
      person: selectedPerson,
      hazards: selectedHazards,
      missingEpisodes: selectedEpisodes,
      assetPlus: selectedAssetPlus,
      interventions: selectedInterventions,
      options: {
        showHazards,
        showMissingEpisodes,
        showAssetPlus,
        showInterventions,
      },
    });
  }, [
    selectedPerson,
    selectedHazards,
    selectedEpisodes,
    selectedAssetPlus,
    selectedInterventions,
    showHazards,
    showMissingEpisodes,
    showAssetPlus,
    showInterventions,
  ]);

  // Local state for interactable flow (dragging)
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
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
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          padding: '8px 12px',
          background: 'rgb(0, 90, 139)',
          borderBottom: '1px solid #cbd5e1',
          color: 'white',
        }}
      >
        {/* Left: title + file inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700 }}>Person hazard timeline viewer</span>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span>Persons.csv</span>
            <input type="file" accept=".csv" onChange={(e) => onUploadPersons(e.target.files?.[0])} style={{ color: 'white' }} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span>Hazards.csv</span>
            <input type="file" accept=".csv" onChange={(e) => onUploadHazards(e.target.files?.[0])} style={{ color: 'white' }} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span>Missing Episodes.csv</span>
            <input type="file" accept=".csv" onChange={(e) => onUploadEpisodes(e.target.files?.[0])} style={{ color: 'white' }} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span>AssetPlus.csv</span>
            <input type="file" accept=".csv" onChange={(e) => onUploadAssetPlus(e.target.files?.[0])} style={{ color: 'white' }} />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span>Interventions.csv</span>
            <input type="file" accept=".csv" onChange={(e) => onUploadInterventions(e.target.files?.[0])} style={{ color: 'white' }} />
          </label>

          {/* Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={showHazards} onChange={(e) => setShowHazards(e.target.checked)} />
              Show Hazards
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={showMissingEpisodes}
                onChange={(e) => setShowMissingEpisodes(e.target.checked)}
              />
              Show Missing Episodes
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={showAssetPlus} onChange={(e) => setShowAssetPlus(e.target.checked)} />
              Show AssetPlus
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={showInterventions}
                onChange={(e) => setShowInterventions(e.target.checked)}
              />
              Show Interventions
            </label>
          </div>

          {/* Keep for later */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, opacity: 0.6 }}>
            <input type="checkbox" checked={showCombined} onChange={(e) => setShowCombined(e.target.checked)} disabled />
            Show all people (coming soon)
          </label>
        </div>

        {/* Right: search + dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text"
            placeholder="Search name or case number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              outline: 'none',
              minWidth: 220,
            }}
            disabled={persons.length === 0}
          />

          <select
            value={selectedCaseNumber}
            onChange={(e) => setSelectedCaseNumber(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              outline: 'none',
              minWidth: 260,
              background: 'white',
              color: 'black',
            }}
            disabled={persons.length === 0}
          >
            {dropdownPersons.length > 0 ? (
              dropdownPersons.map((p) => {
                const cn = (p['Case Number'] || '').trim();
                const name = (p['Full Name'] || '').trim();
                return (
                  <option key={cn || name} value={cn}>
                    {name ? `${name} (${cn || 'no case number'})` : cn}
                  </option>
                );
              })
            ) : (
              <option value="" disabled>
                Upload Persons.csv
              </option>
            )}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#7f1d1d', borderBottom: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* Main area */}
      <div style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
        {selectedPerson ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            nodesConnectable={false}
            edgesReconnectable={false}
            connectOnClick={false}
            elementsSelectable
            nodesDraggable
            panOnDrag
            selectionOnDrag={false}
          >
            <Controls />
            <Background color="#1649cbff" />
          </ReactFlow>
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