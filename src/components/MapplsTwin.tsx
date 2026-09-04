import React, { useEffect, useRef, useState } from "react";
import { mappls } from "mappls-web-maps";

import {
  buildings,
  exits,
  roads,
  assemblyPoints,
} from "../data/campusData";

import {
  SNIST_MAP_CENTER,
  buildingToMappls,
  exitToMappls,
  assemblyPointToMappls,
  roadPositionToMappls,
  resqtwinToMappls,
} from "../lib/mapplsCampus";

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

function addMarker(
  mapplsObject: any,
  map: any,
  position: { lat: number; lng: number },
  html: string,
  popupHtml?: string
) {
  if (!mapplsObject?.Marker) return null;

  try {
    return mapplsObject.Marker({
      map,
      position,
      html,
      popupHtml,
      popupOptions: {
        autoClose: true,
        maxWidth: 320,
      },
    });
  } catch (error) {
    console.warn("Mappls marker failed:", error);
    return null;
  }
}

function addPolyline(
  mapplsObject: any,
  map: any,
  path: Array<{ lat: number; lng: number }>,
  blocked: boolean,
  popupHtml: string
) {
  if (!mapplsObject?.Polyline || path.length < 2) return null;

  try {
    return mapplsObject.Polyline({
      map,
      path,
      strokeColor: blocked ? "#ef4444" : "#06b6d4",
      strokeOpacity: blocked ? 0.95 : 0.8,
      strokeWeight: blocked ? 8 : 5,
      zIndex: blocked ? 30 : 10,
      popupHtml,
    });
  } catch (error) {
    console.warn("Mappls polyline failed:", error);
    return null;
  }
}

