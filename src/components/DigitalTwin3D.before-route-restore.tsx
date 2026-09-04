import React, { useEffect, useMemo, useRef, useState } from 'react';
import { mappls } from 'mappls-web-maps';

import { CAMPUS_MAP_CENTER } from '../data/digitalTwinModel';
import { addAllMapplsLayers } from '../lib/mapplsLayers';
import type { DigitalTwinState } from '../lib/digitalTwinState';
import { buildDigitalTwinState } from '../lib/digitalTwinState';
import { calculateRiskAssessment } from '../lib/riskEngine';
import { createCrowdSimulation } from '../lib/crowdEngine';
import { simulateDisaster } from '../lib/disasterEngine';
import DigitalTwinOverlay from './DigitalTwinOverlay';

interface DigitalTwin3DProps {
  scenario?: any;
  crowdSimulation?: any;
  twinState?: DigitalTwinState;
}

export default function DigitalTwin3D({
  scenario,
  crowdSimulation,
  twinState,
}: DigitalTwin3DProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const mapplsRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [is3D, setIs3D] = useState(true);

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  /*
   * IMPORTANT:
   * Dashboard may provide the complete DigitalTwinState.
   * If it doesn't, construct the same state locally from
   * the current disaster + crowd information.
   */
  const resolvedTwinState = useMemo<DigitalTwinState | undefined>(() => {
    if (twinState) {
      return twinState;
    }

    const activeScenario =
      scenario ?? simulateDisaster('fire', 3);

    const activeCrowd =
      crowdSimulation ??
      createCrowdSimulation(activeScenario);

    const risk =
      calculateRiskAssessment(
        activeScenario,
        activeCrowd
      );

    return buildDigitalTwinState({
      scenario: activeScenario,
      crowd: activeCrowd,
      risk,
    });
  }, [twinState, scenario, crowdSimulation]);

  /*
   * Draw all ResQTwin operational information over
   * the genuine Mappls geographic map.
   */
  const drawLayers = (state?: DigitalTwinState) => {
    const map = mapRef.current;
    const mapplsObject = mapplsRef.current;

    if (!map || !mapplsObject || !state) {
      console.log(
        'RESQTWIN: overlay skipped',
        {
          map: !!map,
          mappls: !!mapplsObject,
          state: !!state,
        }
      );
      return;
    }

    console.log(
      'RESQTWIN: drawing overlays now'
    );

    /*
     * Remove previous ResQTwin overlay.
     */
    overlaysRef.current.forEach((overlay) => {
      try {
        overlay?.remove?.();
      } catch {
        // Ignore cleanup errors.
      }
    });

    overlaysRef.current = [];

    try {
      /*
       * IMPORTANT:
       * mapplsLayers expects:
       *
       *   mapplsObject
       *   map
       *   twinState
       *
       * as separate arguments.
       */
      const result = addAllMapplsLayers(
        mapplsObject,
        map,
        state
      );

      if (result) {
        overlaysRef.current = [result];
      }

      console.log(
        'RESQTWIN: overlays created',
        result
      );
    } catch (layerError) {
      console.error(
        'RESQTWIN: overlay drawing failed',
        layerError
      );
    }
  };

  /*
   * Create Mappls map.
   *
   * We deliberately DO NOT call setPitch/setBearing here.
   * Your Mappls SDK was throwing getBearing/getZoom errors
   * from those camera-control calls.
   *
   * Mappls itself remains responsible for the genuine 3D view.
   */
  useEffect(() => {
    const key = import.meta.env.VITE_MAPPLS_KEY;

    if (!key) {
      setError('Mappls API key is missing.');
      return;
    }

    if (!mapContainerRef.current) {
      return;
    }

    let cancelled = false;

    const mapplsObject = new mappls();
    mapplsRef.current = mapplsObject;

    console.log(
      'RESQTWIN: initializing Mappls'
    );

    mapplsObject.initialize(
      key,
      {
        map: true,
        version: '3.0',
      },
      () => {
        if (
          cancelled ||
          !mapContainerRef.current
        ) {
          return;
        }

        try {
          const map = mapplsObject.Map({
            id: mapContainerRef.current.id,
            properties: {
              center: [
                CAMPUS_MAP_CENTER.lat,
                CAMPUS_MAP_CENTER.lng,
              ],
              zoom: 17,
                tilt: 55,
                heading: 345,
              zoomControl: true,
              location: true,
              fullscreenControl: true,
              traffic: false,
              clickableIcons: true,
            },
          });

          mapRef.current = map;

          try {
            mapplsObject.add3DModel?.({ map });
            console.log("RESQTWIN: Mappls 3D landmarks restored");
          } catch (e) {
            console.warn("RESQTWIN: 3D landmarks unavailable", e);
          }

          console.log(
            'RESQTWIN: Mappls map created',
            map
          );

          /*
           * Select a real geographic location by clicking
           * on the Mappls map.
           */
          map.addListener?.(
            'click',
            (event: any) => {
              try {
                const position =
                  event?.lngLat ??
                  event?.latlng ??
                  event?.coordinate ??
                  event?.latLng;

                if (!position) {
                  return;
                }

                const lat =
                  position.lat ??
                  position.latitude;

                const lng =
                  position.lng ??
                  position.lon ??
                  position.longitude;

                if (
                  typeof lat === 'number' &&
                  typeof lng === 'number'
                ) {
                  setSelectedLocation({
                    lat,
                    lng,
                  });
                }
              } catch {
                // Ignore malformed click events.
              }
            }
          );

          /*
           * Mappls load event.
           */
          map.addListener?.(
            'load',
            () => {
              if (cancelled) {
                return;
              }

              console.log(
                'RESQTWIN: Mappls load event'
              );

              setLoaded(true);

              setTimeout(() => {
                if (!cancelled) {
                  drawLayers(
                    resolvedTwinState
                  );
                }
              }, 300);
            }
          );

          /*
           * Fallback for Mappls versions where the load
           * event fires differently.
           */
          setTimeout(() => {
            if (cancelled) {
              return;
            }

            console.log(
              'RESQTWIN: Mappls fallback initialization'
            );

            setLoaded(true);

            drawLayers(
              resolvedTwinState
            );
          }, 1500);
        } catch (mapError) {
          console.error(
            'RESQTWIN: Mappls map creation failed',
            mapError
          );

          setError(
            'Unable to create Mappls map.'
          );
        }
      }
    );

    return () => {
      cancelled = true;

      overlaysRef.current.forEach(
        (overlay) => {
          try {
            overlay?.remove?.();
          } catch {
            // Ignore.
          }
        }
      );

      overlaysRef.current = [];

      try {
        mapRef.current?.remove?.();
      } catch {
        // Ignore.
      }

      mapRef.current = null;
      mapplsRef.current = null;
      setLoaded(false);
    };
  }, []);

  /*
   * THE IMPORTANT SYNCHRONIZATION EFFECT.
   *
   * Whenever the disaster scenario, crowd, route,
   * blocked road, blocked exit, risk or population changes,
   * redraw the ResQTwin layers on the same Mappls map.
   */
  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (!resolvedTwinState) {
      console.log(
        'RESQTWIN: no DigitalTwinState available'
      );
      return;
    }

    console.log(
      'RESQTWIN: state changed -> redraw overlays'
    );

    drawLayers(resolvedTwinState);
  }, [
    loaded,
    resolvedTwinState,
  ]);

  /*
   * 2D / 3D selector.
   *
   * We keep the selector without calling the broken
   * Mappls camera-control methods.
   *
   * The Mappls geographic view itself remains intact.
   */
  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (resolvedTwinState) {
      setTimeout(() => {
        drawLayers(resolvedTwinState);
      }, 200);
    }
  }, [
    is3D,
    loaded,
    resolvedTwinState,
  ]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-950">

      <div
        id="resqtwin-map"
        ref={mapContainerRef}
        className="h-full min-h-[540px] w-full"
      />

      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950 text-white">
          <div className="rounded-xl border border-red-500/40 bg-slate-900 p-6 text-center">
            <div className="mb-2 text-lg font-bold text-red-400">
              Mappls Error
            </div>

            <div className="text-sm text-slate-300">
              {error}
            </div>
          </div>
        </div>
      )}

      {!error && (
        <>
          {/* 2D / 3D selector */}
          <div className="absolute right-4 top-4 z-40 flex overflow-hidden rounded-xl border border-slate-500/40 bg-slate-900/90 shadow-xl backdrop-blur">
            <button
              onClick={() => setIs3D(false)}
              className={`px-5 py-3 text-sm font-bold transition ${
                !is3D
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              2D
            </button>

            <button
              onClick={() => setIs3D(true)}
              className={`px-5 py-3 text-sm font-bold transition ${
                is3D
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              3D
            </button>
          </div>

          {/* Header */}
          <div className="absolute left-4 top-4 z-40 rounded-xl border border-cyan-400/30 bg-slate-950/85 px-4 py-3 shadow-xl backdrop-blur">
            <div className="text-sm font-black tracking-wide text-cyan-300">
              RESQTWIN • MAPPLS DIGITAL TWIN
            </div>

            <div className="mt-1 text-xs text-slate-300">
              {is3D
                ? 'Mappls 3D geographic view'
                : 'Mappls 2D geographic view'}
            </div>

            {scenario && (
              <div className="mt-2 text-xs font-semibold text-white">
                {String(
                  scenario.type
                ).toUpperCase()}{' '}
                • Severity{' '}
                {scenario.severity}/5
              </div>
            )}
          </div>

          {/* Selected location */}
          {selectedLocation && (
            <div className="absolute bottom-4 right-4 z-40 rounded-lg border border-cyan-400/30 bg-slate-950/90 px-4 py-3 text-xs text-slate-200 shadow-xl backdrop-blur">
              <div className="font-bold text-cyan-300">
                SELECTED MAPPLS LOCATION
              </div>

              <div className="mt-1">
                Lat:{' '}
                {selectedLocation.lat.toFixed(
                  6
                )}
              </div>

              <div>
                Lng:{' '}
                {selectedLocation.lng.toFixed(
                  6
                )}
              </div>
            </div>
          )}

          {/* ResQTwin operational information */}
          {resolvedTwinState && (
            <DigitalTwinOverlay
              twinState={resolvedTwinState}
              compact
            />
          )}

          {/* Status */}
          <div className="absolute bottom-4 left-4 z-40 rounded-lg border border-slate-500/30 bg-slate-950/85 px-3 py-2 text-xs text-slate-300 backdrop-blur">
            <span className="font-bold text-green-400">
              ● LIVE
            </span>{' '}
            Mappls {is3D ? '3D' : '2D'}
            {resolvedTwinState
              ? ` • ${resolvedTwinState.totalPopulation ?? 0} people`
              : ''}
          </div>
        </>
      )}
    </div>
  );
}


