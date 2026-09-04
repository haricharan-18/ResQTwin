import {
  buildings,
  roads,
  exits,
  assemblyPoints,
} from '../data/campusData';

export type MapplsCoordinate = {
  lat: number;
  lng: number;
};

export type CampusCoordinateConfig = {
  buildings: Record<string, MapplsCoordinate | null>;
  roads: Record<string, MapplsCoordinate[] | null>;
  exits: Record<string, MapplsCoordinate | null>;
  assemblyPoints: Record<string, MapplsCoordinate | null>;
  hospitals: Record<string, MapplsCoordinate | null>;
};

/**
 * Verified SNIST coordinates will be added here later.
 *
 * Do NOT add guessed coordinates.
 */
export const SNIST_COORDINATES: CampusCoordinateConfig = {
  buildings: {
    b1: null,
    b2: null,
    b3: null,
    b4: null,
    b5: null,
    b6: null,
  },

  roads: {
    r1: null,
    r2: null,
    r3: null,
    r4: null,
    r5: null,
    r6: null,
    r7: null,
  },

  exits: {
    e1: null,
    e2: null,
    e3: null,
    e4: null,
  },

  assemblyPoints: {
    a1: null,
    a2: null,
  },

  hospitals: {
    campusMedicalCenter: null,
    emergencyFieldHospital: null,
  },
};

/**
 * Converts ResQTwin campus IDs into Mappls coordinates.
 */
export function createCoordinateAdapter(
  config: CampusCoordinateConfig = SNIST_COORDINATES
) {
  return {
    building(id: string): MapplsCoordinate | null {
      return config.buildings[id] ?? null;
    },

    road(id: string): MapplsCoordinate[] | null {
      return config.roads[id] ?? null;
    },

    exit(id: string): MapplsCoordinate | null {
      return config.exits[id] ?? null;
    },

    assemblyPoint(id: string): MapplsCoordinate | null {
      return config.assemblyPoints[id] ?? null;
    },

    hospital(id: string): MapplsCoordinate | null {
      return config.hospitals[id] ?? null;
    },
  };
}

export const mapplsCoordinateAdapter =
  createCoordinateAdapter();

/**
 * Existing ResQTwin campus entities.
 *
 * These remain the source of truth.
 * We are NOT modifying campusData.ts.
 */
export const mapplsCampusEntities = {
  buildings,
  roads,
  exits,
  assemblyPoints,
};

/**
 * Checks whether a coordinate has been configured.
 */
export function hasCoordinate(
  coordinate: MapplsCoordinate | null
): coordinate is MapplsCoordinate {
  return (
    coordinate !== null &&
    Number.isFinite(coordinate.lat) &&
    Number.isFinite(coordinate.lng)
  );
}