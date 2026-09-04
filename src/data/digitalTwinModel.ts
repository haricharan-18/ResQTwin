import {
  assemblyPoints as sourceAssembly,
  buildings as sourceBuildings,
  campusZones as sourceZones,
  exits as sourceExits,
  roads as sourceRoads,
  type AssemblyPoint,
  type Building,
  type CampusPerson,
  type CampusZone,
  type Exit,
  type Road,
} from './campusData';

export type RiskVisualLevel = 'low' | 'medium' | 'high' | 'critical';
export type PersonStatus = 'safe' | 'evacuating' | 'trapped';
export type PersonType = CampusPerson['type'];
export type FeatureKind =
  | 'building'
  | 'road'
  | 'exit'
  | 'assembly'
  | 'junction'
  | 'zone'
  | 'person';

export type PlanarPoint = {
  x: number;
  y: number;
};

export type World3DPoint = {
  x: number;
  y: number;
  z: number;
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type DigitalTwinBuilding = Building & {
  kind: 'building';
  zoneId: string;
  heightMeters: number;
  floors: number;
  center: PlanarPoint;
  footprint: PlanarPoint[];
};

export type DigitalTwinRoad = Road & {
  kind: 'road';
  polyline: PlanarPoint[];
};

export type DigitalTwinExit = Exit & {
  kind: 'exit';
  zoneId: string;
};

export type DigitalTwinAssemblyPoint = AssemblyPoint & {
  kind: 'assembly';
  radius: number;
  zoneId: string;
};

export type DigitalTwinJunction = {
  kind: 'junction';
  id: string;
  name: string;
  x: number;
  y: number;
};

export type DigitalTwinZone = CampusZone & {
  kind: 'zone';
  buildingIds: string[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
};

export type DigitalTwinPerson = {
  kind: 'person';
  id: string;
  type: PersonType;
  x: number;
  y: number;
  zone: string;
  risk: number;
  status: PersonStatus;
};

export type DigitalTwinFeature =
  | DigitalTwinBuilding
  | DigitalTwinRoad
  | DigitalTwinExit
  | DigitalTwinAssemblyPoint
  | DigitalTwinJunction
  | DigitalTwinZone
  | DigitalTwinPerson;

export type DigitalTwinCampus = {
  buildings: DigitalTwinBuilding[];
  roads: DigitalTwinRoad[];
  exits: DigitalTwinExit[];
  assemblyPoints: DigitalTwinAssemblyPoint[];
  junctions: DigitalTwinJunction[];
  zones: DigitalTwinZone[];
};

/*
 * Canonical campus plane used by both renderers.
 * 3D world and Mappls lon/lat are derived from this plane.
 */
export const CAMPUS_VIEWBOX = {
  width: 1100,
  height: 680,
} as const;

export const CAMPUS_MAP_BOUNDS = {
  north: 17.45815,
  south: 17.45275,
  west: 78.6638,
  east: 78.6703,
} as const;

export const CAMPUS_MAP_CENTER: GeoPoint = {
  lat: 17.45585,
  lng: 78.66667,
};

const WORLD3D_SCALE = 50;
const WORLD3D_OFFSET_X = 11;
const WORLD3D_OFFSET_Z = 6.8;

export const BUILDING_ZONE: Record<string, string> = {
  b1: 'z1',
  b2: 'z1',
  b3: 'z1',
  b4: 'z3',
  b5: 'z2',
  b6: 'z4',
};

export const BUILDING_JUNCTION: Record<string, string> = {
  b1: 'j2',
  b2: 'j2',
  b3: 'j3',
  b4: 'j1',
  b5: 'j5',
  b6: 'j4',
};

export const EXIT_JUNCTION: Record<string, string> = {
  e1: 'j3',
  e2: 'j1',
  e3: 'j4',
  e4: 'j5',
};

export const EXIT_ZONE: Record<string, string> = {
  e1: 'z1',
  e2: 'z3',
  e3: 'z1',
  e4: 'z2',
};

export const ASSEMBLY_ZONE: Record<string, string> = {
  a1: 'z3',
  a2: 'z4',
};

/*
 * 3D campus source-of-truth junction layout.
 * Roads are edges between these nodes.
 */
export const CANONICAL_JUNCTIONS: DigitalTwinJunction[] = [
  { kind: 'junction', id: 'j1', name: 'West Junction', x: 160, y: 280 },
  { kind: 'junction', id: 'j2', name: 'Central Junction', x: 520, y: 280 },
  { kind: 'junction', id: 'j3', name: 'North Junction', x: 760, y: 120 },
  { kind: 'junction', id: 'j4', name: 'East Junction', x: 850, y: 320 },
  { kind: 'junction', id: 'j5', name: 'South Junction', x: 580, y: 520 },
  { kind: 'junction', id: 'j6', name: 'Emergency Junction', x: 800, y: 520 },
];

const BUILDING_HEIGHT: Record<string, { heightMeters: number; floors: number }> = {
  b1: { heightMeters: 22, floors: 5 },
  b2: { heightMeters: 20, floors: 4 },
  b3: { heightMeters: 16, floors: 3 },
  b4: { heightMeters: 14, floors: 3 },
  b5: { heightMeters: 28, floors: 6 },
  b6: { heightMeters: 12, floors: 2 },
};

export function campusToWorld3D(x: number, y: number, elevation = 0): World3DPoint {
  return {
    x: x / WORLD3D_SCALE - WORLD3D_OFFSET_X,
    y: elevation,
    z: y / WORLD3D_SCALE - WORLD3D_OFFSET_Z,
  };
}

export function campusSizeToWorld3D(width: number, depth: number) {
  return {
    width: width / WORLD3D_SCALE,
    depth: depth / WORLD3D_SCALE,
  };
}

export function buildingHeightToWorld3D(heightMeters: number) {
  return Math.max(0.8, heightMeters / 8);
}

export function campusToGeo(x: number, y: number): GeoPoint {
  const nx = Math.max(0, Math.min(1, x / CAMPUS_VIEWBOX.width));
  const ny = Math.max(0, Math.min(1, y / CAMPUS_VIEWBOX.height));

  return {
    lng:
      CAMPUS_MAP_BOUNDS.west +
      nx * (CAMPUS_MAP_BOUNDS.east - CAMPUS_MAP_BOUNDS.west),
    lat:
      CAMPUS_MAP_BOUNDS.north -
      ny * (CAMPUS_MAP_BOUNDS.north - CAMPUS_MAP_BOUNDS.south),
  };
}

export function polylineToGeo(points: PlanarPoint[]): GeoPoint[] {
  return points.map((point) => campusToGeo(point.x, point.y));
}

export function getAuthoritativePopulation(buildings = sourceBuildings) {
  return buildings.reduce((sum, building) => sum + building.occupants, 0);
}

export function getBuildingZoneId(buildingId: string) {
  return BUILDING_ZONE[buildingId] ?? 'z1';
}

export function getJunctionPoint(id: string): PlanarPoint | null {
  const junction = CANONICAL_JUNCTIONS.find((item) => item.id === id);
  return junction ? { x: junction.x, y: junction.y } : null;
}

function footprintFromBuilding(building: Building): PlanarPoint[] {
  return [
    { x: building.x, y: building.y },
    { x: building.x + building.width, y: building.y },
    { x: building.x + building.width, y: building.y + building.height },
    { x: building.x, y: building.y + building.height },
  ];
}

function zoneBounds(buildingIds: string[], buildings: Building[]) {
  const members = buildings.filter((building) => buildingIds.includes(building.id));
  if (members.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  return members.reduce(
    (bounds, building) => ({
      minX: Math.min(bounds.minX, building.x),
      minY: Math.min(bounds.minY, building.y),
      maxX: Math.max(bounds.maxX, building.x + building.width),
      maxY: Math.max(bounds.maxY, building.y + building.height),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    }
  );
}

export function createCanonicalCampus(): DigitalTwinCampus {
  const buildings: DigitalTwinBuilding[] = sourceBuildings.map((building) => {
    const height = BUILDING_HEIGHT[building.id] ?? { heightMeters: 16, floors: 3 };
    return {
      ...building,
      kind: 'building',
      zoneId: getBuildingZoneId(building.id),
      heightMeters: height.heightMeters,
      floors: height.floors,
      center: {
        x: building.x + building.width / 2,
        y: building.y + building.height / 2,
      },
      footprint: footprintFromBuilding(building),
    };
  });

  const junctions = CANONICAL_JUNCTIONS.map((junction) => ({ ...junction }));

  const roads: DigitalTwinRoad[] = sourceRoads.map((road) => {
    const from = getJunctionPoint(road.from);
    const to = getJunctionPoint(road.to);
    return {
      ...road,
      kind: 'road',
      polyline:
        from && to
          ? [from, to]
          : [
              { x: 0, y: 0 },
              { x: 0, y: 0 },
            ],
    };
  });

  const exits: DigitalTwinExit[] = sourceExits.map((exit) => ({
    ...exit,
    kind: 'exit',
    zoneId: EXIT_ZONE[exit.id] ?? 'z1',
  }));

  const assemblyPoints: DigitalTwinAssemblyPoint[] = sourceAssembly.map((point) => ({
    ...point,
    kind: 'assembly',
    radius: 36,
    zoneId: ASSEMBLY_ZONE[point.id] ?? 'z4',
  }));

  const zoneMembers: Record<string, string[]> = {
    z1: ['b1', 'b2', 'b3'],
    z2: ['b5'],
    z3: ['b4'],
    z4: ['b6'],
  };

  const zones: DigitalTwinZone[] = sourceZones.map((zone) => ({
    ...zone,
    kind: 'zone',
    buildingIds: zoneMembers[zone.id] ?? [],
    bounds: zoneBounds(zoneMembers[zone.id] ?? [], sourceBuildings),
  }));

  return {
    buildings,
    roads,
    exits,
    assemblyPoints,
    junctions,
    zones,
  };
}

export const DIGITAL_TWIN_CAMPUS = createCanonicalCampus();

export const campusStats = {
  totalPopulation: getAuthoritativePopulation(),
  buildings: DIGITAL_TWIN_CAMPUS.buildings.length,
  exits: DIGITAL_TWIN_CAMPUS.exits.length,
  roads: DIGITAL_TWIN_CAMPUS.roads.length,
  assemblyPoints: DIGITAL_TWIN_CAMPUS.assemblyPoints.length,
  zones: DIGITAL_TWIN_CAMPUS.zones.length,
};
