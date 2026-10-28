// src/components/SettingsPanel.tsx — In-visual settings panel with track + contact type toggles

import React, { useState } from "react";
import type { TrackVisibility } from "../layoutEngine";
import { CATEGORY_COLOURS, type EventType } from "../types";

interface ToggleItem {
  key: keyof TrackVisibility;
  label: string;
  eventType: EventType;
}

const TOGGLES: ToggleItem[] = [
  { key: "showCras", label: "ROTH Assessments", eventType: "CRA" },
  { key: "showHazards", label: "Hazards", eventType: "Hazard" },
  { key: "showMissingEpisodes", label: "Missing Episodes", eventType: "MissingEpisode" },
  { key: "showAssetPlus", label: "AssetPlus Assessments", eventType: "AssetPlus" },
  { key: "showInterventions", label: "Interventions", eventType: "Intervention" },
  { key: "showOffences", label: "Offences", eventType: "Offence" },
  { key: "showContacts", label: "YJ Contacts", eventType: "Contact" },
  { key: "showExclusions", label: "Exclusions", eventType: "Exclusion" },
  { key: "showPdats", label: "PDATs", eventType: "PDAT" },
];

interface SettingsPanelProps {
  visibility: TrackVisibility;
  onToggle: (key: keyof TrackVisibility) => void;
  onClose: () => void;
  darkMode: boolean;
  contactTypes: string[];
  hiddenContactTypes: Set<string>;
  onToggleContactType: (contactType: string) => void;
}

function ToggleSwitch({ checked, accent, darkMode }: { checked: boolean; accent: string; darkMode: boolean }) {
  return (
    <div
      style={{
        width: 32,
        height: 18,
        borderRadius: 9,
        background: checked ? accent : (darkMode ? "#333" : "#d1d5db"),
        position: "relative",
        flexShrink: 0,
        transition: "background 0.15s",
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 2,
          left: checked ? 16 : 2,
          transition: "left 0.15s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  visibility,
  onToggle,
  onClose,
  darkMode,
  contactTypes,
  hiddenContactTypes,
  onToggleContactType,
}) => {
  const panelBg = darkMode ? "#1c1f2a" : "#ffffff";
  const textColor = darkMode ? "#e4e5e7" : "#2a2e38";
  const borderColor = darkMode ? "#282c38" : "#e0e2e8";
  const hoverBg = darkMode ? "#252836" : "#f5f6f8";
  const contactAccent = CATEGORY_COLOURS.Contact.solid;

  const [contactSectionOpen, setContactSectionOpen] = useState(false);
  const showContactTypes = contactTypes.length > 0 && visibility.showContacts;

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 10,
        background: panelBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
        padding: "12px 0",
        minWidth: 220,
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
        fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px 10px",
          borderBottom: `1px solid ${borderColor}`,
          marginBottom: 6,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: textColor }}>
          Visible Tracks
        </span>
        <span
          onClick={onClose}
          style={{
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            color: darkMode ? "#8b8d94" : "#6e7280",
            padding: "0 2px",
          }}
        >
          ×
        </span>
      </div>

      {/* Track toggle rows */}
      {TOGGLES.map((t) => {
        const checked = visibility[t.key];
        const accent = CATEGORY_COLOURS[t.eventType].solid;

        return (
          <div
            key={t.key}
            onClick={() => onToggle(t.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: 600,
              color: checked ? textColor : (darkMode ? "#555" : "#aaa"),
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ToggleSwitch checked={checked} accent={accent} darkMode={darkMode} />
            <div
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: accent, opacity: checked ? 1 : 0.35, flexShrink: 0,
              }}
            />
            <span>{t.label}</span>
          </div>
        );
      })}

      {/* Contact Types section */}
      {showContactTypes && (
        <>
          <div
            style={{
              borderTop: `1px solid ${borderColor}`,
              margin: "8px 0 6px",
            }}
          />
          <div
            onClick={() => setContactSectionOpen(!contactSectionOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 14px 6px",
              cursor: "pointer",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, color: textColor }}>
              Show Contact Types
            </span>
            <span style={{ fontSize: 11, color: darkMode ? "#8b8d94" : "#6e7280" }}>
              {contactSectionOpen ? "▲" : "▼"}
            </span>
          </div>

          {contactSectionOpen && contactTypes.map((ct) => {
            const checked = !hiddenContactTypes.has(ct);

            return (
              <div
                key={ct}
                onClick={() => onToggleContactType(ct)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "5px 14px 5px 20px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: checked ? textColor : (darkMode ? "#555" : "#aaa"),
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <ToggleSwitch checked={checked} accent={contactAccent} darkMode={darkMode} />
                <span>{ct}</span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
