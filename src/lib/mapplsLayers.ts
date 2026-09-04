import type { DisasterScenario } from "./disasterEngine";
import type { CrowdSimulation } from "./crowdEngine";

import {
  buildings,
  roads,
  exits,
  assemblyPoints,
} from "../data/campusData";

import {
  hasCoordinate,
  mapplsCoordinateAdapter,
} from "./mapplsCampus";

import type { MapplsCoordinate } from "./mapplsCampus";

interface MapplsLayerInput {
  map: any;
  mapplsObject: any;
  scenario?: DisasterScenario;
  crowdSimulation?: CrowdSimulation;
}

type LatLng = MapplsCoordinate;

function addMarker(
  mapplsObject: any,
  map: any,
  position: LatLng,
  html: string,
  popupHtml: string
) {
  if (!mapplsObject?.Marker) {
    return null;
  }

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
  path: LatLng[],
  blocked: boolean,
  popupHtml: string
) {
  if (!mapplsObject?.Polyline) {
    return null;
  }

  try {
    return mapplsObject.Polyline({
      map,
      path,
      strokeColor: blocked ? "#ef4444" : "#06b6d4",
      strokeOpacity: blocked ? 0.95 : 0.8,
      strokeWeight: blocked ? 8 : 5,
      zIndex: blocked ? 30 : 10,
      popupHtml,
      popupOptions: {
        offset: {
          bottom: [0, -20],
        },
      },
    });
  } catch (error) {
    console.warn("Mappls polyline failed:", error);
    return null;
  }
}

/*
 * Only features with surveyed geographic coordinates are drawn.
 * Simulated 2D twin coordinates are never projected onto the map,
 * so the native Mappls basemap and 3D buildings stay untouched
 * until real coordinates are supplied.
 */
export function addAllMapplsLayers({
  map,
  mapplsObject,
  scenario,
}: MapplsLayerInput) {
  const affectedBuildings = new Set(
    scenario?.affectedBuildings ?? []
  );

  const blockedRoads = new Set(
    scenario?.blockedRoads ?? []
  );

  const blockedExits = new Set(
    scenario?.blockedExits ?? []
  );

  const buildingLayers: any[] = [];
  const roadLayers: any[] = [];
  const exitLayers: any[] = [];
  const assemblyLayers: any[] = [];

  /*
   * BUILDINGS
   */
  buildings.forEach((building) => {
    const position =
      mapplsCoordinateAdapter.building(building.id);

    if (!hasCoordinate(position)) {
      return;
    }

    const affected = affectedBuildings.has(building.id);

    const marker = addMarker(
      mapplsObject,
      map,
      position,
      `
        <div style="
          transform:translate(-50%,-100%);
          padding:6px 10px;
          border-radius:9px;
          background:${affected
            ? "rgba(127,29,29,.97)"
            : "rgba(15,23,42,.97)"};
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
        <div style="
          padding:12px;
          min-width:220px;
          font-family:Arial,sans-serif;
        ">
          <strong>${building.name}</strong>
          <br/><br/>
          Occupants: <b>${building.occupants}</b>
          <br/>
          Capacity: <b>${building.capacity}</b>
          <br/>
          Base Risk: <b>${building.risk}/100</b>
          <br/><br/>
          <b style="color:${
            affected ? "#dc2626" : "#059669"
          }">
            ${
              affected
                ? "AFFECTED BUILDING"
                : "BUILDING SAFE"
            }
          </b>
        </div>
      `
    );

    if (marker) {
      buildingLayers.push(marker);
    }
  });

  /*
   * ROADS
   */
  roads.forEach((road) => {
    const path = mapplsCoordinateAdapter.road(road.id);

    if (!path || path.length < 2) {
      return;
    }

    const blocked =
      blockedRoads.has(road.id) ||
      Boolean(road.blocked);

    const line = addPolyline(
      mapplsObject,
      map,
      path,
      blocked,
      `
        <div style="
          padding:12px;
          min-width:220px;
          font-family:Arial,sans-serif;
        ">
          <strong>${road.name}</strong>
          <br/><br/>
          Distance: <b>${road.distance}m</b>
          <br/>
          Capacity: <b>${road.capacity}</b>
          <br/><br/>
          <b style="color:${
            blocked ? "#dc2626" : "#059669"
          }">
            ${
              blocked
                ? "ROAD BLOCKED"
                : "EVACUATION ROUTE OPEN"
            }
          </b>
        </div>
      `
    );

    if (line) {
      roadLayers.push(line);
    }
  });

  /*
   * EMERGENCY EXITS
   */
  exits.forEach((exit) => {
    const position =
      mapplsCoordinateAdapter.exit(exit.id);

    if (!hasCoordinate(position)) {
      return;
    }

    const blocked =
      blockedExits.has(exit.id) ||
      exit.status === "blocked";

    const marker = addMarker(
      mapplsObject,
      map,
      position,
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
        <div style="
          padding:12px;
          min-width:200px;
          font-family:Arial,sans-serif;
        ">
          <strong>${exit.name}</strong>
          <br/><br/>
          Capacity: <b>${exit.capacity}</b>
          <br/><br/>
          <b style="color:${
            blocked ? "#dc2626" : "#059669"
          }">
            ${
              blocked
                ? "EXIT BLOCKED"
                : "EXIT AVAILABLE"
            }
          </b>
        </div>
      `
    );

    if (marker) {
      exitLayers.push(marker);
    }
  });

  /*
   * ASSEMBLY POINTS
   */
  assemblyPoints.forEach((point) => {
    const position =
      mapplsCoordinateAdapter.assemblyPoint(point.id);

    if (!hasCoordinate(position)) {
      return;
    }

    const marker = addMarker(
      mapplsObject,
      map,
      position,
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
        <div style="
          padding:12px;
          min-width:210px;
          font-family:Arial,sans-serif;
        ">
          <strong>${point.name}</strong>
          <br/><br/>
          Capacity: <b>${point.capacity}</b>
          <br/><br/>
          <b style="color:#059669">
            SAFE ASSEMBLY AREA
          </b>
        </div>
      `
    );

    if (marker) {
      assemblyLayers.push(marker);
    }
  });

  return {
    buildings: buildingLayers,
    roads: roadLayers,
    exits: exitLayers,
    assemblyPoints: assemblyLayers,
    crowd: [] as any[],
  };
}
