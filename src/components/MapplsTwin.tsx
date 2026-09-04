import React, { useEffect, useRef, useState } from "react";
import { mappls } from "mappls-web-maps";

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
        }}
      />

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
          LIVE | SNIST CAMPUS
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
