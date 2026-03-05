// src/components/CaseInfoFloatingNode.tsx
import { memo } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import { nodeValueStyle } from '../styles/nodeStyles.js';
import { nodeLabelStyle } from '../styles/nodeStyles.js';

export type CaseInfoFloatingData = {
  caseId: string;
  fullName?: string;
  worker?: string;
  age?: string;
  gender?: string;
  activeReferral?: string;
  PostCode?: string;
  meta?: Record<string, string | number | undefined | null>;
};

type CaseInfoFloatingType = Node<CaseInfoFloatingData, 'caseInfoMovable'>;

function formatDateLabel(raw?: string | null): string {
  const s = (raw ?? '').toString().trim();
  if (!s || s === 'NaT' || s === 'Unknown') return '';
  const clean = s.endsWith(' 00:00:00') ? s.slice(0, 10) : s;
  const d = new Date(clean);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function toDisplayValue(key: string, value: any): string {
  if (value === null || value === undefined) return '—';
  const s = String(value).trim();
  if (!s) return '—';

  const keyLower = key.toLowerCase();
  const looksLikeDateKey =
    keyLower.includes('date') ||
    keyLower.includes('dob') ||
    keyLower.includes('birth') ||
    keyLower.includes('created') ||
    keyLower.includes('closed') ||
    keyLower.includes('signed');

  if (looksLikeDateKey) {
    const formatted = formatDateLabel(s);
    if (formatted) return formatted;
  }

  return s;
}

function Pill({ label, tone }: { label: string; tone: 'green' | 'amber' | 'slate' }) {
  const styles: Record<string, React.CSSProperties> = {
    green: { background: 'rgba(220,252,231,1)', border: '1px solid rgb(22,163,74)', color: 'rgb(22,101,52)' },
    amber: { background: 'rgba(254,243,199,1)', border: '1px solid rgb(180,83,9)', color: 'rgb(120,53,15)' },
    slate: { background: 'rgba(241,245,249,1)', border: '1px solid rgb(148,163,184)', color: 'rgb(30,41,59)' },
  };

  return (
    <span
      style={{
        ...styles[tone],
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, padding: '6px 0' }}>
      <div style={{ fontWeight: 800, color: '#000000' }}>{k}</div>
      <div style={{ color: 'rgb(15,23,42)' }}>{v}</div>
    </div>
  );
}

function CaseInfoFloatingNode({ data }: NodeProps<CaseInfoFloatingType>) {
  const meta = data.meta || {};

  const referralRaw = (data.activeReferral ?? '').toString().trim().toLowerCase();
  const referralTone: 'green' | 'amber' | 'slate' =
    referralRaw.includes('yes') || referralRaw.includes('true')
      ? 'green'
      : referralRaw.includes('no') || referralRaw.includes('false')
      ? 'slate'
      : 'amber';

  const title = (data.fullName || '').trim() || 'Person Overview';
  const caseId = (data.caseId || '').trim();

  // Always-visible keys (plus Age from top-level)
  const alwaysVisibleKeys = new Set(['Ethnicity', 'Nationality']);

  // Pull Ethnicity/Nationality from meta (as you already store them there)
  const ethnicity = toDisplayValue('Ethnicity', meta['Ethnicity']);
  const nationality = toDisplayValue('Nationality', meta['Nationality']);
  const age = toDisplayValue('Age', data.age);
  const gender = toDisplayValue('Gender', data.gender);
  const postcode = toDisplayValue('Postcode', data.PostCode);
  // Build "More details" from:
  // - top-level fields except Age (since shown)
  // - meta fields except Ethnicity/Nationality (since shown)
  const moreDetails: Array<[string, any]> = [];

  // top-level
  if (data.worker) moreDetails.push(['Allocated Worker', data.worker]);
  

  // include some useful meta if present (excluding always-visible keys)
  for (const [k, v] of Object.entries(meta)) {
    if (alwaysVisibleKeys.has(k)) continue;
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (!s) continue;
    moreDetails.push([k, v]);
  }

  // De-dupe and sort by key for neatness
  const deduped = new Map<string, any>();
  for (const [k, v] of moreDetails) {
    if (!deduped.has(k)) deduped.set(k, v);
  }
  const metaEntries = Array.from(deduped.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div
      style={{
        width: 360,
        borderRadius: 16,
        background: 'white',
        border: '1px solid rgba(15, 23, 42, 0.12)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.10)',
        overflow: 'hidden',
        cursor: 'move',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 14px',
          background: 'linear-gradient(180deg, rgba(0,90,139,1) 0%, rgba(0,63,114,1) 100%)',
          color: 'white',
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 0.2,
            textAlign: 'center',
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>

        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {caseId ? <Pill label={`Case ${caseId}`} tone="slate" /> : <Pill label="No case number" tone="amber" />}
          {data.activeReferral ? <Pill label={`Active referral: ${data.activeReferral}`} tone={referralTone} /> : null}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        <div style={{ borderTop: '1px solid rgba(148,163,184,0.35)', paddingTop: 6 }}>
          <Row k="Age" v={age} />
          <Row k="Gender" v={gender}/>
          <Row k="Ethnicity" v={ethnicity} />
          <Row k="Nationality" v={nationality} />
          <Row k="Postcode" v={postcode} />
        </div>

        {/* More details */}
        <div style={{ marginTop: 12 }}>
          <details>
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: 900,
                color: '#000000',
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(241,245,249,1)',
                border: '1px solid rgba(148,163,184,0.45)',
                listStyle: 'none',
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              More details ({metaEntries.length})
            </summary>

            <div
              style={{
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(248,250,252,1)',
                border: '1px solid rgba(148,163,184,0.35)',
              }}
            >
              {metaEntries.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: '8px 10px' }}>
                  {metaEntries.map(([k, v]) => (
                    <div key={k} style={{ display: 'contents' }}>
                      <div style={nodeLabelStyle}>{k}</div>
                      <div style={nodeValueStyle}>{toDisplayValue(k, v)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={nodeValueStyle}>No additional fields.</div>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export default memo(CaseInfoFloatingNode);