import type { DigitalTwinState } from './digitalTwinState';
import {
  hasCoordinate,
  mapplsCoordinateAdapter,
} from './mapplsCampus';

type MapplsObject = {
  Marker?: (options: any) => any;
};

type MapplsMap = any;

export type MapplsOverlayResult = {
  buildings: any[];
  roads: any[];
  exits: any[];
  assemblyPoints: any[];
  people: any[];
  routes: any[];
};

const COLORS = {
  building: '#475569',
  affectedBuilding: '#ef4444',

  openRoad: '#64748b',
  blockedRoad: '#ef4444',

  evacuationRoute: '#22d3ee',

  lowRisk: '#22c55e',
  mediumRisk: '#eab308',
  highRisk: '#f97316',
  criticalRisk: '#ef4444',

  exit: '#22c55e',
  people: '#38bdf8',
  assemblyPoint: '#eab308',
};

function riskColor(level: string): string {
  switch (level) {
    case 'critical':
      return COLORS.criticalRisk;
    case 'high':
      return COLORS.highRisk;
    case 'medium':
      return COLORS.mediumRisk;
    default:
      return COLORS.lowRisk;
  }
}

function markerHtml(
  color: string,
  label?: string,
  size = 14,
): string {
  const text = label
    ? `
      <div style="
        position:absolute;
        left:50%;
        top:${size + 5}px;
        transform:translateX(-50%);
        white-space:nowrap;
        padding:3px 6px;
        border-radius:4px;
        background:rgba(8,15,30,.90);
        color:#fff;
        font-size:10px;
        font-weight:700;
        line-height:1.2;
        border:1px solid ${color};
        pointer-events:none;
      ">
        ${label}
      </div>
    `
    : '';

  return `
    <div style="
      position:relative;
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${color};
      border:2px solid rgba(255,255,255,.95);
      box-shadow:0 0 0 2px ${color}55, 0 0 12px ${color}aa;
    ">
      ${text}
    </div>
  `;
}

function createMarker(
  mapplsObject: MapplsObject,
  map: MapplsMap,
  position: { lat: number; lng: number },
  color: string,
  label?: string,
  size = 14,
): any | null {
  if (!mapplsObject.Marker) {
    console.warn('RESQTWIN: Mappls Marker API unavailable');
    return null;
  }

  if (!hasCoordinate(position)) {
    return null;
  }

  try {
    return mapplsObject.Marker({
      map,
      position,
      html: markerHtml(color, label, size),
    });
  } catch (error) {
    console.warn('RESQTWIN: marker creation failed', error);
    return null;
  }
}

function clearOverlayCollection(items: any[]): void {
  items.forEach((item) => {
    try {
      item?.remove?.();
    } catch {
      // Ignore already-removed Mappls objects.
    }
  });
}

export function clearMapplsLayers(
  overlays?: Partial<MapplsOverlayResult> | null,
): void {
  if (!overlays) return;

  Object.values(overlays).forEach((collection) => {
    if (Array.isArray(collection)) {
      clearOverlayCollection(collection);
    }
  });
}

/*
 * IMPORTANT:
 *
 * This renderer deliberately does NOT create road polylines.
 *
 * The DigitalTwinState road.geoPath values originate from the
 * simulated 2D campus geometry. They are therefore NOT valid
 * real-world Mappls road geometry.
 *
 * Until verified geographic road geometry is configured in
 * SNIST_COORDINATES.roads, no road/route line is drawn here.
 *
 * The real Mappls basemap continues to provide the actual
 * geographic road network underneath these operational markers.
 */

