import { buildings, roads, exits, CampusZone } from '../data/campusData';

export type DisasterType =
  | 'fire'
  | 'flood'
  | 'earthquake'
  | 'cyclone'
  | 'landslide';

export interface DisasterScenario {
  type: DisasterType;
  severity: number;
  affectedBuildings: string[];
  blockedRoads: string[];
  blockedExits: string[];
  zoneRisks: Record<string, number>;
}

export function simulateDisaster(
  type: DisasterType,
  severity: number
): DisasterScenario {
  const affectedBuildings: string[] = [];
  const blockedRoads: string[] = [];
  const blockedExits: string[] = [];
  const zoneRisks: Record<string, number> = {};

  const level = Math.max(1, Math.min(5, severity));

  // FIRE
  if (type === 'fire') {
    buildings.forEach((building) => {
      if (building.risk + level * 10 >= 70) {
        affectedBuildings.push(building.id);
      }
    });

    roads.forEach((road) => {
      if (road.name.includes('Central') || road.name.includes('Library')) {
        if (level >= 3) {
          blockedRoads.push(road.id);
        }
      }
    });

    if (level >= 4) {
      blockedExits.push('e1');
    }
  }

  // FLOOD
  if (type === 'flood') {
    buildings.forEach((building) => {
      if (building.y > 300) {
        affectedBuildings.push(building.id);
      }
    });

    roads.forEach((road) => {
      if (
        road.name.includes('South') ||
        road.name.includes('Hostel') ||
        road.name.includes('Emergency')
      ) {
        if (level >= 2) {
          blockedRoads.push(road.id);
        }
      }
    });

    if (level >= 4) {
      blockedExits.push('e2');
    }
  }

  // EARTHQUAKE
  if (type === 'earthquake') {
    buildings.forEach((building) => {
      if (building.risk + level * 8 >= 60) {
        affectedBuildings.push(building.id);
      }
    });

    if (level >= 3) {
      blockedRoads.push('r7');
    }

    if (level >= 4) {
      blockedExits.push('e3');
    }
  }

  // CYCLONE
  if (type === 'cyclone') {
    buildings.forEach((building) => {
      if (building.y < 250) {
        affectedBuildings.push(building.id);
      }
    });

    if (level >= 3) {
      blockedRoads.push('r2');
      blockedRoads.push('r3');
    }

    if (level >= 4) {
      blockedExits.push('e1');
      blockedExits.push('e3');
    }
  }

  // LANDSLIDE
  if (type === 'landslide') {
    if (level >= 2) {
      blockedRoads.push('r6');
    }

    if (level >= 3) {
      blockedRoads.push('r7');
    }

    if (level >= 4) {
      blockedExits.push('e3');
    }
  }

  // Calculate zone risk
  const zones: CampusZone[] = [
    {
      id: 'z1',
      name: 'Academic Zone',
      risk: 38,
      population: 1130
    },
    {
      id: 'z2',
      name: 'Residential Zone',
      risk: 55,
      population: 850
    },
    {
      id: 'z3',
      name: 'Administration Zone',
      risk: 20,
      population: 210
    },
    {
      id: 'z4',
      name: 'Sports Zone',
      risk: 18,
      population: 160
    }
  ];

  zones.forEach((zone) => {
    let risk = zone.risk;

    if (type === 'fire' && zone.id === 'z1') {
      risk += level * 10;
    }

    if (type === 'flood' && zone.id === 'z2') {
      risk += level * 12;
    }

    if (type === 'earthquake') {
      risk += level * 8;
    }

    if (type === 'cyclone' && zone.id === 'z1') {
      risk += level * 9;
    }

    if (type === 'landslide' && zone.id === 'z4') {
      risk += level * 10;
    }

    zoneRisks[zone.id] = Math.min(100, risk);
  });

  return {
    type,
    severity: level,
    affectedBuildings: [...new Set(affectedBuildings)],
    blockedRoads: [...new Set(blockedRoads)],
    blockedExits: [...new Set(blockedExits)],
    zoneRisks
  };
}