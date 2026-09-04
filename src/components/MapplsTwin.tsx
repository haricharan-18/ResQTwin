import React, { useEffect, useRef, useState } from "react";
import { mappls } from "mappls-web-maps";

import { CAMPUS_MAP_CENTER } from "../data/digitalTwinModel";
import { addAllMapplsLayers } from "../lib/mapplsLayers";
import type { DigitalTwinState } from "../lib/digitalTwinState";
import DigitalTwinOverlay from "./DigitalTwinOverlay";

interface MapplsTwinProps {
  twinState: DigitalTwinState;
}

export default function MapplsTwin({ twinState }: MapplsTwinProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const mapplsObjectRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const readyRef = useRef(false);
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

  const drawLayers = (state: DigitalTwinState) => {
    if (!mapRef.current || !mapplsObjectRef.current) return;
    clearOverlays();
    const result = addAllMapplsLayers({
      map: mapRef.current,
      mapplsObject: mapplsObjectRef.current,
      twinState: state,
    });
    overlaysRef.current = Object.values(result).flat().filter(Boolean);
  };

  useEffect(() => {
    const key = import.meta.env.VITE_MAPPLS_KEY;
    if (!key) {
      setError("Mappls API key is missing.");
      return;
    }
    if (!mapContainerRef.current) return;

    let cancelled = false;
    const mapplsObject = new mappls();
    mapplsObjectRef.current = mapplsObject;

    mapplsObject.initialize(
      key,
      { map: true, version: "3.0" },
      () => {
        if (cancelled || !mapContainerRef.current) return;

        try {
          const map = mapplsObject.Map({
            id: mapContainerRef.current.id,
            properties: {
              center: [CAMPUS_MAP_CENTER.lat, CAMPUS_MAP_CENTER.lng],
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
            readyRef.current = true;
            drawLayers(twinState);
          }, 800);
        } catch (mapError) {
          console.error("Mappls map creation failed:", mapError);
          setError("Unable to create Mappls map.");
        }
      }
    );

    return () => {
      cancelled = true;
      readyRef.current = false;
      clearOverlays();
      try {
        mapRef.current?.remove?.();
      } catch {
        // Ignore SDK cleanup errors.
      }
      mapRef.current = null;
    };
    // Map instance is created once; live layers update in the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!readyRef.current) return;
    drawLayers(twinState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twinState]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <div
        id="resqtwin-map"
        ref={mapContainerRef}
        className="h-full min-h-[540px] w-full"
      />

      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/96 text-sm font-semibold text-slate-100">
          {error}
        </div>
      )}

      {!error && <DigitalTwinOverlay twinState={twinState} compact />}
    </div>
  );
}
