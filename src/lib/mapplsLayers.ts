import { useEffect, useRef } from 'react';
import { mappls } from 'mappls-web-maps';

import type { DisasterScenario } from '../lib/disasterEngine';
import type { CrowdSimulation } from '../lib/crowdEngine';

import { addAllMapplsLayers } from '../lib/mapplsLayers';

interface MapplsMapProps {
  scenario?: DisasterScenario;
  crowdSimulation?: CrowdSimulation;
}

const MAPPLS_TOKEN = import.meta.env.VITE_MAPPLS_TOKEN;

export default function MapplsMap({
  scenario,
  crowdSimulation,
}: MapplsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!MAPPLS_TOKEN) {
      console.error(
        'VITE_MAPPLS_TOKEN is not configured.'
      );
      return;
    }

    const mapplsObject = new mappls();

    mapplsObject.initialize(
      MAPPLS_TOKEN,
      {
        map: true,
        version: '3.0',
      },
      () => {
        if (!mapContainerRef.current) return;

        mapRef.current = mapplsObject.Map({
          id: mapContainerRef.current.id,
          properties: {
            center: [17.45, 78.57],
            zoom: 15,
            clickableIcons: true,
            zoomControl: true,
            location: true,
          },
        });

        renderLayers(mapplsObject);
      }
    );

    function renderLayers(mapplsObject: any) {
      if (!mapRef.current) return;

      layersRef.current.forEach((layer) => {
        try {
          layer?.remove?.();
        } catch {
          // Ignore SDK cleanup errors.
        }
      });

      layersRef.current = [];

      const result = addAllMapplsLayers({
        map: mapplsObject,
        state: {
          scenario,
          crowdSimulation,
        },
      });

      layersRef.current = Object.values(result)
        .flat()
        .filter(Boolean);
    }

    return () => {
      layersRef.current.forEach((layer) => {
        try {
          layer?.remove?.();
        } catch {
          // Ignore SDK cleanup errors.
        }
      });

      layersRef.current = [];
      mapRef.current = null;
    };
  }, [scenario, crowdSimulation]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '600px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
      }}
    >
      <div
        id="resqtwin-mappls-map"
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '600px',
        }}
      />

      {!MAPPLS_TOKEN && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            color: '#334155',
            fontSize: '15px',
            fontWeight: 500,
          }}
        >
          Mappls token is not configured.
        </div>
      )}
    </div>
  );
}