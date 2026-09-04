import React, { useEffect, useRef, useState } from "react";
import { mappls } from "mappls-web-maps";

interface MapplsTwinProps {
  scenario?: any;
  crowdSimulation?: any;
}

const MapplsTwin: React.FC<MapplsTwinProps> = ({
  scenario,
  crowdSimulation,
}) => {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const key = import.meta.env.VITE_MAPPLS_KEY;

    if (!key) {
      setError("Mappls API key is missing.");
      return;
    }

    let cancelled = false;

    const initializeMap = async () => {
      try {
        const mapplsClassObject = new mappls();

        mapplsClassObject.initialize(
          key,
          {
            map: true,
            version: "3.0",
          },
          () => {
            if (cancelled || !mapRef.current) return;

            const map = mapplsClassObject.Map({
              id: "resqtwin-map",
              properties: {
                center: [17.45585, 78.66667],
                zoom: 17,
                zoomControl: true,
                location: true,
                fullscreenControl: true,
                traffic: false,
              },
            });

            mapInstanceRef.current = map;

            setTimeout(() => {
              if (cancelled) return;

              try {
                if (mapplsClassObject.add3DModel) {
                  mapplsClassObject.add3DModel({
                    map,
                  });
                }
              } catch (e) {
                console.warn("Mappls 3D landmarks unavailable:", e);
              }

              setMapReady(true);
            }, 1200);
          }
        );
      } catch (err) {
        console.error(err);
        setError("Unable to initialize Mappls.");
      }
    };

    initializeMap();

    return () => {
      cancelled = true;

      try {
        if (mapInstanceRef.current?.remove) {
          mapInstanceRef.current.remove();
        }
      } catch {
        // Ignore Mappls cleanup errors.
      }

      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <div
        ref={mapRef}
        id="resqtwin-map"
        className="h-full w-full"
        style={{ minHeight: "520px" }}
      />

      {/* ResQTwin overlay */}
      <div className="pointer-events-none absolute left-4 top-4 z-10">
        <div className="rounded-lg border border-white/10 bg-slate-950/90 px-4 py-3 shadow-xl backdrop-blur">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                mapReady ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />

            <span className="text-sm font-semibold text-white">
              Mappls Digital Twin
            </span>
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {mapReady ? "Live • Map connected" : "Connecting to Mappls..."}
          </div>
        </div>
      </div>

      {/* Disaster status */}
      {scenario && (
        <div className="pointer-events-none absolute right-4 top-4 z-10">
          <div className="rounded-lg border border-red-500/20 bg-slate-950/90 px-4 py-3 shadow-xl backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Active Scenario
            </div>

            <div className="mt-1 text-sm font-bold uppercase text-red-400">
              {scenario.type || "None"}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Severity {scenario.severity ?? 0}/5
            </div>
          </div>
        </div>
      )}

      {/* Crowd status */}
      {crowdSimulation && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10">
          <div className="rounded-lg border border-white/10 bg-slate-950/90 px-4 py-3 shadow-xl backdrop-blur">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Crowd
            </div>

            <div className="mt-1 text-sm font-semibold text-white">
              {crowdSimulation.totalPeople ?? 0} people
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Evacuating: {crowdSimulation.evacuating ?? 0} • Trapped:{" "}
              {crowdSimulation.trapped ?? 0} • Safe:{" "}
              {crowdSimulation.safe ?? 0}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90">
          <div className="max-w-md rounded-xl border border-red-500/30 bg-slate-900 p-6 text-center">
            <div className="text-lg font-bold text-red-400">
              Mappls Connection Error
            </div>

            <div className="mt-2 text-sm text-slate-400">
              {error}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapplsTwin;