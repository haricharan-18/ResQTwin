import {
  buildings,
  roads,
  exits,
  assemblyPoints,
} from "../data/campusData";

import type {
  Building,
  Exit,
  Road,
  AssemblyPoint,
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

/*
 * REAL SNIST CAMPUS ANCHOR
 *
 * Verified campus anchor:
 * 17.45585, 78.66667
 *
 * Individual ResQTwin objects are mapped to the
 * real SNIST campus area instead of projecting the
 * old 2D canvas coordinates onto the map.
 *
 * These object positions are visualization anchors,
 * not a surveyed GIS dataset.
 */

export const SNIST_MAP_CENTER: MapplsCoordinate = {
  lat: 17.45585,
  lng: 78.66667,
};

/*
 * Real-campus semantic anchors.
 *
 * Kept separate from campusData.ts so the
 * disaster/routing engine remains unchanged.
 */

export const SNIST_BUILDING_COORDINATES: Record<
  string,
  MapplsCoordinate
> = {
  b1: {
    lat: 17.45495,
    lng: 78.66755,
  },

  b2: {
    lat: 17.45555,
    lng: 78.66735,
  },

  b3: {
    lat: 17.45695,
    lng: 78.66710,
  },

  b4: {
    lat: 17.45555,
    lng: 78.66625,
  },

  b5: {
    lat: 17.45420,
    lng: 78.66545,
  },

  b6: {
    lat: 17.45415,
    lng: 78.66905,
  },
};

/*
 * Emergency exits around the campus perimeter.
 */

export const SNIST_EXIT_COORDINATES: Record<
  string,
  MapplsCoordinate
> = {
  e1: {
    lat: 17.45755,
    lng: 78.66695,
  },

  e2: {
    lat: 17.45355,
    lng: 78.66405,
  },

  e3: {
    lat: 17.45520,
    lng: 78.67005,
  },

  e4: {
    lat: 17.45295,
    lng: 78.66730,
  },
};

/*
 * Assembly areas.
 */

export const SNIST_ASSEMBLY_COORDINATES: Record<
  string,
  MapplsCoordinate
> = {
  a1: {
    lat: 17.45355,
    lng: 78.66695,
  },

  a2: {
    lat: 17.45400,
    lng: 78.66905,
  },
};

/*
 * Semantic road/junction anchors.
 */

export const campusJunctions: Record<
  string,
  MapplsCoordinate
> = {
  j1: {
    lat: 17.45445,
    lng: 78.66635,
  },

  j2: {
    lat: 17.45510,
    lng: 78.66705,
  },

  j3: {
    lat: 17.45645,
    lng: 78.66720,
  },

  j4: {
    lat: 17.45515,
    lng: 78.66915,
  },

  j5: {
    lat: 17.45385,
    lng: 78.66680,
  },

  j6: {
    lat: 17.45390,
    lng: 78.66890,
  },
};

/*
 * Generic coordinate configuration.
 *
 * This allows coordinates to remain null when
 * verified coordinates are unavailable.
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

/*
 * Mappls-enriched campus entities.
 */

export interface MapplsBuilding extends Building {
  mappls: MapplsCoordinate;
}

export interface MapplsExit extends Exit {
  mappls: MapplsCoordinate;
}

export interface MapplsAssemblyPoint
  extends AssemblyPoint {
  mappls: MapplsCoordinate;
}

export function buildingToMappls(
  building: Building
): MapplsBuilding {
  return {
    ...building,
    mappls:
      SNIST_BUILDING_COORDINATES[building.id] ??
      SNIST_MAP_CENTER,
  };
}

export function exitToMappls(
  exit: Exit
): MapplsExit {
  return {
    ...exit,
    mappls:
      SNIST_EXIT_COORDINATES[exit.id] ??
      SNIST_MAP_CENTER,
  };
}

export function assemblyPointToMappls(
  point: AssemblyPoint
): MapplsAssemblyPoint {
  return {
    ...point,
    mappls:
      SNIST_ASSEMBLY_COORDINATES[point.id] ??
      SNIST_MAP_CENTER,
  };
}

export function buildingsToMappls(
  items: Building[]
): MapplsBuilding[] {
  return items.map(buildingToMappls);
}

export function exitsToMappls(
  items: Exit[]
): MapplsExit[] {
  return items.map(exitToMappls);
}

export function assemblyPointsToMappls(
  items: AssemblyPoint[]
): MapplsAssemblyPoint[] {
  return items.map(assemblyPointToMappls);
}

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
  items: Road[]
) {
  return items.map(roadToMappls);
}