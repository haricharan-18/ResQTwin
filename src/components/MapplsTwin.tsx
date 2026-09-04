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
  campusXYToMappls,
  buildingsToMappls,
  exitsToMappls,
  roadsToMappls,
  assemblyPointsToMappls,
} from "../lib/mapplsCampus";

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
  const mapplsRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState("");

  /*
   * Remove all ResQTwin layers from the Mappls map.
   */
  const clearCampusLayers = () => {
    const map = mapInstanceRef.current;
    const mapplsObject = mapplsRef.current;

    if (!map || !mapplsObject) return;

    overlaysRef.current.forEach((layer) => {
      try {
        mapplsObject.removeLayer?.({
          map,
          layer,
        });
      } catch {
        try {
          layer?.remove?.();
        } catch {
          // Ignore cleanup failures.
        }
      }
    });

    overlaysRef.current = [];
  };

  /*
   * Draw ResQTwin's digital-twin infrastructure
   * over the real SNIST Mappls map.
   */
  const drawCampusLayers = (
    map: any,
    mapplsObject: any
  ) => {
    clearCampusLayers();

    const mapBuildings =
      buildingsToMappls(buildings);

    const mapExits =
      exitsToMappls(exits);

    const mapRoads =
      roadsToMappls(roads);

    const mapAssemblyPoints =
      assemblyPointsToMappls(
        assemblyPoints
      );

    const affectedBuildings = new Set(
      scenario?.affectedBuildings ?? []
    );

    const blockedRoads = new Set(
      scenario?.blockedRoads ?? []
    );

    const blockedExits = new Set(
      scenario?.blockedExits ?? []
    );

    /*
     * =====================================================
     * BUILDING FOOTPRINTS
     * =====================================================
     */
    mapBuildings.forEach((building) => {
      try {
        if (!mapplsObject.Polygon) return;

        const topLeft =
          campusXYToMappls(
            building.x,
            building.y
          );

        const topRight =
          campusXYToMappls(
            building.x + building.width,
            building.y
          );

        const bottomRight =
          campusXYToMappls(
            building.x + building.width,
            building.y + building.height
          );

        const bottomLeft =
          campusXYToMappls(
            building.x,
            building.y + building.height
          );

        const affected =
          affectedBuildings.has(building.id);

        const polygon =
          mapplsObject.Polygon({
            map,

            paths: [
              {
                lat: topLeft.lat,
                lng: topLeft.lng,
              },
              {
                lat: topRight.lat,
                lng: topRight.lng,
              },
              {
                lat: bottomRight.lat,
                lng: bottomRight.lng,
              },
              {
                lat: bottomLeft.lat,
                lng: bottomLeft.lng,
              },
            ],

            strokeColor: affected
              ? "#ef4444"
              : "#06b6d4",

            strokeOpacity: 1,

            strokeWeight: affected
              ? 5
              : 3,

            fillColor: affected
              ? "#ef4444"
              : "#0891b2",

            fillOpacity: affected
              ? 0.45
              : 0.22,

            popupHtml: `
              <div
                style="
                  padding:12px;
                  min-width:220px;
                  font-family:Arial,sans-serif;
                "
              >
                <div
                  style="
                    font-size:16px;
                    font-weight:700;
                    margin-bottom:8px;
                  "
                >
                  ${affected ? "🚨" : "🏢"}
                  ${building.name}
                </div>

                <div style="font-size:12px;line-height:1.8">
                  👥 Occupants:
                  <b>${building.occupants}</b>
                  <br/>

                  🏢 Capacity:
                  <b>${building.capacity}</b>
                  <br/>

                  ⚠️ Base Risk:
                  <b>${building.risk}/100</b>
                  <br/>

                  📍 Digital Twin ID:
                  <b>${building.id}</b>
                </div>

                <div
                  style="
                    margin-top:8px;
                    font-weight:700;
                    color:${
                      affected
                        ? "#dc2626"
                        : "#059669"
                    };
                  "
                >
                  ${
                    affected
                      ? "🚨 AFFECTED BUILDING"
                      : "✓ BUILDING SAFE"
                  }
                </div>
              </div>
            `,
          });

        overlaysRef.current.push(
          polygon
        );

        /*
         * Building center marker.
         */
        if (mapplsObject.Marker) {
          const marker =
            mapplsObject.Marker({
              map,

              position: {
                lat: building.mappls.lat,
                lng: building.mappls.lng,
              },

              popupHtml: `
                <div
                  style="
                    padding:10px;
                    font-family:Arial,sans-serif;
                  "
                >
                  <b>
                    ${affected ? "🚨 " : "🏢 "}
                    ${building.name}
                  </b>

                  <br/><br/>

                  Occupants:
                  <b>${building.occupants}</b>

                  <br/>

                  Risk:
                  <b>${building.risk}/100</b>
                </div>
              `,
            });

          overlaysRef.current.push(
            marker
          );
        }
      } catch (e) {
        console.warn(
          `Building layer failed for ${building.name}:`,
          e
        );
      }
    });

    /*
     * =====================================================
     * ROADS
     * =====================================================
     */
    mapRoads.forEach((roadData) => {
      try {
        if (!mapplsObject.Polyline) return;

        const road = roadData.road;

        const blocked =
          blockedRoads.has(road.id) ||
          road.blocked;

        const line =
          mapplsObject.Polyline({
            map,

            path: [
              {
                lat: roadData.from.lat,
                lng: roadData.from.lng,
              },
              {
                lat: roadData.to.lat,
                lng: roadData.to.lng,
              },
            ],

            strokeColor: blocked
              ? "#ef4444"
              : "#06b6d4",

            strokeOpacity: 0.95,

            strokeWeight: blocked
              ? 9
              : 6,

            zIndex: blocked
              ? 20
              : 10,

            popupHtml: `
              <div
                style="
                  padding:12px;
                  min-width:200px;
                  font-family:Arial,sans-serif;
                "
              >
                <div
                  style="
                    font-size:15px;
                    font-weight:700;
                  "
                >
                  ${blocked ? "🚧" : "🛣️"}
                  ${road.name}
                </div>

                <br/>

                Distance:
                <b>${road.distance}m</b>

                <br/>

                Capacity:
                <b>${road.capacity}</b>

                <br/><br/>

                <b
                  style="
                    color:${
                      blocked
                        ? "#dc2626"
                        : "#059669"
                    };
                  "
                >
                  ${
                    blocked
                      ? "🚨 ROAD BLOCKED"
                      : "✓ ROAD OPEN"
                  }
                </b>
              </div>
            `,
          });

        overlaysRef.current.push(
          line
        );
      } catch (e) {
        console.warn(
          `Road layer failed for ${roadData.road.name}:`,
          e
        );
      }
    });

    /*
     * =====================================================
     * EMERGENCY EXITS
     * =====================================================
     */
    mapExits.forEach((exit) => {
      try {
        if (!mapplsObject.Marker) return;

        const blocked =
          blockedExits.has(exit.id) ||
          exit.blocked;

        const marker =
          mapplsObject.Marker({
            map,

            position: {
              lat: exit.mappls.lat,
              lng: exit.mappls.lng,
            },

            popupHtml: `
              <div
                style="
                  padding:12px;
                  min-width:190px;
                  font-family:Arial,sans-serif;
                "
              >
                <div
                  style="
                    font-size:15px;
                    font-weight:700;
                  "
                >
                  ${blocked ? "🚫" : "🚪"}
                  ${exit.name}
                </div>

                <br/>

                Capacity:
                <b>${exit.capacity}</b>

                <br/><br/>

                <b
                  style="
                    color:${
                      blocked
                        ? "#dc2626"
                        : "#059669"
                    };
                  "
                >
                  ${
                    blocked
                      ? "🚨 EXIT BLOCKED"
                      : "✓ EXIT AVAILABLE"
                  }
                </b>
              </div>
            `,
          });

        overlaysRef.current.push(
          marker
        );
      } catch (e) {
        console.warn(
          `Exit layer failed for ${exit.name}:`,
          e
        );
      }
    });

    /*
     * =====================================================
     * ASSEMBLY POINTS
     * =====================================================
     */
    mapAssemblyPoints.forEach((point) => {
      try {
        if (!mapplsObject.Circle) return;

        const circle =
          mapplsObject.Circle({
            map,

            center: {
              lat: point.mappls.lat,
              lng: point.mappls.lng,
            },

            radius: 35,

            strokeColor: "#10b981",
            strokeOpacity: 1,
            strokeWeight: 3,

            fillColor: "#10b981",
            fillOpacity: 0.28,

            popupHtml: `
              <div
                style="
                  padding:12px;
                  min-width:190px;
                  font-family:Arial,sans-serif;
                "
              >
                <div
                  style="
                    font-size:15px;
                    font-weight:700;
                  "
                >
                  🟢 ${point.name}
                </div>

                <br/>

                Assembly Capacity:
                <b>${point.capacity}</b>

                <br/><br/>

                <b style="color:#059669">
                  SAFE ASSEMBLY AREA
                </b>
              </div>
            `,
          });

        overlaysRef.current.push(
          circle
        );
      } catch (e) {
        console.warn(
          `Assembly layer failed for ${point.name}:`,
          e
        );
      }
    });
  };

  /*
   * =====================================================
   * INITIALIZE MAP
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
      const mapplsClassObject =
        new mappls();

      mapplsRef.current =
        mapplsClassObject;

      mapplsClassObject.initialize(
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
              mapplsClassObject.Map({
                id: "resqtwin-map",

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
                },
              });

            mapInstanceRef.current =
              map;

            /*
             * Draw after the map is loaded.
             */
            map.on?.("load", () => {
              if (cancelled) return;

              try {
                if (
                  mapplsClassObject.add3DModel
                ) {
                  mapplsClassObject.add3DModel(
                    {
                      map,
                    }
                  );
                }
              } catch (e) {
                console.warn(
                  "Mappls 3D landmarks unavailable:",
                  e
                );
              }

              setMapReady(true);
            });

            /*
             * Fallback for SDK versions
             * where the load event is delayed.
             */
            setTimeout(() => {
              if (
                cancelled ||
                mapReady
              ) {
                return;
              }

              try {
                if (
                  mapplsClassObject.add3DModel
                ) {
                  mapplsClassObject.add3DModel(
                    {
                      map,
                    }
                  );
                }
              } catch {
                // Ignore 3D landmark errors.
              }

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

      clearCampusLayers();

      try {
        mapInstanceRef.current?.remove?.();
      } catch {
        // Ignore cleanup errors.
      }

      mapInstanceRef.current = null;
      mapplsRef.current = null;
    };

    // Map initialization should only happen once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * =====================================================
   * REDRAW WHEN DISASTER STATE CHANGES
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

    drawCampusLayers(
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
    scenario?.affectedBuildings?.length ?? 0;

  const blockedRoadCount =
    scenario?.blockedRoads?.length ?? 0;

  const blockedExitCount =
    scenario?.blockedExits?.length ?? 0;

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

      {/* Header */}
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
              ? "LIVE • SNIST CAMPUS"
              : "CONNECTING TO MAPPLS..."}
          </div>
        </div>
      </div>

      {/* Campus intelligence */}
      {mapReady && (
        <div className="pointer-events-none absolute left-4 top-24 z-10">
          <div className="rounded-xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-xl backdrop-blur">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
              Campus Digital Twin
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
                Exits
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
                Blocked
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

      {/* Disaster */}
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
              Severity{" "}
              {scenario.severity ?? 0}/5
            </div>
          </div>
        </div>
      )}

      {/* Crowd */}
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
                {crowdSimulation.safe ?? 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {mapReady && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10">
          <div className="rounded-xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-xl backdrop-blur">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Twin Legend
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                Buildings / open roads
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Affected / blocked
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Exits / assembly
              </div>
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