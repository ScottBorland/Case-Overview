// src/components/CaseInfoFloatingNode.tsx
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { Node, NodeProps } from '@xyflow/react';

export type CaseInfoFloatingNodeData = {
  caseId?: string;
  fullName?: string;
  worker?: string;
  age?: string;
  gender?: string;
  dob?: string;
  activeReferral?: string;
  PostCode?: string;
  meta?: Record<string, string | undefined>;
};

type CaseInfoFloatingNodeType = Node<CaseInfoFloatingNodeData, 'caseInfoMovable'>;

const hiddenHandleStyle: CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0,
  pointerEvents: 'none',
};

function normaliseValue(value?: string | null): string {
  const s = (value ?? '').toString().trim();
  if (!s || s === 'NaT' || s === 'Unknown' || s === 'NULL' || s === 'null') return '—';
  return s;
}

function formatDateLabel(raw?: string | null): string {
  const s = (raw ?? '').toString().trim();
  if (!s || s === 'NaT' || s === 'Unknown') return '';

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const datePart = s.split(/\s+/)[0];

  const ukMatch = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const day = Number(ukMatch[1]);
    const month = Number(ukMatch[2]);
    const year = ukMatch[3];
    return `${String(day).padStart(2, '0')} ${monthNames[month - 1]} ${year}`;
  }

  const isoMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return `${String(day).padStart(2, '0')} ${monthNames[month - 1]} ${year}`;
  }

  return s;
}

function prettifyKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  for (const value of values) {
    const v = normaliseValue(value);
    if (v !== '—') return v;
  }
  return '—';
}

function CaseInfoFloatingNode({ data }: NodeProps<CaseInfoFloatingNodeType>) {
  const meta = data.meta || {};

  const dob = firstNonEmpty(
    formatDateLabel(data.dob),
    formatDateLabel(meta['Date of Birth']),
    formatDateLabel(meta['DoB']),
    data.dob
  );

  const nationality = firstNonEmpty(
    meta['Nationanlity Description'],
    meta['Nationality Description'],
    meta['Nationality']
  );

  const ethnicity = firstNonEmpty(
    meta['Ethnicity Description'],
    meta['Ethnicity']
  );

  const defaultRows = [
    { label: 'Age', value: firstNonEmpty(data.age, meta['Current Age']) },
    { label: 'Gender', value: firstNonEmpty(data.gender, meta['Gender']) },
    { label: 'Ethnicity', value: ethnicity },
    { label: 'Nationality', value: nationality },
    { label: 'Date of Birth', value: dob },
    { label: 'Missing Episodes (3M)', value: firstNonEmpty(meta['Missing Episodes (3M)']) },
    { label: 'Missing Episodes (12M)', value: firstNonEmpty(meta['Missing Episodes (12M)']) },
    { label: 'Offences Count', value: firstNonEmpty(meta['Offences Count']) },
    { label: 'Active Hazards', value: firstNonEmpty(meta['Active Hazards']) },
    { label: 'Active CIN', value: firstNonEmpty(meta['Active CIN?']) },
    { label: 'Active CLA', value: firstNonEmpty(meta['Active CLA?']) },
    { label: 'Active CP', value: firstNonEmpty(meta['Active CP?']) },
    { label: 'Active Referral', value: firstNonEmpty(data.activeReferral, meta['Active Referral?_1']) },
    { label: 'Care Leaver', value: firstNonEmpty(meta['Care Leaver?']) },
  ];

  const excludedMetaKeys = new Set([
    'Date of Birth',
    'DoB',
    'Nationanlity Description',
    'Nationality Description',
    'Nationality',
    'Ethnicity Description',
    'Ethnicity',
    'Current Age',
    'Age',
    'Gender',
    'Active Referral?_1',
    'Missing Episodes (3M)',
    'Missing Episodes (12M)',
    'Offences Count',
    'Active Hazards',
    'Active CIN?',
    'Active CLA?',
    'Active CP?',
    'Care Leaver?',
  ]);

  const orderedMetaKeys = Object.keys(meta)
    .filter((k) => !excludedMetaKeys.has(k))
    .sort((a, b) => a.localeCompare(b));

  return (
    <div
      style={{
        width: 420,
        borderRadius: 12,
        background: '#ffffff',
        border: '2px solid #006D55',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        color: '#111827',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: '#006D55',
          padding: '10px 18px',
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            lineHeight: 1.2,
            textAlign: 'center',
            letterSpacing: 0.1,
            color: '#ffffff',
          }}
        >
          {normaliseValue(data.fullName) !== '—' ? data.fullName : 'Unknown Person'}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            gap: '7px 12px',
            marginBottom: 14,
          }}
        >
          {defaultRows.map((row) => (
            <div key={row.label} style={{ display: 'contents' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#000000', alignSelf: 'center' }}>
                {row.label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#000000', alignSelf: 'center', wordBreak: 'break-word' }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>

        <details>
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12.5,
              color: '#000000',
              padding: '6px 0',
              userSelect: 'none',
              borderTop: '1px solid #e5e7eb',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            More Details
          </summary>

          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              display: 'grid',
              gridTemplateColumns: '150px 1fr',
              gap: '7px 12px',
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#000000' }}>Worker</div>
            <div style={{ fontSize: 13, color: '#000000', wordBreak: 'break-word' }}>
              {firstNonEmpty(data.worker, meta['Latest Allocated Worker'])}
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#000000' }}>Post Code</div>
            <div style={{ fontSize: 13, color: '#000000', wordBreak: 'break-word' }}>
              {firstNonEmpty(data.PostCode, meta['Post Code'])}
            </div>

            {orderedMetaKeys.map((key) => (
              <div key={key} style={{ display: 'contents' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#000000' }}>
                  {prettifyKey(key)}
                </div>
                <div style={{ fontSize: 13, color: '#000000', wordBreak: 'break-word' }}>
                  {normaliseValue(meta[key])}
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>

      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
    </div>
  );
}

export default memo(CaseInfoFloatingNode);