export function addAllMapplsLayers(
  mapplsObject: MapplsObject,
  map: MapplsMap,
  twinState: DigitalTwinState,
): MapplsOverlayResult {
  const result: MapplsOverlayResult = {
    buildings: [],
    roads: [],
    exits: [],
    assemblyPoints: [],
    people: [],
    routes: [],
  };

  if (!mapplsObject || !map) {
    console.warn('RESQTWIN: Mappls map/object unavailable');
    return result;
  }

  console.log(
    'RESQTWIN: drawing geographic operational markings',
  );

  /*
   * BUILDINGS
   *
   * Only draw a building marker when a verified geographic
   * coordinate exists in mapplsCoordinateAdapter.
   *
   * We intentionally DO NOT use building.geoCenter here,
   * because that value comes from the simulated campus geometry.
   */
  twinState.buildings.forEach((building) => {
    const geographicCoordinate =
      mapplsCoordinateAdapter.building(building.id);

    if (!hasCoordinate(geographicCoordinate)) {
      return;
    }

    const color = building.affected
      ? COLORS.affectedBuilding
      : COLORS.building;

    const label = building.affected
      ? `${building.name} • AFFECTED`
      : building.name;

    const marker = createMarker(
      mapplsObject,
      map,
      geographicCoordinate,
      color,
      label,
      18,
    );

    if (marker) {
      result.buildings.push(marker);
    }
  });

  /*
   * ROADS
   *
   * NO ROAD POLYLINES ARE CREATED HERE.
   *
   * mapplsCoordinateAdapter.road(id) currently returns null
   * because SNIST_COORDINATES.roads is empty.
   *
   * This is intentional: we must never convert the dummy
   * DigitalTwin road geometry into geographic coordinates.
   */
  twinState.roads.forEach((road) => {
    const geographicPath =
      mapplsCoordinateAdapter.road(road.id);

    if (!geographicPath || geographicPath.length < 2) {
      return;
    }

    /*
     * This block is intentionally dormant until verified
     * geographic road geometry is supplied.
     *
     * It exists so the real geographic data can later be used
     * without changing the disaster-state logic.
     *
     * No fabricated fallback is allowed.
     */
    void geographicPath;
  });

  /*
   * EVACUATION ROUTES
   *
   * Same rule: routes are NOT drawn from DigitalTwinState
   * road.geoPath.
   *
   * A route can only be drawn after verified geographic
   * road geometry exists.
   */
  twinState.routes.forEach((route) => {
    route.roads.forEach((roadId) => {
      const geographicPath =
        mapplsCoordinateAdapter.road(roadId);

      if (!geographicPath || geographicPath.length < 2) {
        return;
      }

      void geographicPath;
    });
  });

  /*
   * EXITS
   *
   * Only draw when a verified Mappls coordinate exists.
   */
  twinState.exits.forEach((exit) => {
    const geographicCoordinate =
      mapplsCoordinateAdapter.exit(exit.id);

    if (!hasCoordinate(geographicCoordinate)) {
      return;
    }

    const color = exit.blocked
      ? COLORS.criticalRisk
      : COLORS.exit;

    const label = exit.blocked
      ? `${exit.name} • BLOCKED`
      : `${exit.name} • OPEN`;

    const marker = createMarker(
      mapplsObject,
      map,
      geographicCoordinate,
      color,
      label,
      17,
    );

    if (marker) {
      result.exits.push(marker);
    }
  });

  /*
   * ASSEMBLY POINTS
   *
   * Only draw when a verified Mappls coordinate exists.
   */
  twinState.assemblyPoints.forEach((point) => {
    const geographicCoordinate =
      mapplsCoordinateAdapter.assemblyPoint(point.id);

    if (!hasCoordinate(geographicCoordinate)) {
      return;
    }

    const label =
      `${point.name} • ` +
      `${point.currentPopulation}/${point.capacity}`;

    const marker = createMarker(
      mapplsObject,
      map,
      geographicCoordinate,
      COLORS.assemblyPoint,
      label,
      17,
    );

    if (marker) {
      result.assemblyPoints.push(marker);
    }
  });

  /*
   * PEOPLE
   *
   * People currently do not have verified geographic
   * coordinates in SNIST_COORDINATES.
   *
   * Therefore no fake geographic people positions are drawn.
   */
  const visiblePeople = twinState.people.slice(0, 300);

  visiblePeople.forEach((person) => {
    void person;
  });

  /*
   * RISK
   *
   * Risk semantics are preserved, but we only place a marker
   * when the corresponding building has verified geographic
   * coordinates.
   */
  twinState.buildings.forEach((building) => {
    const geographicCoordinate =
      mapplsCoordinateAdapter.building(building.id);

    if (!hasCoordinate(geographicCoordinate)) {
      return;
    }

    const color = riskColor(building.riskLevel);

    const marker = createMarker(
      mapplsObject,
      map,
      geographicCoordinate,
      color,
      `RISK ${building.risk}`,
      10,
    );

    if (marker) {
      result.buildings.push(marker);
    }
  });

  console.log(
    'RESQTWIN: verified geographic markings created',
    {
      buildings: result.buildings.length,
      roads: result.roads.length,
      exits: result.exits.length,
      assemblyPoints: result.assemblyPoints.length,
      people: result.people.length,
      routes: result.routes.length,
    },
  );

  console.log(
    'RESQTWIN: road overlays intentionally skipped because ' +
      'verified geographic road geometry is not configured',
  );

  return result;
}