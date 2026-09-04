import type { DisasterScenario } from "./disasterEngine";
import type { CrowdSimulation } from "./crowdEngine";

import {
  buildings,
  roads,
  exits,
  assemblyPoints,
} from "../data/campusData";

import {
  buildingToMappls,
  exitToMappls,
  assemblyPointToMappls,
} from "./mapplsCampus";

interface MapplsLayerInput {
  map: any;
  mapplsObject: any;
  scenario?: DisasterScenario;
  crowdSimulation?: CrowdSimulation;
}

type LatLng = {
  lat: number;
  lng: number;
};

const ROAD_PATHS: Record<string, LatLng[]> = {
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

function addMarker(
  mapplsObject: any,
  map: any,
  position: LatLng,
  html: string,
  popupHtml: string
) {
  if (!mapplsObject?.Marker) return null;

  try {
    return mapplsObject.Marker({
      map,
      position,
      popupHtml,
      html,
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
  if (!mapplsObject?.Polyline) return null;

  try {
    return mapplsObject.Polyline({
      map,
      path,
      strokeColor: blocked ? "#ef4444" : "#06b6d4",
      strokeOpacity: blocked ? 0.95 : 0.75,
      strokeWeight: blocked ? 8 : 5,
      zIndex: blocked ? 30 : 10,
      popupHtml,
    });
  } catch (error) {
    console.warn("Mappls polyline failed:", error);
    return null;
  }
}

export function addAllMapplsLayers({
  map,
  mapplsObject,
  scenario,
  crowdSimulation,
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
  const crowdLayers: any[] = [];

  /*
   * BUILDINGS
   */
  buildings.forEach((building) => {
    const mapped = buildingToMappls(building);
    const affected = affectedBuildings.has(building.id);

    const marker = addMarker(
      mapplsObject,
      map,
      {
        lat: mapped.mappls.lat,
        lng: mapped.mappls.lng,
      },
      `
        <div style="
          transform:translate(-50%,-100%);
          padding:6px 9px;
          border-radius:9px;
          background:${affected
            ? "rgba(127,29,29,.97)"
            : "rgba(15,23,42,.97)"};
          border:2px solid ${affected ? "#ef4444" : "#22d3ee"};
          color:white;
          font:800 11px Arial,sans-serif;
          white-space:nowrap;
          box-shadow:0 4px 14px rgba(0,0,0,.45);
        ">
          ${affected ? "🚨" : "🏢"} ${building.name}
        </div>
      `,
      `
        <div style="padding:12px;min-width:210px;font-family:Arial,sans-serif">
          <strong>${affected ? "🚨" : "🏢"} ${building.name}</strong>
          <br/><br/>
          Occupants: <b>${building.occupants}</b>
          <br/>
          Capacity: <b>${building.capacity}</b>
          <br/>
          Base Risk: <b>${building.risk}/100</b>
          <br/><br/>
          <b style="color:${affected ? "#dc2626" : "#059669"}">
            ${affected ? "AFFECTED BUILDING" : "BUILDING SAFE"}
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
    const path = ROAD_PATHS[road.id];

    if (!path) return;

    const blocked =
      blockedRoads.has(road.id) ||
      road.blocked;

    const line = addPolyline(
      mapplsObject,
      map,
      path,
      blocked,
      `
        <div style="padding:12px;min-width:200px;font-family:Arial,sans-serif">
          <strong>${blocked ? "🚧" : "🛣️"} ${road.name}</strong>
          <br/><br/>
          Distance: <b>${road.distance}m</b>
          <br/>
          Capacity: <b>${road.capacity}</b>
          <br/><br/>
          <b style="color:${blocked ? "#dc2626" : "#059669"}">
            ${
              blocked
                ? "🚨 ROAD BLOCKED"
                : "✓ EVACUATION ROUTE OPEN"
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
    const mapped = exitToMappls(exit);

    const blocked =
      blockedExits.has(exit.id) ||
      exit.blocked;

    const marker = addMarker(
      mapplsObject,
      map,
      {
        lat: mapped.mappls.lat,
        lng: mapped.mappls.lng,
      },
      `
        <div style="
          transform:translate(-50%,-100%);
          padding:5px 8px;
          border-radius:8px;
          background:${blocked
            ? "rgba(127,29,29,.98)"
            : "rgba(6,78,59,.98)"};
          border:2px solid ${blocked ? "#ef4444" : "#34d399"};
          color:white;
          font:800 10px Arial,sans-serif;
          white-space:nowrap;
          box-shadow:0 4px 12px rgba(0,0,0,.4);
        ">
          ${blocked ? "🚫" : "🚪"} ${exit.name}
        </div>
      `,
      `
        <div style="padding:12px;font-family:Arial,sans-serif">
          <strong>${blocked ? "🚫" : "🚪"} ${exit.name}</strong>
          <br/><br/>
          Capacity: <b>${exit.capacity}</b>
          <br/><br/>
          <b style="color:${blocked ? "#dc2626" : "#059669"}">
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
    const mapped =
      assemblyPointToMappls(point);

    const marker = addMarker(
      mapplsObject,
      map,
      {
        lat: mapped.mappls.lat,
        lng: mapped.mappls.lng,
      },
      `
        <div style="
          transform:translate(-50%,-100%);
          padding:5px 8px;
          border-radius:8px;
          background:rgba(6,78,59,.98);
          border:2px solid #34d399;
          color:white;
          font:800 10px Arial,sans-serif;
          white-space:nowrap;
          box-shadow:0 4px 12px rgba(0,0,0,.4);
        ">
          🟢 ${point.name}
        </div>
      `,
      `
        <div style="padding:12px;font-family:Arial,sans-serif">
          <strong>🟢 ${point.name}</strong>
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

  /*
   * CROWD
   *
   * Uses crowdSimulation coordinates when available.
   * This is intentionally lightweight so thousands of
   * agents do not overwhelm the map.
   */
  const agents = crowdSimulation?.agents ?? [];

  if (mapplsObject.Marker && agents.length > 0) {
    const sample =
      agents.length > 250
        ? agents.filter(
            (_agent: any, index: number) =>
              index % Math.ceil(agents.length / 250) === 0
          )
        : agents;

    sample.forEach((agent: any) => {
      try {
        const x = Number(agent.x);
        const y = Number(agent.y);

        if (
          !Number.isFinite(x) ||
          !Number.isFinite(y)
        ) {
          return;
        }

        const lng =
          78.6645 +
          (x / 1100) * 0.0085;

        const lat =
          17.4528 +
          (1 - y / 650) * 0.0058;

        const status =
          agent.status ?? "evacuating";

        const color =
          status === "trapped"
            ? "#ef4444"
            : status === "safe"
              ? "#34d399"
              : "#38bdf8";

        const marker =
          mapplsObject.Marker({
            map,
            position: { lat, lng },
            width: 8,
            height: 8,
            html: `
              <div style="
                width:8px;
                height:8px;
                border-radius:50%;
                background:${color};
                border:1px solid white;
                box-shadow:0 0 7px ${color};
              "></div>
            `,
          });

        if (marker) {
          crowdLayers.push(marker);
        }
      } catch {
        // Ignore individual crowd marker failures.
      }
    });
  }

  return {
    buildings: buildingLayers,
    roads: roadLayers,
    exits: exitLayers,
    assemblyPoints: assemblyLayers,
    crowd: crowdLayers,
  };
}