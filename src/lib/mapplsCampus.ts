import type {
  Building,
  Exit,
  Road,
  AssemblyPoint,
} from '../data/campusData';

/*
 * ResQTwin → Mappls geographic adapter
 *
 * The existing campus model uses an abstract 1100 × 650 coordinate space.
 * We preserve that model and convert it into geographic coordinates only
 * at the Mappls visualization layer.
 *
 * SNIST anchor:
 *   latitude  = 17.45585
 *   longitude = 78.66667
 *
 * IMPORTANT:
 * These anchors are for visualization alignment, not a claim that every
 * abstract building coordinate is an exact real-world SNIST building GPS
 * position. Verified coordinates can be substituted later without changing
 * the rest of ResQTwin.
 */

export const SNIST_MAP_CENTER = {
  lat: 17.45585,
  lng: 78.66667,
};

/*
 * Approximate geographic scale for the current abstract campus.
 * Keeping longitude/latitude scales separate avoids distortion.
 */
const LATITUDE_SPAN = 0.006;
const LONGITUDE_SPAN = 0.008;

const MODEL_WIDTH = 1100;
const MODEL_HEIGHT = 650;

export interface MapplsCoordinate {
  lat: number;
  lng: number;
}

export interface MapplsBuilding extends Building {
  mappls: MapplsCoordinate;
}

export interface MapplsExit extends Exit {
  mappls: MapplsCoordinate;
}

export interface MapplsAssemblyPoint extends AssemblyPoint {
  mappls: MapplsCoordinate;
}

/**
 * Convert existing abstract campus x/y → Mappls lat/lng.
 */
export function campusXYToMappls(
  x: number,
  y: number
): MapplsCoordinate {
  const normalizedX = Math.max(0, Math.min(1, x / MODEL_WIDTH));
  const normalizedY = Math.max(0, Math.min(1, y / MODEL_HEIGHT));

  const lng =
    SNIST_MAP_CENTER.lng +
    (normalizedX - 0.5) * LONGITUDE_SPAN;

  /*
   * Screen/canvas Y increases downward,
   * geographic latitude increases upward.
   */
  const lat =
    SNIST_MAP_CENTER.lat +
    (0.5 - normalizedY) * LATITUDE_SPAN;

  return { lat, lng };
}

export function buildingToMappls(
  building: Building
): MapplsBuilding {
  return {
    ...building,
    mappls: campusXYToMappls(
      building.x + building.width / 2,
      building.y + building.height / 2
    ),
  };
}

export function exitToMappls(
  exit: Exit
): MapplsExit {
  return {
    ...exit,
    mappls: campusXYToMappls(exit.x, exit.y),
  };
}

export function assemblyPointToMappls(
  point: AssemblyPoint
): MapplsAssemblyPoint {
  return {
    ...point,
    mappls: campusXYToMappls(point.x, point.y),
  };
}

export function buildingsToMappls(
  buildings: Building[]
): MapplsBuilding[] {
  return buildings.map(buildingToMappls);
}

export function exitsToMappls(
  exits: Exit[]
): MapplsExit[] {
  return exits.map(exitToMappls);
}

export function assemblyPointsToMappls(
  points: AssemblyPoint[]
): MapplsAssemblyPoint[] {
  return points.map(assemblyPointToMappls);
}

/*
 * Road endpoints use junction IDs, so the adapter keeps junction
 * coordinates separate. These correspond to the same abstract campus
 * geometry used by the existing routing engine.
 */
export const campusJunctions: Record<string, MapplsCoordinate> = {
  j1: campusXYToMappls(260, 300),
  j2: campusXYToMappls(520, 300),
  j3: campusXYToMappls(820, 180),
  j4: campusXYToMappls(900, 360),
  j5: campusXYToMappls(520, 500),
  j6: campusXYToMappls(760, 540),
};

export function roadToMappls(
  road: Road
): {
  road: Road;
  from: MapplsCoordinate;
  to: MapplsCoordinate;
} {
  return {
    road,
    from:
      campusJunctions[road.from] ??
      SNIST_MAP_CENTER,
    to:
      campusJunctions[road.to] ??
      SNIST_MAP_CENTER,
  };
}

export function roadsToMappls(
  roads: Road[]
) {
  return roads.map(roadToMappls);
}