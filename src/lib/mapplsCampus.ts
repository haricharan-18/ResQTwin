import type {
  Building,
  Exit,
  Road,
  AssemblyPoint,
} from "../data/campusData";

export interface MapplsCoordinate {
  lat: number;
  lng: number;
}

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
 * We deliberately keep these separate from campusData.ts
 * so the disaster/routing engine remains unchanged.
 */
export const SNIST_BUILDING_COORDINATES: Record<
  string,
  MapplsCoordinate
> = {
  /* Engineering Block */
  b1: {
    lat: 17.45495,
    lng: 78.66755,
  },

  /* Science Block */
  b2: {
    lat: 17.45555,
    lng: 78.66735,
  },

  /* Central Library */
  b3: {
    lat: 17.45695,
    lng: 78.66710,
  },

  /* Admin Block */
  b4: {
    lat: 17.45555,
    lng: 78.66625,
  },

  /* Student Hostel */
  b5: {
    lat: 17.45420,
    lng: 78.66545,
  },

  /* Sports Complex */
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
  /* North Gate */
  e1: {
    lat: 17.45755,
    lng: 78.66695,
  },

  /* Main Gate */
  e2: {
    lat: 17.45355,
    lng: 78.66405,
  },

  /* East Gate */
  e3: {
    lat: 17.45520,
    lng: 78.67005,
  },

  /* South Gate */
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
 *
 * These are no longer used to recreate the old 2D road
 * network visually. They are retained so existing code
 * can continue resolving Road -> Mappls coordinates.
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
      SNIST_BUILDING_COORDINATES[
        building.id
      ] ??
      SNIST_MAP_CENTER,
  };
}

export function exitToMappls(
  exit: Exit
): MapplsExit {
  return {
    ...exit,
    mappls:
      SNIST_EXIT_COORDINATES[
        exit.id
      ] ??
      SNIST_MAP_CENTER,
  };
}

export function assemblyPointToMappls(
  point: AssemblyPoint
): MapplsAssemblyPoint {
  return {
    ...point,
    mappls:
      SNIST_ASSEMBLY_COORDINATES[
        point.id
      ] ??
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