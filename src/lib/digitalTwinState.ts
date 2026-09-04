import {
  campusToGeo,
  getAuthoritativePopulation,
  polylineToGeo,
  type DigitalTwinAssemblyPoint,
  type DigitalTwinBuilding,
  type DigitalTwinCampus,
  type DigitalTwinExit,
  type DigitalTwinJunction,
  type DigitalTwinRoad,
  type DigitalTwinZone,
  type GeoPoint,
  type RiskVisualLevel,
} from '../data/digitalTwinModel';

import { extractDigitalTwinFeatures } from './digitalTwinExtractor';

import type { CrowdSimulation } from './crowdEngine';
import type { DisasterScenario } from './disasterEngine';

import type { EvacuationRoute } from './routeEngine';
import { findRoutesForAllBuildings } from './routeEngine';

import type {
  RiskLevel,
  RiskSummary,
} from './riskEngine';

export type RoadVisualState =
  | 'open'
  | 'route'
  | 'congested'
  | 'blocked'
  | 'critical';

export type BuildingVisualState =
  | 'normal'
  | 'affected'
  | 'high-risk'
  | 'critical';

export type LiveBuilding = DigitalTwinBuilding & {
  affected: boolean;
  visual: BuildingVisualState;
  riskScore: number;
  riskLevel: RiskVisualLevel;
  geoCenter: GeoPoint;
  geoFootprint: GeoPoint[];
};

export type LiveRoad = DigitalTwinRoad & {
  blocked: boolean;
  congestion: number;
  congestionSeverity: RiskVisualLevel | 'none';
  onEvacuationRoute: boolean;
  visual: RoadVisualState;
  peopleOnRoute: number;
  geoPath: GeoPoint[];
};

export type LiveExit = DigitalTwinExit & {
  blocked: boolean;
  assignedPeople: number;
  geo: GeoPoint;
};

export type LiveAssembly = DigitalTwinAssemblyPoint & {
  currentPopulation: number;
  geo: GeoPoint;
};

export type LiveJunction = DigitalTwinJunction & {
  geo: GeoPoint;
};

export type LiveZone = DigitalTwinZone & {
  liveRisk: number;
  riskLevel: RiskVisualLevel;
  trapped: number;
  geoBounds: GeoPoint[];
};

export type DigitalTwinState = {
  campus: DigitalTwinCampus;
  scenario: DisasterScenario;
  crowd: CrowdSimulation;
  riskAssessment: RiskSummary;
  routes: EvacuationRoute[];
  activeRoadIds: string[];
  buildings: LiveBuilding[];
  roads: LiveRoad[];
  exits: LiveExit[];
  assemblyPoints: LiveAssembly[];
  junctions: LiveJunction[];
  zones: LiveZone[];
  people: CrowdSimulation['agents'];
  bottlenecks: CrowdSimulation['bottlenecks'];
  selectedFeatureId: string | null;
  totalPopulation: number;
};

