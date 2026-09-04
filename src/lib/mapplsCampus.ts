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

export const RESQTWIN_VIEWBOX = {
  width: 1100,
  height: 680,
};

/* Exact road geometry used by the existing 2D Digital Twin. */
export const RESQTWIN_ROAD_POSITIONS: Record<
  string,
  [number, number, number, number]
> = {
  r1: [350, 270, 500, 270],
  r2: [500, 270, 540, 70],
  r3: [500, 270, 850, 300],
  r4: [350, 450, 500, 560],
  r5: [580, 500, 850, 300],
  r6: [540, 70, 850, 300],
  r7: [580, 500, 850, 540],
};

/*
 * Geographic bounds used only as a projection envelope.
 * The Mappls overlays preserve the 2D Digital Twin geometry.
 */
export const RESQTWIN_MAP_BOUNDS = {
  north: 17.45815,
  south: 17.45275,
  west: 78.66380,
  east: 78.67030,
};

export const SNIST_MAP_CENTER: MapplsCoordinate = {
  lat: 17.45585,
  lng: 78.66667,
};

export function resqtwinToMappls(
  x: number,
  y: number
): MapplsCoordinate {
  const nx = Math.max(
    0,
    Math.min(
      1,
      x / RESQTWIN_VIEWBOX.width
    )
  );

  const ny = Math.max(
    0,
    Math.min(
      1,
      y / RESQTWIN_VIEWBOX.height
    )
  );

  return {
    lng:
      RESQTWIN_MAP_BOUNDS.west +
      nx *
        (RESQTWIN_MAP_BOUNDS.east -
          RESQTWIN_MAP_BOUNDS.west),
    lat:
      RESQTWIN_MAP_BOUNDS.north -
      ny *
        (RESQTWIN_MAP_BOUNDS.north -
          RESQTWIN_MAP_BOUNDS.south),
  };
}

export function roadPositionToMappls(
  roadId: string
): MapplsCoordinate[] | null {
  const position =
    RESQTWIN_ROAD_POSITIONS[roadId];

  if (!position) {
    return null;
  }

  const [x1, y1, x2, y2] = position;

  return [
    resqtwinToMappls(x1, y1),
    resqtwinToMappls(x2, y2),
  ];
}

export function roadToMappls(road: Road) {
  return {
    road,
    path: roadPositionToMappls(road.id),
  };
}

export function roadsToMappls(items: Road[]) {
  return items.map(roadToMappls);
}

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
    mappls: resqtwinToMappls(
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
    mappls: resqtwinToMappls(
      exit.x,
      exit.y
    ),
  };
}

export function assemblyPointToMappls(
  point: AssemblyPoint
): MapplsAssemblyPoint {
  return {
    ...point,
    mappls: resqtwinToMappls(
      point.x,
      point.y
    ),
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
