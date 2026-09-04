import { buildings, exits, roads } from '../data/campusData';
import { BUILDING_JUNCTION, EXIT_JUNCTION, getBuildingZoneId } from '../data/digitalTwinModel';
import type { DisasterScenario } from './disasterEngine';

export interface EvacuationRoute {
  personOrBuilding: string;
  exitId: string;
  exitName: string;
  roads: string[];
  distance: number;
  risk: number;
  congestion: number;
  score: number;
  reason: string;
}

type GraphEdge = {
  to: string;
  roadId: string;
  distance: number;
  capacity: number;
};

/*
 * Campus junction connections.
 *
 * The campus roads form this graph:
 *
 * j1 ---- j2 ---- j3
 * |       |       |
 * |       |       |
 * j5 ---- j4 ----/
 * |
 * j6
 *
 * Buildings and exits are connected to their nearest
 * practical campus junction.
 */

const buildingJunction = BUILDING_JUNCTION;
const exitJunction = EXIT_JUNCTION;

function buildGraph(blockedRoads: string[]): Map<string, GraphEdge[]> {
  const graph = new Map<string, GraphEdge[]>();

  roads.forEach((road) => {
    if (road.blocked || blockedRoads.includes(road.id)) {
      return;
    }

    if (!graph.has(road.from)) {
      graph.set(road.from, []);
    }

    if (!graph.has(road.to)) {
      graph.set(road.to, []);
    }

    graph.get(road.from)!.push({
      to: road.to,
      roadId: road.id,
      distance: road.distance,
      capacity: road.capacity
    });

    graph.get(road.to)!.push({
      to: road.from,
      roadId: road.id,
      distance: road.distance,
      capacity: road.capacity
    });
  });

  return graph;
}

function calculateCongestion(capacity: number): number {
  /*
   * Simulated campus traffic level.
   *
   * 0   = free
   * 100 = completely congested
   *
   * This will later be connected to the crowd simulation.
   */
  const simulatedDemand = 180;

  return Math.min(
    100,
    Math.round((simulatedDemand / capacity) * 100)
  );
}

function findPath(
  start: string,
  target: string,
  graph: Map<string, GraphEdge[]>,
  zoneRisk: number
) {
  const distances = new Map<string, number>();
  const previous = new Map<
    string,
    { node: string; edge: GraphEdge }
  >();

  const unvisited = new Set<string>();

  graph.forEach((_, node) => {
    distances.set(node, Infinity);
    unvisited.add(node);
  });

  distances.set(start, 0);

  while (unvisited.size > 0) {
    let current: string | null = null;
    let smallestDistance = Infinity;

    unvisited.forEach((node) => {
      const distance = distances.get(node) ?? Infinity;

      if (distance < smallestDistance) {
        smallestDistance = distance;
        current = node;
      }
    });

    if (current === null || current === target) {
      break;
    }

    unvisited.delete(current);

    const neighbours = graph.get(current) ?? [];

    for (const edge of neighbours) {
      if (!unvisited.has(edge.to)) {
        continue;
      }

      const congestion = calculateCongestion(edge.capacity);

      /*
       * SAFETY SCORE
       *
       * Distance:
       *   encourages shorter evacuation paths
       *
       * Hazard:
       *   strongly penalizes dangerous zones
       *
       * Congestion:
       *   penalizes overloaded roads
       */
      const hazardPenalty = zoneRisk * 8;
      const congestionPenalty = congestion * 3;

      const weightedCost =
        edge.distance +
        hazardPenalty +
        congestionPenalty;

      const newDistance = smallestDistance + weightedCost;

      if (newDistance < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, newDistance);

        previous.set(edge.to, {
          node: current,
          edge
        });
      }
    }
  }

  if (!previous.has(target) && start !== target) {
    return null;
  }

  const path: GraphEdge[] = [];
  let current = target;

  while (current !== start) {
    const step = previous.get(current);

    if (!step) {
      return null;
    }

    path.unshift(step.edge);
    current = step.node;
  }

  return {
    path,
    weightedCost: distances.get(target) ?? Infinity
  };
}

export function findSafestRoute(
  buildingId: string,
  scenario: DisasterScenario
): EvacuationRoute | null {
  const building = buildings.find(
    (item) => item.id === buildingId
  );

  if (!building) {
    return null;
  }

  const startJunction = buildingJunction[buildingId];

  if (!startJunction) {
    return null;
  }

  const graph = buildGraph(scenario.blockedRoads);

  const buildingRisk =
    scenario.zoneRisks[getBuildingZoneId(buildingId)] ?? building.risk;

  let bestRoute: EvacuationRoute | null = null;

  for (const exit of exits) {
    if (scenario.blockedExits.includes(exit.id)) {
      continue;
    }

    const targetJunction = exitJunction[exit.id];

    if (!targetJunction) {
      continue;
    }

    const result = findPath(
      startJunction,
      targetJunction,
      graph,
      buildingRisk
    );

    if (!result) {
      continue;
    }

    const totalDistance = result.path.reduce(
      (sum, edge) => sum + edge.distance,
      0
    );

    const averageCongestion =
      result.path.length === 0
        ? 0
        : Math.round(
            result.path.reduce(
              (sum, edge) =>
                sum + calculateCongestion(edge.capacity),
              0
            ) / result.path.length
          );

    const risk = Math.min(
      100,
      Math.round(
        buildingRisk +
          averageCongestion * 0.15
      )
    );

    const score = Math.round(
      totalDistance +
        risk * 5 +
        averageCongestion * 3
    );

    const roadIds = result.path.map((edge) => edge.roadId);

    const candidate: EvacuationRoute = {
      personOrBuilding: building.name,
      exitId: exit.id,
      exitName: exit.name,
      roads: roadIds,
      distance: totalDistance,
      risk,
      congestion: averageCongestion,
      score,
      reason:
        risk < 40
          ? 'Low-risk evacuation route'
          : risk < 70
            ? 'Moderate-risk route selected'
            : 'Best available route despite elevated risk'
    };

    if (!bestRoute || candidate.score < bestRoute.score) {
      bestRoute = candidate;
    }
  }

  return bestRoute;
}

export function findRoutesForAllBuildings(
  scenario: DisasterScenario
): EvacuationRoute[] {
  return buildings
    .map((building) =>
      findSafestRoute(building.id, scenario)
    )
    .filter(
      (route): route is EvacuationRoute =>
        route !== null
    );
}