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
  buildingsToMappls,
  exitsToMappls,
  assemblyPointsToMappls,
} from "../lib/mapplsCampus";

interface MapplsTwinProps {
  scenario?: any;
  crowdSimulation?: any;
}

type Coord = {
  lat: number;
  lng: number;
};

/*
 * Approximate evacuation-corridor anchors following the
 * visible road structure around the SNIST campus.
 *
 * These are visualization corridors for the ResQTwin
 * simulation; Mappls remains the underlying geographic map.
 */
const RESQTWIN_ROAD_PATHS: Record<string, Coord[]> = {
  r1: [
    { lat: 17.45445, lng: 78.66635 },
    { lat: 17.45475, lng: 78.66670 },
    { lat: 17.45510, lng: 78.66705 },
  ],

  r2: [
    { lat: 17.45510, lng: 78.66705 },
    { lat: 17.45555, lng: 78.66720 },
    { lat: 17.45645, lng: 78.66720 },
  ],

  r3: [
    { lat: 17.45510, lng: 78.66705 },
    { lat: 17.45515, lng: 78.66800 },
    { lat: 17.45515, lng: 78.66915 },
  ],

  r4: [
    { lat: 17.45445, lng: 78.66635 },
    { lat: 17.45405, lng: 78.66655 },
    { lat: 17.45355, lng: 78.66695 },
  ],

  r5: [
    { lat: 17.45385, lng: 78.66680 },
    { lat: 17.45415, lng: 78.66800 },
    { lat: 17.45515, lng: 78.66915 },
  ],

  r6: [
    { lat: 17.45645, lng: 78.66720 },
    { lat: 17.45595, lng: 78.66820 },
    { lat: 17.45515, lng: 78.66915 },
  ],

  r7: [
    { lat: 17.45385, lng: 78.66680 },
    { lat: 17.45390, lng: 78.66800 },
    { lat: 17.45390, lng: 78.66890 },
  ],
};