export default function MapplsTwin({
  scenario,
  crowdSimulation,
}: MapplsTwinProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const [error, setError] = useState("");

  const clearOverlays = () => {
    overlaysRef.current.forEach((overlay) => {
      try {
        overlay?.remove?.();
      } catch {
        // Ignore SDK cleanup errors.
      }
    });

    overlaysRef.current = [];
  };

  useEffect(() => {
    const key = import.meta.env.VITE_MAPPLS_KEY;

    if (!key) {
      setError("Mappls API key is missing.");
      return;
    }

    if (!mapContainerRef.current) {
      return;
    }

    let cancelled = false;
    const mapplsObject = new mappls();

    const drawLayers = () => {
      if (cancelled || !mapRef.current) return;

      clearOverlays();

      const affectedBuildings = new Set(
        scenario?.affectedBuildings ?? []
      );
      const blockedRoads = new Set(
        scenario?.blockedRoads ?? []
      );
      const blockedExits = new Set(
        scenario?.blockedExits ?? []
      );

      /* BUILDINGS — same positions as 2D Digital Twin. */
      buildings.forEach((building) => {
        const mapped = buildingToMappls(building);
        const affected = affectedBuildings.has(building.id);

        const marker = addMarker(
          mapplsObject,
          mapRef.current,
          mapped.mappls,
          `
            <div style="
              transform:translate(-50%,-100%);
              padding:6px 10px;
              border-radius:9px;
              background:${
                affected
                  ? "rgba(127,29,29,.97)"
                  : "rgba(15,23,42,.97)"
              };
              border:2px solid ${
                affected ? "#ef4444" : "#22d3ee"
              };
              color:white;
              font:800 11px Arial,sans-serif;
              white-space:nowrap;
              box-shadow:0 4px 14px rgba(0,0,0,.45);
            ">
              ${affected ? "AFFECTED" : "BUILDING"} ${building.name}
            </div>
          `,
          `
            <div style="padding:12px;min-width:220px;font-family:Arial,sans-serif">
              <strong>${building.name}</strong>
              <br/><br/>
              Occupants: <b>${building.occupants}</b><br/>
              Capacity: <b>${building.capacity}</b><br/>
              Base Risk: <b>${building.risk}/100</b>
              <br/><br/>
              <b style="color:${affected ? "#dc2626" : "#059669"}">
                ${affected ? "AFFECTED BUILDING" : "BUILDING SAFE"}
              </b>
            </div>
          `
        );

        if (marker) overlaysRef.current.push(marker);
      });

      /* ROADS — exact same geometry as 2D Digital Twin. */
      roads.forEach((road) => {
        const path = roadPositionToMappls(road.id);
        if (!path) return;

        const blocked =
          blockedRoads.has(road.id) ||
          Boolean(road.blocked);

        const line = addPolyline(
          mapplsObject,
          mapRef.current,
          path,
          blocked,
          `
            <div style="padding:12px;min-width:220px;font-family:Arial,sans-serif">
              <strong>${road.name}</strong>
              <br/><br/>
              Distance: <b>${road.distance}m</b><br/>
              Capacity: <b>${road.capacity}</b>
              <br/><br/>
              <b style="color:${blocked ? "#dc2626" : "#059669"}">
                ${blocked ? "ROAD BLOCKED" : "EVACUATION ROUTE OPEN"}
              </b>
            </div>
          `
        );

        if (line) overlaysRef.current.push(line);
      });

      /* EXITS — same positions as 2D Digital Twin. */
      exits.forEach((exit) => {
        const mapped = exitToMappls(exit);
        const blocked =
          blockedExits.has(exit.id) ||
          exit.status === "blocked";

        const marker = addMarker(
          mapplsObject,
          mapRef.current,
          mapped.mappls,
          `
            <div style="
              transform:translate(-50%,-100%);
              padding:5px 9px;
              border-radius:8px;
              background:${
                blocked
                  ? "rgba(127,29,29,.98)"
                  : "rgba(6,78,59,.98)"
              };
              border:2px solid ${
                blocked ? "#ef4444" : "#34d399"
              };
              color:white;
              font:800 10px Arial,sans-serif;
              white-space:nowrap;
              box-shadow:0 4px 12px rgba(0,0,0,.4);
            ">
              ${blocked ? "BLOCKED" : "EXIT"} ${exit.name}
            </div>
          `,
          `
            <div style="padding:12px;font-family:Arial,sans-serif">
              <strong>${exit.name}</strong><br/><br/>
              Capacity: <b>${exit.capacity}</b><br/><br/>
              <b style="color:${blocked ? "#dc2626" : "#059669"}">
                ${blocked ? "EXIT BLOCKED" : "EXIT AVAILABLE"}
              </b>
            </div>
          `
        );

        if (marker) overlaysRef.current.push(marker);
      });

      /* ASSEMBLY POINTS — same positions as 2D Digital Twin. */
      assemblyPoints.forEach((point) => {
        const mapped = assemblyPointToMappls(point);

        const marker = addMarker(
          mapplsObject,
          mapRef.current,
          mapped.mappls,
          `
            <div style="
              transform:translate(-50%,-100%);
              padding:5px 9px;
              border-radius:8px;
              background:rgba(6,78,59,.98);
              border:2px solid #34d399;
              color:white;
              font:800 10px Arial,sans-serif;
              white-space:nowrap;
              box-shadow:0 4px 12px rgba(0,0,0,.4);
            ">
              SAFE ${point.name}
            </div>
          `,
          `
            <div style="padding:12px;font-family:Arial,sans-serif">
              <strong>${point.name}</strong><br/><br/>
              Capacity: <b>${point.capacity}</b><br/><br/>
              <b style="color:#059669">SAFE ASSEMBLY AREA</b>
            </div>
          `
        );

        if (marker) overlaysRef.current.push(marker);
      });

      /* CROWD — same 2D coordinate projection. */
      const agents = crowdSimulation?.agents ?? [];

      if (mapplsObject.Marker && agents.length > 0) {
        const sample =
          agents.length > 250
            ? agents.filter(
                (_agent, index) =>
                  index %
                    Math.ceil(agents.length / 250) ===
                  0
              )
            : agents;

        sample.forEach((agent) => {
          const marker = addMarker(
            mapplsObject,
            mapRef.current,
            resqtwinToMappls(agent.x, agent.y),
            `
              <div style="
                width:8px;
                height:8px;
                border-radius:50%;
                background:${
                  agent.status === "trapped"
                    ? "#ef4444"
                    : agent.status === "safe"
                      ? "#34d399"
                      : "#38bdf8"
                };
                border:1px solid white;
                box-shadow:0 0 7px currentColor;
              "></div>
            `
          );

          if (marker) overlaysRef.current.push(marker);
        });
      }
    };

    mapplsObject.initialize(
      key,
      {
        map: true,
        version: "3.0",
      },
      () => {
        if (cancelled || !mapContainerRef.current) return;

        try {
          const map = mapplsObject.Map({
            id: mapContainerRef.current.id,
            properties: {
              center: [
                SNIST_MAP_CENTER.lat,
                SNIST_MAP_CENTER.lng,
              ],
              zoom: 17,
              zoomControl: true,
              location: true,
              fullscreenControl: true,
              traffic: false,
              clickableIcons: true,
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

            drawLayers();
          }, 1000);
        } catch (mapError) {
          console.error("Mappls map creation failed:", mapError);
          setError("Unable to create Mappls map.");
        }
      }
    );

    return () => {
      cancelled = true;
      clearOverlays();

      try {
        mapRef.current?.remove?.();
      } catch {
        // Ignore SDK cleanup errors.
      }

      mapRef.current = null;
    };
  }, [scenario, crowdSimulation]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "600px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "12px",
      }}
    >
      <div
        id="resqtwin-map"
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "600px",
        }}
      />

      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15,23,42,.96)",
            color: "#f8fafc",
            fontSize: 15,
            fontWeight: 600,
            zIndex: 50,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 16,
          top: 16,
          pointerEvents: "none",
          zIndex: 20,
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(2,6,23,.94)",
          border: "1px solid rgba(34,211,238,.3)",
          color: "#fff",
          fontFamily: "Arial,sans-serif",
          boxShadow: "0 8px 24px rgba(0,0,0,.35)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800 }}>
          ResQTwin | Mappls Digital Twin
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: "#94a3b8",
          }}
        >
          LIVE | SAME GEOMETRY AS 2D TWIN
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
            minWidth: 130,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#94a3b8",
              letterSpacing: 1,
            }}
          >
            ACTIVE DISASTER
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 17,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            {scenario.type}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 11,
              color: "#cbd5e1",
            }}
          >
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
          background: "rgba(2,6,23,.94)",
          border: "1px solid rgba(148,163,184,.2)",
          color: "#fff",
          fontFamily: "Arial,sans-serif",
          fontSize: 11,
        }}
      >
        <b>2630</b> people | Roads <b>{roads.length}</b> | Buildings <b>{buildings.length}</b>
      </div>

      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          zIndex: 20,
          padding: "10px 12px",
          borderRadius: 12,
          background: "rgba(2,6,23,.94)",
          border: "1px solid rgba(148,163,184,.2)",
          color: "#cbd5e1",
          fontFamily: "Arial,sans-serif",
          fontSize: 10,
        }}
      >
        <div>
          <span style={{ color: "#06b6d4" }}>●</span> Open road
        </div>
        <div style={{ marginTop: 4 }}>
          <span style={{ color: "#ef4444" }}>●</span> Blocked road
        </div>
        <div style={{ marginTop: 4 }}>
          <span style={{ color: "#34d399" }}>●</span> Exit / assembly
        </div>
      </div>
    </div>
  );
}
