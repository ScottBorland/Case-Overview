// src/components/CaseInfoFloatingNode.tsx
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import { colors, font } from '../styles/designTokens.js';

export type CaseInfoFloatingNodeData = {
  caseId?: string | undefined;
  fullName?: string | undefined;
  worker?: string | undefined;
  age?: string | undefined;
  gender?: string | undefined;
  dob?: string | undefined;
  activeReferral?: string | undefined;
  PostCode?: string | undefined;
  meta?: Record<string, string | undefined> | undefined;
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
  const datePart = s.split(/\s+/)[0] ?? '';

  const ukMatch = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const day = Number(ukMatch[1]);
    const month = Number(ukMatch[2]);
    const year = ukMatch[3];
    return `${String(day).padStart(2, '0')} ${monthNames[month - 1] ?? ''} ${year}`;
  }

  const isoMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return `${String(day).padStart(2, '0')} ${monthNames[month - 1] ?? ''} ${year}`;
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

function isRiskValue(label: string, value: string): boolean {
  if (value === '—' || value === '0') return false;
  const lbl = label.toLowerCase();
  return lbl.includes('hazard') || (lbl.includes('missing') && lbl.includes('3m'));
}

export function CaseInfoCard({ data, small }: { data: CaseInfoFloatingNodeData; small?: boolean }) {
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

  const gridRows = [
    { label: 'Age', value: firstNonEmpty(data.age, meta['Current Age']) },
    { label: 'Gender', value: firstNonEmpty(data.gender, meta['Gender']) },
    { label: 'Ethnicity', value: ethnicity },
    { label: 'Nationality', value: nationality },
  ];

  const statRows = [
    { label: 'Missing episodes (3m)', value: firstNonEmpty(meta['Missing Episodes (3M)']) },
    { label: 'Missing episodes (12m)', value: firstNonEmpty(meta['Missing Episodes (12M)']) },
    { label: 'Offences count', value: firstNonEmpty(meta['Offences Count']) },
    { label: 'Active hazards', value: firstNonEmpty(meta['Active Hazards']) },
    { label: 'Active referral', value: firstNonEmpty(data.activeReferral, meta['Active Referral?_1']) },
    { label: 'Care leaver', value: firstNonEmpty(meta['Care Leaver?']) },
  ];

  const excludedMetaKeys = new Set([
    'Date of Birth', 'DoB',
    'Nationanlity Description', 'Nationality Description', 'Nationality',
    'Ethnicity Description', 'Ethnicity',
    'Current Age', 'Age', 'Gender',
    'Active Referral?_1',
    'Missing Episodes (3M)', 'Missing Episodes (12M)',
    'Offences Count', 'Active Hazards',
    'Active CIN?', 'Active CLA?', 'Active CP?', 'Care Leaver?',
  ]);

  const orderedMetaKeys = Object.keys(meta)
    .filter((k) => !excludedMetaKeys.has(k))
    .sort((a, b) => a.localeCompare(b));

  return (
    <div
      style={{
        width: small ? '100%' : 266,
        background: colors.sidebarBg,
        border: small ? 'none' : `1px solid ${colors.borderLight}`,
        borderRadius: small ? 0 : 10,
        boxShadow: small ? 'none' : '0 1px 3px rgba(0,0,0,0.07)',
        color: colors.textPrimary,
        overflow: 'hidden',
        fontFamily: font.family,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ padding: '16px 16px 0' }}>
        {/* Name */}
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, marginBottom: 2 }}>
          {normaliseValue(data.fullName) !== '—' ? data.fullName : 'Unknown Person'}
        </div>
        <div style={{ fontSize: 12, color: colors.textPrimary, marginBottom: 12 }}>
          Case ref {normaliseValue(data.caseId)}
        </div>

        {/* 2-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 10px' }}>
          {gridRows.map((r) => (
            <div key={r.label}>
              <div style={{ fontSize: 11, color: colors.textPrimary }}>{r.label}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.textPrimary }}>{r.value}</div>
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 11, color: colors.textPrimary }}>Date of birth</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.textPrimary }}>{dob}</div>
          </div>
        </div>

        {/* More details link */}
        <details style={{ marginTop: 12 }}>
          <summary
            style={{
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: colors.linkBlue,
              listStyle: 'none',
              userSelect: 'none',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            More details
          </summary>

          <div style={{ marginTop: 8 }}>
            {/* Stat rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
              {statRows.map((r) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: colors.textPrimary }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: isRiskValue(r.label, r.value) ? colors.riskValue : colors.textPrimary }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: colors.borderLight, marginBottom: 10 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px', paddingBottom: 4 }}>
              <div>
                <div style={{ fontSize: 11, color: colors.textPrimary }}>Worker</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.textPrimary }}>{firstNonEmpty(data.worker, meta['Latest Allocated Worker'])}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: colors.textPrimary }}>Post Code</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.textPrimary }}>{firstNonEmpty(data.PostCode, meta['Post Code'])}</div>
              </div>
              {orderedMetaKeys.map((key) => (
                <div key={key}>
                  <div style={{ fontSize: 11, color: colors.textPrimary }}>{prettifyKey(key)}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.textPrimary, wordBreak: 'break-word' }}>{normaliseValue(meta[key])}</div>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}

function CaseInfoFloatingNode({ data }: NodeProps<CaseInfoFloatingNodeType>) {
  return (
    <>
      <CaseInfoCard data={data} small={(data as any).small} />
      <Handle type="target" position={Position.Top} id="top" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} style={hiddenHandleStyle} />
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} style={hiddenHandleStyle} />
    </>
  );
}

export default memo(CaseInfoFloatingNode);