const MapplsTwin: React.FC<MapplsTwinProps> = ({
  scenario,
  crowdSimulation,
}) => {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const mapplsRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState("");

  const removeOverlay = (overlay: any) => {
    try {
      overlay?.remove?.();
    } catch {
      // Ignore.
    }
  };

  const clearOverlays = () => {
    overlaysRef.current.forEach(removeOverlay);
    overlaysRef.current = [];
  };

  const drawLayers = (
    map: any,
    mapplsObject: any
  ) => {
    clearOverlays();

    const mapBuildings =
      buildingsToMappls(buildings);

    const mapExits =
      exitsToMappls(exits);

    const mapAssemblyPoints =
      assemblyPointsToMappls(
        assemblyPoints
      );

    const affectedBuildings =
      new Set(
        scenario?.affectedBuildings ?? []
      );

    const blockedRoads =
      new Set(
        scenario?.blockedRoads ?? []
      );

    const blockedExits =
      new Set(
        scenario?.blockedExits ?? []
      );

    /*
     * =====================================================
     * BUILDINGS
     * =====================================================
     */
    mapBuildings.forEach((building) => {
      if (!mapplsObject.Marker) return;

      const affected =
        affectedBuildings.has(
          building.id
        );

      try {
        const marker =
          mapplsObject.Marker({
            map,

            position: {
              lat: building.mappls.lat,
              lng: building.mappls.lng,
            },

            html: `
              <div style="
                transform:translate(-50%,-100%);
                display:flex;
                flex-direction:column;
                align-items:center;
                font-family:Arial,sans-serif;
                pointer-events:auto;
              ">
                <div style="
                  padding:6px 10px;
                  border-radius:9px;
                  background:${
                    affected
                      ? "rgba(127,29,29,.97)"
                      : "rgba(15,23,42,.97)"
                  };
                  border:2px solid ${
                    affected
                      ? "#ef4444"
                      : "#22d3ee"
                  };
                  color:white;
                  font-size:11px;
                  font-weight:800;
                  white-space:nowrap;
                  box-shadow:0 4px 14px rgba(0,0,0,.5);
                ">
                  ${
                    affected
                      ? "🚨 "
                      : "🏢 "
                  }
                  ${building.name}
                </div>

                <div style="
                  width:10px;
                  height:10px;
                  margin-top:-1px;
                  border-radius:50%;
                  background:${
                    affected
                      ? "#ef4444"
                      : "#22d3ee"
                  };
                  border:2px solid white;
                "></div>
              </div>
            `,

            popupHtml: `
              <div style="
                padding:12px;
                min-width:210px;
                font-family:Arial,sans-serif;
              ">
                <div style="
                  font-size:16px;
                  font-weight:700;
                  margin-bottom:8px;
                ">
                  ${
                    affected
                      ? "🚨 "
                      : "🏢 "
                  }
                  ${building.name}
                </div>

                👥 Occupants:
                <b>${building.occupants}</b>

                <br/>

                ⚠️ Base Risk:
                <b>${building.risk}/100</b>

                <br/><br/>

                <b style="
                  color:${
                    affected
                      ? "#dc2626"
                      : "#059669"
                  };
                ">
                  ${
                    affected
                      ? "AFFECTED BY DISASTER"
                      : "CURRENTLY SAFE"
                  }
                </b>
              </div>
            `,
          });

        overlaysRef.current.push(marker);
      } catch (e) {
        console.warn(
          "Building marker failed:",
          building.name,
          e
        );
      }
    });

    /*
     * =====================================================
     * 7 RESQTWIN EVACUATION ROADS
     * =====================================================
     */
    if (mapplsObject.Polyline) {
      roads.forEach((road) => {
        const path =
          RESQTWIN_ROAD_PATHS[
            road.id
          ];

        if (!path) return;

        const blocked =
          blockedRoads.has(road.id) ||
          road.blocked;

        try {
          const polyline =
            mapplsObject.Polyline({
              map,

              path,

              strokeColor:
                blocked
                  ? "#ef4444"
                  : "#06b6d4",

              strokeOpacity: blocked
                ? 0.95
                : 0.72,

              strokeWeight:
                blocked
                  ? 8
                  : 5,

              zIndex:
                blocked
                  ? 30
                  : 15,

              popupHtml: `
                <div style="
                  padding:12px;
                  min-width:200px;
                  font-family:Arial,sans-serif;
                ">
                  <div style="
                    font-size:15px;
                    font-weight:700;
                    margin-bottom:8px;
                  ">
                    ${
                      blocked
                        ? "🚧 "
                        : "🛣️ "
                    }
                    ${road.name}
                  </div>

                  Distance:
                  <b>${road.distance}m</b>

                  <br/>

                  Capacity:
                  <b>${road.capacity}</b>

                  <br/><br/>

                  <b style="
                    color:${
                      blocked
                        ? "#dc2626"
                        : "#0891b2"
                    };
                  ">
                    ${
                      blocked
                        ? "🚨 ROAD BLOCKED"
                        : "✓ EVACUATION ROUTE OPEN"
                    }
                  </b>
                </div>
              `,
            });

          overlaysRef.current.push(
            polyline
          );
        } catch (e) {
          console.warn(
            "Road overlay failed:",
            road.name,
            e
          );
        }
      });
    }

    /*
     * =====================================================
     * EMERGENCY EXITS
     * =====================================================
     */
    mapExits.forEach((exit) => {
      if (!mapplsObject.Marker) return;

      const blocked =
        blockedExits.has(exit.id) ||
        exit.blocked;

      try {
        const marker =
          mapplsObject.Marker({
            map,

            position: {
              lat: exit.mappls.lat,
              lng: exit.mappls.lng,
            },

            html: `
              <div style="
                transform:translate(-50%,-100%);
                font-family:Arial,sans-serif;
              ">
                <div style="
                  padding:5px 8px;
                  border-radius:8px;
                  background:${
                    blocked
                      ? "rgba(127,29,29,.98)"
                      : "rgba(6,78,59,.98)"
                  };
                  border:2px solid ${
                    blocked
                      ? "#ef4444"
                      : "#34d399"
                  };
                  color:white;
                  font-size:10px;
                  font-weight:800;
                  white-space:nowrap;
                  box-shadow:0 4px 12px rgba(0,0,0,.45);
                ">
                  ${
                    blocked
                      ? "🚫"
                      : "🚪"
                  }
                  ${exit.name}
                </div>
              </div>
            `,

            popupHtml: `
              <div style="
                padding:12px;
                font-family:Arial,sans-serif;
              ">
                <b>
                  ${
                    blocked
                      ? "🚫 "
                      : "🚪 "
                  }
                  ${exit.name}
                </b>

                <br/><br/>

                Capacity:
                <b>${exit.capacity}</b>

                <br/><br/>

                <b style="
                  color:${
                    blocked
                      ? "#dc2626"
                      : "#059669"
                  };
                ">
                  ${
                    blocked
                      ? "EXIT BLOCKED"
                      : "EXIT AVAILABLE"
                  }
                </b>
              </div>
            `,
          });

        overlaysRef.current.push(marker);
      } catch (e) {
        console.warn(
          "Exit marker failed:",
          exit.name,
          e
        );
      }
    });

    /*
     * =====================================================
     * ASSEMBLY AREAS
     * =====================================================
     */
    mapAssemblyPoints.forEach((point) => {
      if (!mapplsObject.Marker) return;

      try {
        const marker =
          mapplsObject.Marker({
            map,

            position: {
              lat: point.mappls.lat,
              lng: point.mappls.lng,
            },

            html: `
              <div style="
                transform:translate(-50%,-100%);
                font-family:Arial,sans-serif;
              ">
                <div style="
                  padding:5px 8px;
                  border-radius:8px;
                  background:rgba(6,78,59,.98);
                  border:2px solid #34d399;
                  color:white;
                  font-size:10px;
                  font-weight:800;
                  white-space:nowrap;
                  box-shadow:0 4px 12px rgba(0,0,0,.4);
                ">
                  🟢 ${point.name}
                </div>
              </div>
            `,

            popupHtml: `
              <div style="
                padding:12px;
                font-family:Arial,sans-serif;
              ">
                <b>🟢 ${point.name}</b>

                <br/><br/>

                Capacity:
                <b>${point.capacity}</b>

                <br/><br/>

                <b style="color:#059669">
                  SAFE ASSEMBLY AREA
                </b>
              </div>
            `,
          });

        overlaysRef.current.push(marker);
      } catch (e) {
        console.warn(
          "Assembly marker failed:",
          point.name,
          e
        );
      }
    });
  };

  /*
   * =====================================================
   * INITIALIZE MAPPLS
   * =====================================================
   */
  useEffect(() => {
    const key =
      import.meta.env.VITE_MAPPLS_KEY;

    if (!key) {
      setError(
        "Mappls API key is missing."
      );
      return;
    }

    let cancelled = false;

    try {
      const mapplsObject =
        new mappls();

      mapplsRef.current =
        mapplsObject;

      mapplsObject.initialize(
        key,
        {
          map: true,
          version: "3.0",
        },
        () => {
          if (
            cancelled ||
            !mapRef.current
          ) {
            return;
          }

          try {
            const map =
              mapplsObject.Map({
                id: "resqtwin-map",

                properties: {
                  center: {
                    lat:
                      SNIST_MAP_CENTER.lat,
                    lng:
                      SNIST_MAP_CENTER.lng,
                  },

                  zoom: 17,

                  zoomControl: true,
                  location: true,
                  fullscreenControl: true,
                  traffic: false,
                },
              });

            mapInstanceRef.current =
              map;

            setTimeout(() => {
              if (cancelled) return;

              try {
                if (
                  mapplsObject.add3DModel
                ) {
                  mapplsObject.add3DModel({
                    map,
                  });
                }
              } catch {
                // 3D landmarks are optional.
              }

              drawLayers(
                map,
                mapplsObject
              );

              setMapReady(true);
            }, 1500);
          } catch (e) {
            console.error(e);

            setError(
              "Unable to create Mappls map."
            );
          }
        }
      );
    } catch (e) {
      console.error(e);

      setError(
        "Unable to initialize Mappls."
      );
    }

    return () => {
      cancelled = true;

      clearOverlays();

      try {
        mapInstanceRef.current?.remove?.();
      } catch {
        // Ignore.
      }

      mapInstanceRef.current = null;
      mapplsRef.current = null;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * =====================================================
   * LIVE DISASTER UPDATE
   * =====================================================
   */
  useEffect(() => {
    if (
      !mapReady ||
      !mapInstanceRef.current ||
      !mapplsRef.current
    ) {
      return;
    }

    drawLayers(
      mapInstanceRef.current,
      mapplsRef.current
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mapReady,
    scenario?.type,
    scenario?.severity,
    JSON.stringify(
      scenario?.affectedBuildings ?? []
    ),
    JSON.stringify(
      scenario?.blockedRoads ?? []
    ),
    JSON.stringify(
      scenario?.blockedExits ?? []
    ),
  ]);

  const affectedCount =
    scenario?.affectedBuildings?.length ??
    0;

  const blockedRoadCount =
    scenario?.blockedRoads?.length ??
    0;

  const blockedExitCount =
    scenario?.blockedExits?.length ??
    0;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">

      <div
        ref={mapRef}
        id="resqtwin-map"
        className="h-full w-full"
        style={{
          minHeight: "520px",
        }}
      />

      {/* HEADER */}
      <div className="pointer-events-none absolute left-4 top-4 z-10">
        <div className="rounded-xl border border-cyan-400/20 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur">

          <div className="flex items-center gap-2">

            <span
              className={`h-2.5 w-2.5 rounded-full ${
                mapReady
                  ? "bg-emerald-400"
                  : "bg-amber-400"
              }`}
            />

            <span className="text-sm font-bold text-white">
              ResQTwin • Mappls Digital Twin
            </span>

          </div>

          <div className="mt-1 text-xs text-slate-400">
            {mapReady
              ? "LIVE • REAL SNIST CAMPUS"
              : "CONNECTING TO MAPPLS..."}
          </div>

        </div>
      </div>

      {/* INTELLIGENCE */}
      {mapReady && (
        <div className="pointer-events-none absolute left-4 top-24 z-10">

          <div className="rounded-xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-xl backdrop-blur">

            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
              ResQTwin Intelligence
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs">

              <div className="text-slate-400">
                Buildings
                <span className="ml-2 font-bold text-cyan-300">
                  6
                </span>
              </div>

              <div className="text-slate-400">
                Roads
                <span className="ml-2 font-bold text-cyan-300">
                  7
                </span>
              </div>

              <div className="text-slate-400">
                Emergency Exits
                <span className="ml-2 font-bold text-emerald-300">
                  4
                </span>
              </div>

              <div className="text-slate-400">
                Assembly
                <span className="ml-2 font-bold text-emerald-300">
                  2
                </span>
              </div>

              <div className="text-slate-400">
                Affected
                <span className="ml-2 font-bold text-red-400">
                  {affectedCount}
                </span>
              </div>

              <div className="text-slate-400">
                Blocked Roads
                <span className="ml-2 font-bold text-red-400">
                  {blockedRoadCount}
                </span>
              </div>

            </div>

            {blockedExitCount > 0 && (
              <div className="mt-2 text-xs font-bold text-red-400">
                🚫 {blockedExitCount} exit
                {blockedExitCount > 1
                  ? "s"
                  : ""}{" "}
                blocked
              </div>
            )}

          </div>

        </div>
      )}

      {/* DISASTER */}
      {scenario && (
        <div className="pointer-events-none absolute right-4 top-4 z-10">

          <div className="rounded-xl border border-red-500/30 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur">

            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Active Disaster
            </div>

            <div className="mt-1 text-lg font-black uppercase text-red-400">
              {scenario.type || "NONE"}
            </div>

            <div className="text-xs text-slate-400">
              Severity {scenario.severity ?? 0}/5
            </div>

          </div>

        </div>
      )}

      {/* CROWD */}
      {crowdSimulation && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10">

          <div className="rounded-xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-xl backdrop-blur">

            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Live Crowd
            </div>

            <div className="mt-1 text-lg font-black text-white">
              {crowdSimulation.totalPeople ??
                0}

              <span className="ml-1 text-xs font-normal text-slate-400">
                people
              </span>
            </div>

            <div className="mt-1 text-xs text-slate-400">

              Evacuating:
              <span className="ml-1 text-cyan-300">
                {crowdSimulation.evacuating ??
                  0}
              </span>

              {" • "}

              Trapped:
              <span className="ml-1 text-red-400">
                {crowdSimulation.trapped ??
                  0}
              </span>

              {" • "}

              Safe:
              <span className="ml-1 text-emerald-400">
                {crowdSimulation.safe ??
                  0}
              </span>

            </div>

          </div>

        </div>
      )}

      {/* LEGEND */}
      {mapReady && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10">

          <div className="rounded-xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-xl backdrop-blur">

            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              ResQTwin Map Layer
            </div>

            <div className="space-y-1.5 text-xs">

              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-1.5 w-6 rounded-full bg-cyan-400" />
                Open evacuation road
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-1.5 w-6 rounded-full bg-red-500" />
                Blocked road / affected
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Exit / assembly
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ERROR */}
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