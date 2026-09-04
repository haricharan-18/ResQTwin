import React, { useEffect, useRef, useState } from "react";
import { mappls } from "mappls-web-maps";

import {
  buildings,
  exits,
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
   * Remove every ResQTwin overlay from Mappls.
   */
  const clearOverlays = () => {
    const map = mapInstanceRef.current;
    const mapplsObject = mapplsRef.current;

    if (!map || !mapplsObject) {
      overlaysRef.current = [];
      return;
    }

    overlaysRef.current.forEach((overlay) => {
      try {
        mapplsObject.removeLayer?.({
          map,
          layer: overlay,
        });
      } catch {
        try {
          overlay?.remove?.();
        } catch {
          // Ignore cleanup errors.
        }
      }
    });

    overlaysRef.current = [];
  };

  /*
   * Draw semantic ResQTwin intelligence on top of the
   * REAL SNIST Mappls map.
   *
   * IMPORTANT:
   * We do NOT recreate the old 2D campus geometry here.
   */
  const drawResQTwinLayers = (
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

    const blockedExits =
      new Set(
        scenario?.blockedExits ?? []
      );

    /*
     * =====================================================
     * BUILDINGS
     * =====================================================
     *
     * We place a compact semantic marker at the
     * building's real-campus anchor.
     *
     * The actual Mappls map remains visible underneath,
     * including the real building footprint.
     */
    mapBuildings.forEach((building) => {
      try {
        if (!mapplsObject.Marker) return;

        const affected =
          affectedBuildings.has(building.id);

        const marker =
          mapplsObject.Marker({
            map,

            position: {
              lat: building.mappls.lat,
              lng: building.mappls.lng,
            },

            html: `
              <div
                style="
                  transform:translate(-50%,-100%);
                  display:flex;
                  flex-direction:column;
                  align-items:center;
                  font-family:Arial,sans-serif;
                  pointer-events:auto;
                "
              >
                <div
                  style="
                    padding:6px 9px;
                    border-radius:9px;
                    background:${
                      affected
                        ? "rgba(127,29,29,0.97)"
                        : "rgba(15,23,42,0.96)"
                    };
                    border:2px solid ${
                      affected
                        ? "#ef4444"
                        : "#22d3ee"
                    };
                    color:#fff;
                    font-size:11px;
                    font-weight:800;
                    white-space:nowrap;
                    box-shadow:0 4px 14px rgba(0,0,0,.45);
                  "
                >
                  ${
                    affected
                      ? "🚨 AFFECTED"
                      : "🏢"
                  }
                  ${building.name}
                </div>

                <div
                  style="
                    width:11px;
                    height:11px;
                    margin-top:-1px;
                    border-radius:50%;
                    background:${
                      affected
                        ? "#ef4444"
                        : "#22d3ee"
                    };
                    border:2px solid #fff;
                    box-shadow:0 2px 8px rgba(0,0,0,.45);
                  "
                ></div>
              </div>
            `,

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
                  ${
                    affected
                      ? "🚨 "
                      : "🏢 "
                  }
                  ${building.name}
                </div>

                <div
                  style="
                    font-size:12px;
                    line-height:1.8;
                  "
                >
                  👥 Occupants:
                  <b>${building.occupants}</b>

                  <br/>

                  🏢 Capacity:
                  <b>${building.capacity}</b>

                  <br/>

                  ⚠️ Base Risk:
                  <b>${building.risk}/100</b>
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
                      ? "🚨 AFFECTED BY ACTIVE DISASTER"
                      : "✓ CURRENTLY SAFE"
                  }
                </div>
              </div>
            `,

            popupOptions: {
              maxWidth: 320,
            },

            width: 30,
            height: 30,
          });

        overlaysRef.current.push(
          marker
        );
      } catch (e) {
        console.warn(
          `Building marker failed: ${building.name}`,
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
          blockedExits.has(exit.id);

        const marker =
          mapplsObject.Marker({
            map,

            position: {
              lat: exit.mappls.lat,
              lng: exit.mappls.lng,
            },

            html: `
              <div
                style="
                  transform:translate(-50%,-100%);
                  display:flex;
                  flex-direction:column;
                  align-items:center;
                  font-family:Arial,sans-serif;
                  pointer-events:auto;
                "
              >
                <div
                  style="
                    padding:5px 8px;
                    border-radius:8px;
                    background:${
                      blocked
                        ? "rgba(127,29,29,0.97)"
                        : "rgba(6,78,59,0.97)"
                    };
                    border:2px solid ${
                      blocked
                        ? "#ef4444"
                        : "#34d399"
                    };
                    color:#fff;
                    font-size:10px;
                    font-weight:800;
                    white-space:nowrap;
                    box-shadow:0 4px 12px rgba(0,0,0,.4);
                  "
                >
                  ${
                    blocked
                      ? "🚫"
                      : "🚪"
                  }
                  ${exit.name}
                </div>

                <div
                  style="
                    width:9px;
                    height:9px;
                    margin-top:-1px;
                    border-radius:50%;
                    background:${
                      blocked
                        ? "#ef4444"
                        : "#34d399"
                    };
                    border:2px solid #fff;
                  "
                ></div>
              </div>
            `,

            popupHtml: `
              <div
                style="
                  padding:12px;
                  font-family:Arial,sans-serif;
                "
              >
                <div
                  style="
                    font-size:15px;
                    font-weight:700;
                  "
                >
                  ${
                    blocked
                      ? "🚫 "
                      : "🚪 "
                  }
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
          `Exit marker failed: ${exit.name}`,
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
      try {
        if (!mapplsObject.Marker) return;

        const marker =
          mapplsObject.Marker({
            map,

            position: {
              lat: point.mappls.lat,
              lng: point.mappls.lng,
            },

            html: `
              <div
                style="
                  transform:translate(-50%,-100%);
                  display:flex;
                  flex-direction:column;
                  align-items:center;
                  font-family:Arial,sans-serif;
                  pointer-events:auto;
                "
              >
                <div
                  style="
                    padding:5px 8px;
                    border-radius:8px;
                    background:rgba(6,78,59,0.97);
                    border:2px solid #34d399;
                    color:#fff;
                    font-size:10px;
                    font-weight:800;
                    white-space:nowrap;
                    box-shadow:0 4px 12px rgba(0,0,0,.4);
                  "
                >
                  🟢 ${point.name}
                </div>

                <div
                  style="
                    width:10px;
                    height:10px;
                    margin-top:-1px;
                    border-radius:50%;
                    background:#34d399;
                    border:2px solid #fff;
                  "
                ></div>
              </div>
            `,

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

                Capacity:
                <b>${point.capacity}</b>

                <br/><br/>

                <b style="color:#059669">
                  SAFE ASSEMBLY AREA
                </b>
              </div>
            `,
          });

        overlaysRef.current.push(
          marker
        );
      } catch (e) {
        console.warn(
          `Assembly marker failed: ${point.name}`,
          e
        );
      }
    });
  };

  /*
   * =====================================================
   * MAP INITIALIZATION
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
                  center: {
                    lat: SNIST_MAP_CENTER.lat,
                    lng: SNIST_MAP_CENTER.lng,
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

            /*
             * Give Mappls time to create the
             * vector map before adding overlays.
             */
            setTimeout(() => {
              if (cancelled) return;

              try {
                if (
                  mapplsClassObject.add3DModel
                ) {
                  mapplsClassObject.add3DModel({
                    map,
                  });
                }
              } catch (e) {
                console.warn(
                  "Mappls 3D landmarks unavailable:",
                  e
                );
              }

              drawResQTwinLayers(
                map,
                mapplsClassObject
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
        // Ignore cleanup errors.
      }

      mapInstanceRef.current = null;
      mapplsRef.current = null;
    };

    // Initialize Mappls only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * =====================================================
   * LIVE DISASTER UPDATE
   * =====================================================
   *
   * When fire/flood/etc. changes, redraw only the
   * semantic ResQTwin markers.
   */
  useEffect(() => {
    if (
      !mapReady ||
      !mapInstanceRef.current ||
      !mapplsRef.current
    ) {
      return;
    }

    drawResQTwinLayers(
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
      scenario?.blockedExits ?? []
    ),
  ]);

  const affectedCount =
    scenario?.affectedBuildings?.length ?? 0;

  const blockedExitCount =
    scenario?.blockedExits?.length ?? 0;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">

      {/* REAL MAPPLS CAMPUS */}
      <div
        ref={mapRef}
        id="resqtwin-map"
        className="h-full w-full"
        style={{
          minHeight: "520px",
        }}
      />

      {/* =================================================
          RESQTWIN HEADER
          ================================================= */}
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

      {/* =================================================
          CAMPUS INTELLIGENCE
          ================================================= */}
      {mapReady && (
        <div className="pointer-events-none absolute left-4 top-24 z-10">

          <div className="rounded-xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-xl backdrop-blur">

            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
              Live Campus Intelligence
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
                  REAL
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
                Exit Alerts
                <span className="ml-2 font-bold text-red-400">
                  {blockedExitCount}
                </span>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          ACTIVE DISASTER
          ================================================= */}
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

      {/* =================================================
          LIVE CROWD
          ================================================= */}
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

      {/* =================================================
          LEGEND
          ================================================= */}
      {mapReady && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10">

          <div className="rounded-xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-xl backdrop-blur">

            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              ResQTwin Layer
            </div>

            <div className="space-y-1.5 text-xs">

              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                Campus building
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                Disaster affected
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Exit / assembly
              </div>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          ERROR
          ================================================= */}
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