function toVisualRisk(
  level: RiskLevel | undefined,
  score: number
): RiskVisualLevel {
  if (level) return level;
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function buildingVisual(
  affected: boolean,
  riskLevel: RiskVisualLevel
): BuildingVisualState {
  if (riskLevel === 'critical') return 'critical';
  if (affected) return 'affected';
  if (riskLevel === 'high') return 'high-risk';
  return 'normal';
}

function roadVisual(input: {
  blocked: boolean;
  congestion: number;
  onRoute: boolean;
}): RoadVisualState {
  if (input.blocked && input.congestion >= 90) return 'critical';
  if (input.blocked) return 'blocked';
  if (input.congestion >= 90) return 'critical';
  if (input.congestion >= 60) return 'congested';
  if (input.onRoute) return 'route';
  return 'open';
}

export function buildDigitalTwinState(input: {
  scenario: DisasterScenario;
  crowd: CrowdSimulation;
  risk: RiskSummary;
  selectedFeatureId?: string | null;
  campus?: DigitalTwinCampus;
}): DigitalTwinState {
  const campus =
    input.campus ??
    extractDigitalTwinFeatures();

  const routes =
    findRoutesForAllBuildings(
      input.scenario
    );

  const routeUsage: Record<string, number> = {};

  input.crowd.agents.forEach((agent) => {
    if (agent.status === 'trapped') return;

    agent.route.forEach((roadId) => {
      routeUsage[roadId] =
        (routeUsage[roadId] ?? 0) + 1;
    });
  });

  const activeRoadIds = [
    ...new Set([
      ...Object.keys(routeUsage),
      ...routes.flatMap(
        (route) => route.roads
      ),
    ]),
  ];

  const riskById = new Map(
    input.risk.assessments.map(
      (item) => [item.id, item]
    )
  );

  const buildings: LiveBuilding[] =
    campus.buildings.map((building) => {
      const assessment =
        riskById.get(building.id);

      const riskScore =
        assessment?.score ??
        building.risk;

      const riskLevel =
        toVisualRisk(
          assessment?.level,
          riskScore
        );

      const affected =
        input.scenario.affectedBuildings.includes(
          building.id
        );

      return {
        ...building,
        affected,
        visual:
          buildingVisual(
            affected,
            riskLevel
          ),
        riskScore,
        riskLevel,
        geoCenter:
          campusToGeo(
            building.center.x,
            building.center.y
          ),
        geoFootprint:
          polylineToGeo(
            building.footprint
          ),
      };
    });

  const roads: LiveRoad[] =
    campus.roads.map((road) => {
      const bottleneck =
        input.crowd.bottlenecks.find(
          (item) =>
            item.roadId === road.id
        );

      const congestion =
        bottleneck?.congestion ?? 0;

      const blocked =
        road.blocked ||
        input.scenario.blockedRoads.includes(
          road.id
        );

      const peopleOnRoute =
        routeUsage[road.id] ?? 0;

      const onEvacuationRoute =
        peopleOnRoute > 0 ||
        activeRoadIds.includes(
          road.id
        );

      let congestionSeverity:
        LiveRoad['congestionSeverity'] =
        'none';

      if (congestion >= 80) {
        congestionSeverity = 'critical';
      } else if (congestion >= 60) {
        congestionSeverity = 'high';
      } else if (congestion >= 40) {
        congestionSeverity = 'medium';
      } else if (congestion > 0) {
        congestionSeverity = 'low';
      }

      return {
        ...road,
        blocked,
        congestion,
        congestionSeverity,
        onEvacuationRoute:
          onEvacuationRoute &&
          !blocked,
        visual:
          roadVisual({
            blocked,
            congestion,
            onRoute:
              peopleOnRoute > 0,
          }),
        peopleOnRoute,
        geoPath:
          polylineToGeo(
            road.polyline
          ),
      };
    });

  const exits: LiveExit[] =
    campus.exits.map((exit) => {
      const blocked =
        exit.status === 'blocked' ||
        input.scenario.blockedExits.includes(
          exit.id
        );

      const assignedPeople =
        input.crowd.agents.filter(
          (agent) =>
            agent.targetExitId === exit.id &&
            agent.status === 'evacuating'
        ).length;

      return {
        ...exit,
        blocked,
        assignedPeople,
        geo:
          campusToGeo(
            exit.x,
            exit.y
          ),
      };
    });

  const assemblyPoints: LiveAssembly[] =
    campus.assemblyPoints.map((point) => {
      const currentPopulation =
        input.crowd.agents.filter(
          (agent) => {
            if (agent.status !== 'safe') {
              return false;
            }

            const dx =
              agent.x - point.x;

            const dy =
              agent.y - point.y;

            return (
              Math.hypot(dx, dy) <=
              point.radius * 1.8
            );
          }
        ).length;

      return {
        ...point,
        currentPopulation,
        geo:
          campusToGeo(
            point.x,
            point.y
          ),
      };
    });

  const junctions: LiveJunction[] =
    campus.junctions.map(
      (junction) => ({
        ...junction,
        geo:
          campusToGeo(
            junction.x,
            junction.y
          ),
      })
    );

  const zones: LiveZone[] =
    campus.zones.map((zone) => {
      const assessment =
        riskById.get(zone.id);

      const liveRisk =
        assessment?.score ??
        input.scenario.zoneRisks[
          zone.id
        ] ??
        zone.risk;

      const trapped =
        input.crowd.agents.filter(
          (agent) =>
            agent.zone === zone.id &&
            agent.status === 'trapped'
        ).length;

      return {
        ...zone,
        liveRisk,
        riskLevel:
          toVisualRisk(
            assessment?.level,
            liveRisk
          ),
        trapped,
        geoBounds:
          polylineToGeo([
            {
              x: zone.bounds.minX,
              y: zone.bounds.minY,
            },
            {
              x: zone.bounds.maxX,
              y: zone.bounds.minY,
            },
            {
              x: zone.bounds.maxX,
              y: zone.bounds.maxY,
            },
            {
              x: zone.bounds.minX,
              y: zone.bounds.maxY,
            },
          ]),
      };
    });

  return {
    campus,
    scenario: input.scenario,
    crowd: input.crowd,
    riskAssessment: input.risk,
    routes,
    activeRoadIds,
    buildings,
    roads,
    exits,
    assemblyPoints,
    junctions,
    zones,
    people: input.crowd.agents,
    bottlenecks:
      input.crowd.bottlenecks,
    selectedFeatureId:
      input.selectedFeatureId ?? null,
    totalPopulation:
      input.crowd.totalPeople ||
      getAuthoritativePopulation(),
  };
}
