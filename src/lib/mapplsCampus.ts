import {
  buildings,
  roads,
  exits,
  assemblyPoints,
} from "../data/campusData";

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

export const SNIST_MAP_CENTER: MapplsCoordinate = {
  lat: 17.45585,
  lng: 78.66667,
};

/*
 * Geographic geometry for campus features is intentionally absent.
 * Simulated 2D coordinates are not geographic and must never be
 * projected onto the Mappls map. Populate SNIST_COORDINATES only
 * with surveyed latitude/longitude values.
 */
export const SNIST_COORDINATES:
  CampusCoordinateConfig = {
  buildings: {},
  roads: {},
  exits: {},
  assemblyPoints: {},
  hospitals: {
    campusMedicalCenter: null,
    emergencyFieldHospital: null,
  },
};

export function createCoordinateAdapter(
  config: CampusCoordinateConfig =
    SNIST_COORDINATES
) {
  return {
    building(id: string) {
      return config.buildings[id] ?? null;
    },
    road(id: string) {
      return config.roads[id] ?? null;
    },
    exit(id: string) {
      return config.exits[id] ?? null;
    },
    assemblyPoint(id: string) {
      return config.assemblyPoints[id] ?? null;
    },
    hospital(id: string) {
      return config.hospitals[id] ?? null;
    },
  };
}

export const mapplsCoordinateAdapter =
  createCoordinateAdapter();

export const mapplsCampusEntities = {
  buildings,
  roads,
  exits,
  assemblyPoints,
};

export function hasCoordinate(
  coordinate: MapplsCoordinate | null
): coordinate is MapplsCoordinate {
  return (
    coordinate !== null &&
    Number.isFinite(coordinate.lat) &&
    Number.isFinite(coordinate.lng)
  );
}
