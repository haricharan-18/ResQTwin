import { useEffect, useRef } from "react";
import { mappls } from "mappls-web-maps";

import type { DigitalTwinState } from "../lib/digitalTwinState";
import { CAMPUS_MAP_CENTER } from "../data/digitalTwinModel";
import { addAllMapplsLayers } from "../lib/mapplsLayers";
import DigitalTwinOverlay from "./DigitalTwinOverlay";

interface MapplsMapProps {
  twinState: DigitalTwinState;
}

const MAPPLS_KEY = import.meta.env.VITE_MAPPLS_KEY;

export default function MapplsMap({ twinState }: MapplsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!MAPPLS_KEY) {
      console.error("VITE_MAPPLS_KEY is not configured.");
      return;
    }

    let cancelled = false;

    const mapplsObject = new mappls();

    const clearLayers = () => {
      layersRef.current.forEach((layer) => {
        try {
          layer?.remove?.();
        } catch {
          // Ignore SDK cleanup errors.
        }
      });

      layersRef.current = [];
    };

    const renderLayers = () => {
      if (cancelled || !mapRef.current) return;

      clearLayers();

      const result = addAllMapplsLayers({
        map: mapRef.current,
        mapplsObject,
        twinState,
      });

      layersRef.current = Object.values(result)
        .flat()
        .filter(Boolean);
    };

    mapplsObject.initialize(
      MAPPLS_KEY,
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
                CAMPUS_MAP_CENTER.lat,
                CAMPUS_MAP_CENTER.lng,
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
                mapplsObject.add3DModel({
                  map,
                });
              }
            } catch {
              // 3D landmark support is optional.
            }

            renderLayers();
          }, 1200);
        } catch (error) {
          console.error(
            "Mappls map creation failed:",
            error
          );
        }
      }
    );

    return () => {
      cancelled = true;

      clearLayers();

      try {
        mapRef.current?.remove?.();
      } catch {
        // Ignore SDK cleanup errors.
      }

      mapRef.current = null;
    };
  }, [twinState]);

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
        id="resqtwin-mappls-map"
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "600px",
        }}
      />

      {!MAPPLS_KEY && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15,23,42,.96)",
            color: "#f8fafc",
            fontSize: "15px",
            fontWeight: 600,
            zIndex: 50,
          }}
        >
          Mappls key is not configured.
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
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          🚨 ResQTwin • Mappls Digital Twin
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: "#94a3b8",
          }}
        >
          LIVE • SNIST CAMPUS
        </div>
      </div>
    </div>
  );
}
