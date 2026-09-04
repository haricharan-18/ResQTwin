import React, { useEffect, useRef, useState } from "react";
import { mappls } from "mappls-web-maps";

import {
  buildings,
  roads,
  exits,
  assemblyPoints,
} from "../data/campusData";
import { generateCampusCrowd } from "../lib/crowdGenerator";

interface MapplsTwinProps {
  scenario?: {
    type?: string;
    severity?: number;
    affectedBuildings?: string[];
    blockedRoads?: string[];
    blockedExits?: string[];
  };
  crowdSimulation?: {
    agents?: Array<{
      id: string;
      x: number;
      y: number;
      status?: "safe" | "evacuating" | "trapped";
    }>;
    totalPeople?: number;
    evacuating?: number;
    trapped?: number;
    safe?: number;
  };
}

const ROAD_POSITIONS: Record<string, [number, number, number, number]> = {
  r1: [350, 270, 500, 270],
  r2: [500, 270, 540, 70],
  r3: [500, 270, 850, 300],
  r4: [350, 450, 500, 560],
  r5: [580, 500, 850, 300],
  r6: [540, 70, 850, 300],
  r7: [580, 500, 850, 540],
};

function roadPath(id: string) {
  const p = ROAD_POSITIONS[id];
  return p ? `${p[0]},${p[1]} ${p[2]},${p[3]}` : "";
}

function agentColor(status?: string) {
  if (status === "trapped") return "#ef4444";
  if (status === "safe") return "#22c55e";
  return "#f59e0b";
}

export default function MapplsTwin({
  scenario,
  crowdSimulation,
}: MapplsTwinProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const key = import.meta.env.VITE_MAPPLS_KEY;
    if (!key || !mapContainerRef.current) {
      setError(key ? "Map container is unavailable." : "Mappls API key is missing.");
      return;
    }

    let cancelled = false;
    const mapplsObject = new mappls();

    mapplsObject.initialize(
      key,
      { map: true, version: "3.0" },
      () => {
        if (cancelled || !mapContainerRef.current) return;

        try {
          const map = mapplsObject.Map({
            id: mapContainerRef.current.id,
            properties: {
              center: [17.45585, 78.66667],
              zoom: 17,
              traffic: false,
              clickableIcons: false,
              zoomControl: false,
              location: false,
              fullscreenControl: false,
            },
          });

          mapRef.current = map;

          setTimeout(() => {
            if (cancelled) return;
            try {
              if (mapplsObject.add3DModel) {
                mapplsObject.add3DModel({ map });
              }
            } catch {
              // Optional Mappls 3D landmarks.
            }
          }, 800);
        } catch (mapError) {
          console.error("Mappls map creation failed:", mapError);
          setError("Unable to create Mappls map.");
        }
      }
    );

    return () => {
      cancelled = true;
      try {
        mapRef.current?.remove?.();
      } catch {
        // Ignore SDK cleanup errors.
      }
      mapRef.current = null;
    };
  }, []);

  const agents =
    crowdSimulation?.agents?.length
      ? crowdSimulation.agents
      : generateCampusCrowd();

  const affectedBuildings = new Set(scenario?.affectedBuildings ?? []);
  const blockedRoads = new Set(scenario?.blockedRoads ?? []);
  const blockedExits = new Set(scenario?.blockedExits ?? []);

  const totalPeople = crowdSimulation?.totalPeople ?? 2630;
  const evacuating = crowdSimulation?.evacuating ?? 0;
  const trapped = crowdSimulation?.trapped ?? 0;
  const safe = crowdSimulation?.safe ?? 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 600,
        position: "relative",
        overflow: "hidden",
        borderRadius: 12,
      }}
    >
      <div
        id="resqtwin-mappls-map"
        ref={mapContainerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      <svg
        viewBox="0 0 1100 680"
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <rect
          x="0"
          y="0"
          width="1100"
          height="680"
          fill="#0f172a"
          fillOpacity="0.58"
        />

        <rect
          x="45"
          y="45"
          width="1010"
          height="590"
          rx="24"
          fill="none"
          stroke="#334155"
          strokeWidth="3"
          strokeDasharray="10 8"
        />

        <text
          x="550"
          y="65"
          textAnchor="middle"
          fill="#64748b"
          fontSize="14"
          fontWeight="700"
        >
          RESQTWIN — DIGITAL TWIN CAMPUS
        </text>

        {roads.map((road) => {
          const pos = ROAD_POSITIONS[road.id];
          if (!pos) return null;
          const blocked = blockedRoads.has(road.id) || Boolean(road.blocked);

          return (
            <g key={road.id}>
              <line
                x1={pos[0]}
                y1={pos[1]}
                x2={pos[2]}
                y2={pos[3]}
                stroke="#020617"
                strokeWidth="18"
                strokeLinecap="round"
                opacity="0.8"
              />
              <line
                x1={pos[0]}
                y1={pos[1]}
                x2={pos[2]}
                y2={pos[3]}
                stroke={blocked ? "#ef4444" : "#334155"}
                strokeWidth={blocked ? 12 : 11}
                strokeLinecap="round"
              />
              {!blocked && (
                <line
                  x1={pos[0]}
                  y1={pos[1]}
                  x2={pos[2]}
                  y2={pos[3]}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="9 8"
                  opacity="0.55"
                />
              )}
              <circle cx={pos[0]} cy={pos[1]} r="7" fill="#cbd5e1" stroke="#0f172a" strokeWidth="4" />
              <circle cx={pos[2]} cy={pos[3]} r="7" fill="#cbd5e1" stroke="#0f172a" strokeWidth="4" />
              {blocked && (
                <text
                  x={(pos[0] + pos[2]) / 2}
                  y={(pos[1] + pos[3]) / 2 - 10}
                  textAnchor="middle"
                  fill="#fca5a5"
                  fontSize="12"
                  fontWeight="800"
                >
                  BLOCKED
                </text>
              )}
            </g>
          );
        })}

        {buildings.map((building) => {
          const affected = affectedBuildings.has(building.id);

          return (
            <g key={building.id}>
              <rect
                x={building.x}
                y={building.y}
                width={building.width}
                height={building.height}
                rx="10"
                fill={affected ? "#7f1d1d" : "#1e3a5f"}
                fillOpacity="0.9"
                stroke={affected ? "#ef4444" : "#60a5fa"}
                strokeWidth="3"
              />

              <text
                x={building.x + building.width / 2}
                y={building.y + building.height + 22}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="13"
                fontWeight="800"
              >
                {building.name}
              </text>

              <text
                x={building.x + building.width / 2}
                y={building.y + building.height + 38}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="10"
              >
                {building.occupants} occupants • Risk {building.risk}%
              </text>

              {Array.from({ length: Math.min(80, building.occupants / 12) }).map((_, i) => {
                const cols = 10;
                const gapX = building.width / 11;
                const gapY = building.height / 9;
                const cx = building.x + gapX * ((i % cols) + 1);
                const cy = building.y + gapY * (Math.floor(i / cols) + 1);
                const c = affected ? "#ef4444" : "#22c55e";

                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r="3.8"
                    fill={c}
                    stroke="#f8fafc"
                    strokeWidth="0.8"
                  />
                );
              })}
            </g>
          );
        })}

        {exits.map((exit) => {
          const blocked = blockedExits.has(exit.id) || exit.status === "blocked";

          return (
            <g key={exit.id}>
              <circle
                cx={exit.x}
                cy={exit.y}
                r="17"
                fill={blocked ? "#7f1d1d" : "#065f46"}
                stroke={blocked ? "#ef4444" : "#34d399"}
                strokeWidth="3"
              />
              <text
                x={exit.x}
                y={exit.y + 4}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="800"
              >
                {blocked ? "X" : "EXIT"}
              </text>
              <text
                x={exit.x}
                y={exit.y - 25}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="10"
                fontWeight="700"
              >
                {exit.name}
              </text>
            </g>
          );
        })}

        {assemblyPoints.map((point) => (
          <g key={point.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r="25"
              fill="#065f46"
              fillOpacity="0.9"
              stroke="#34d399"
              strokeWidth="3"
            />
            <text
              x={point.x}
              y={point.y + 4}
              textAnchor="middle"
              fill="white"
              fontSize="9"
              fontWeight="800"
            >
              SAFE
            </text>
            <text
              x={point.x}
              y={point.y + 39}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="10"
            >
              {point.name}
            </text>
          </g>
        ))}

        {agents.slice(0, 500).map((agent) => (
          <circle
            key={agent.id}
            cx={agent.x}
            cy={agent.y}
            r="2.8"
            fill={agentColor(agent.status)}
            fillOpacity="0.9"
            stroke="#ffffff"
            strokeWidth="0.6"
          />
        ))}
      </svg>

      <div
        style={{
          position: "absolute",
          left: 16,
          top: 16,
          zIndex: 20,
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(2,6,23,.95)",
          border: "1px solid rgba(34,211,238,.35)",
          color: "#fff",
          fontFamily: "Arial,sans-serif",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800 }}>
          ResQTwin | Mappls Digital Twin
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: "#94a3b8" }}>
          LIVE | EXACT 2D DIGITAL TWIN GEOMETRY
        </div>
      </div>

      {scenario?.type && (
        <div
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            zIndex: 20,
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(15,23,42,.96)",
            border: "1px solid rgba(239,68,68,.35)",
            color: "white",
            fontFamily: "Arial,sans-serif",
          }}
        >
          <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: 1 }}>
            ACTIVE DISASTER
          </div>
          <div style={{ marginTop: 5, fontSize: 17, fontWeight: 800, textTransform: "uppercase" }}>
            {scenario.type}
          </div>
          <div style={{ marginTop: 3, fontSize: 11, color: "#cbd5e1" }}>
            Severity {scenario.severity ?? "-"}/5
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          zIndex: 20,
          padding: "10px 14px",
          borderRadius: 12,
          background: "rgba(2,6,23,.95)",
          border: "1px solid rgba(148,163,184,.25)",
          color: "white",
          fontFamily: "Arial,sans-serif",
          fontSize: 11,
        }}
      >
        <b>{totalPeople}</b> people
        <span style={{ color: "#64748b" }}> | </span>
        <b style={{ color: "#f59e0b" }}>{evacuating}</b> evacuating
        <span style={{ color: "#64748b" }}> | </span>
        <b style={{ color: "#ef4444" }}>{trapped}</b> trapped
        <span style={{ color: "#64748b" }}> | </span>
        <b style={{ color: "#22c55e" }}>{safe}</b> safe
      </div>

      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15,23,42,.96)",
            color: "#f8fafc",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
