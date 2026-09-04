import {
  buildings,
  exits,
  roads,
  CampusPerson
} from '../data/campusData';

import {
  generateCampusCrowd
} from './crowdGenerator';

import {
  DisasterScenario
} from './disasterEngine';

import {
  findSafestRoute
} from './routeEngine';


export type CrowdStatus =
  | 'safe'
  | 'evacuating'
  | 'trapped';


export type CrowdAgent = {
  id: string;
  type: CampusPerson['type'];

  x: number;
  y: number;

  startX: number;
  startY: number;

  zone: string;
  risk: number;

  status: CrowdStatus;

  targetExitId: string | null;
  targetExitName: string | null;

  route: string[];
  progress: number;
};


export type Bottleneck = {
  location: string;
  roadId: string | null;
  people: number;
  capacity: number;
  congestion: number;
  severity:
    | 'low'
    | 'medium'
    | 'high'
    | 'critical';
};


export type CrowdSimulation = {
  agents: CrowdAgent[];
  bottlenecks: Bottleneck[];

  totalPeople: number;
  evacuating: number;
  safe: number;
  trapped: number;

  averageCongestion: number;
};


/**
 * Creates the initial crowd state.
 *
 * Important:
 * A route with zero roads is still a valid route
 * when the person is already connected directly to
 * an available emergency exit.
 */
export function createCrowdSimulation(
  scenario: DisasterScenario
): CrowdSimulation {

  const agents: CrowdAgent[] =
    generateCampusCrowd().map((person) => {

      const building =
        findNearestBuilding(
          person.x,
          person.y
        );

      const buildingAffected =
        building
          ? scenario.affectedBuildings.includes(
              building.id
            )
          : false;

      const route =
        building && !buildingAffected
          ? findSafestRoute(
              building.id,
              scenario
            )
          : null;
const targetExitId =
        route?.exitId ?? null;


      const targetExitName =
        route?.exitName ?? null;


      /*
       * FIX:
       *
       * Do NOT treat an empty road array as trapped.
       *
       * Example:
       *
       * Building -> Exit
       *
       * may require zero road segments.
       *
       * That is still a valid evacuation route.
       */
      const isTrapped =
        buildingAffected || !route;


      return {
        id: person.id,

        type: person.type,

        x: person.x,
        y: person.y,

        startX: person.x,
        startY: person.y,

        zone: person.zone,
        risk: person.risk,

        status:
          isTrapped
            ? 'trapped'
            : 'evacuating',

        targetExitId,

        targetExitName,

        route:
          route?.roads ?? [],

        progress: 0
      };
    });


  const bottlenecks =
    detectBottlenecks(
      agents,
      scenario
    );


  return calculateStatistics(
    agents,
    bottlenecks
  );
}


/**
 * Moves the crowd one simulation step.
 */
export function advanceCrowdSimulation(
  simulation: CrowdSimulation,
  scenario: DisasterScenario
): CrowdSimulation {

  const agents =
    simulation.agents.map(
      (agent) => {

        /*
         * Safe and trapped people
         * do not move.
         */
        if (
          agent.status === 'safe' ||
          agent.status === 'trapped'
        ) {
          return agent;
        }


        const currentCongestion =
          getAgentCongestion(
            agent,
            simulation.bottlenecks
          );

        const newProgress =
          Math.min(
            agent.progress +
              getMovementSpeed(
                agent,
                currentCongestion
              ),
            100
          );


        const exit =
          agent.targetExitId
            ? exits.find(
                (item) =>
                  item.id ===
                  agent.targetExitId
              )
            : null;


        let newX =
          agent.x;

        let newY =
          agent.y;


        /*
         * Move toward assigned exit.
         *
         * This works for both:
         *
         * 1. Routes containing roads
         * 2. Direct building -> exit routes
         */
        if (exit) {

          const progressRatio =
            newProgress / 100;


          newX =
            agent.startX +
            (
              exit.x -
              agent.startX
            ) *
            progressRatio;


          newY =
            agent.startY +
            (
              exit.y -
              agent.startY
            ) *
            progressRatio;
        }


        /*
         * Reached exit.
         */
        if (
          newProgress >= 100
        ) {

          return {
            ...agent,

            x:
              exit?.x ??
              newX,

            y:
              exit?.y ??
              newY,

            progress: 100,

            status: 'safe'
          };
        }


        return {
          ...agent,

          x: newX,
          y: newY,

          progress:
            newProgress
        };
      }
    );


  const bottlenecks =
    detectBottlenecks(
      agents,
      scenario
    );


  return calculateStatistics(
    agents,
    bottlenecks
  );
}


/**
 * Detects roads where too many people
 * are attempting to evacuate.
 */
export function detectBottlenecks(
  agents: CrowdAgent[],
  scenario: DisasterScenario
): Bottleneck[] {

  const bottlenecks:
    Bottleneck[] = [];


  const roadUsage:
    Record<string, number> = {};


  agents.forEach(
    (agent) => {

      /*
       * Trapped people do not contribute
       * to road congestion.
       */
      if (
        agent.status === 'trapped'
      ) {
        return;
      }


      agent.route.forEach(
        (roadId) => {

          roadUsage[roadId] =
            (
              roadUsage[roadId] ??
              0
            ) + 1;
        }
      );
    }
  );


  Object.entries(
    roadUsage
  ).forEach(
    ([roadId, people]) => {

      const road =
        findRoad(roadId);


      if (!road) {
        return;
      }


      const congestion =
        (
          people /
          road.capacity
        ) *
        100;


      if (
        congestion < 60
      ) {
        return;
      }


      const severity =
        congestion >= 120
          ? 'critical'
          : congestion >= 90
          ? 'high'
          : congestion >= 70
          ? 'medium'
          : 'low';


      bottlenecks.push({

        location:
          road.name,

        roadId:
          road.id,

        people,

        capacity:
          road.capacity,

        congestion:
          Math.round(
            congestion
          ),

        severity
      });
    }
  );


  return bottlenecks.sort(
    (a, b) =>
      b.congestion -
      a.congestion
  );
}


/**
 * Recalculate routes after the
 * disaster changes.
 */
export function rerouteCrowd(
  simulation: CrowdSimulation,
  scenario: DisasterScenario
): CrowdSimulation {

  const agents =
    simulation.agents.map(
      (agent) => {

        /*
         * People who already reached
         * safety stay safe.
         */
        if (
          agent.status === 'safe'
        ) {
          return agent;
        }


        const building =
          findNearestBuilding(
            agent.startX,
            agent.startY
          );


        if (!building) {

          return {
            ...agent,

            status:
              'trapped' as CrowdStatus,

            targetExitId:
              null,

            targetExitName:
              null,

            route: []
          };
        }
        const buildingAffected =
          scenario.affectedBuildings.includes(
            building.id
          );

        /*
         * If the disaster directly affects the
         * building, people inside are treated as
         * trapped until rescue is performed.
         */
        if (buildingAffected) {
          return {
            ...agent,

            status:
              'trapped' as CrowdStatus,

            targetExitId:
              null,

            targetExitName:
              null,

            route: []
          };
        }




        const route =
          findSafestRoute(
            building.id,
            scenario
          );


        /*
         * No route at all =
         * genuinely trapped.
         */
        if (!route) {

          return {
            ...agent,

            status:
              'trapped' as CrowdStatus,

            targetExitId:
              null,

            targetExitName:
              null,

            route: []
          };
        }


        /*
         * Valid route.
         *
         * This includes routes with
         * zero road segments.
         */
        return {
          ...agent,

          status:
            'evacuating' as CrowdStatus,

          targetExitId:
            route.exitId,

          targetExitName:
            route.exitName,

          route:
            route.roads,

          /*
           * Keep current physical
           * position but restart the
           * progress calculation so
           * rerouting remains visible.
           */
          progress:
            Math.min(
              agent.progress,
              90
            )
        };
      }
    );


  const bottlenecks =
    detectBottlenecks(
      agents,
      scenario
    );


  return calculateStatistics(
    agents,
    bottlenecks
  );
}


/**
 * Finds the building closest to a person.
 */
function findNearestBuilding(
  x: number,
  y: number
) {

  let nearest =
    buildings[0];


  let nearestDistance =
    Infinity;


  buildings.forEach(
    (building) => {

      const centerX =
        building.x +
        building.width / 2;


      const centerY =
        building.y +
        building.height / 2;


      const distance =
        Math.sqrt(
          Math.pow(
            x - centerX,
            2
          ) +
          Math.pow(
            y - centerY,
            2
          )
        );


      if (
        distance <
        nearestDistance
      ) {

        nearestDistance =
          distance;

        nearest =
          building;
      }
    }
  );


  return nearest;
}


/**
 * Finds a road by ID.
 */
function findRoad(
  roadId: string
) {

  return roads.find((item) => item.id === roadId);
}


/**
 * Simulated movement speed.
 */
function getMovementSpeed(
  agent: CrowdAgent,
  congestion: number
): number {

  /*
   * Base movement speed depends on
   * individual risk.
   */
  let speed =
    agent.risk >= 70
      ? 8
      : agent.risk >= 50
      ? 10
      : 12;

  /*
   * Real-time congestion penalty.
   *
   * 0-59%   -> normal
   * 60-89%  -> small slowdown
   * 90-119% -> strong slowdown
   * 120%+   -> severe slowdown
   */
  if (congestion >= 120) {
    speed *= 0.35;
  } else if (congestion >= 90) {
    speed *= 0.55;
  } else if (congestion >= 60) {
    speed *= 0.8;
  }

  return Math.max(2, Math.round(speed * 10) / 10);
}

/**
 * Finds the highest congestion affecting
 * any road in the agent's current route.
 */
function getAgentCongestion(
  agent: CrowdAgent,
  bottlenecks: Bottleneck[]
): number {

  if (agent.route.length === 0) {
    return 0;
  }

  const routeCongestions =
    agent.route
      .map((roadId) => {
        const bottleneck =
          bottlenecks.find(
            (item) =>
              item.roadId === roadId
          );

        return bottleneck?.congestion ?? 0;
      });

  return Math.max(
    0,
    ...routeCongestions
  );
}


/**
 * Calculates dashboard statistics.
 */
function calculateStatistics(
  agents: CrowdAgent[],
  bottlenecks: Bottleneck[]
): CrowdSimulation {

  const safe =
    agents.filter(
      (agent) =>
        agent.status ===
        'safe'
    ).length;


  const evacuating =
    agents.filter(
      (agent) =>
        agent.status ===
        'evacuating'
    ).length;


  const trapped =
    agents.filter(
      (agent) =>
        agent.status ===
        'trapped'
    ).length;


  const averageCongestion =
    bottlenecks.length === 0
      ? 0
      : Math.round(
          bottlenecks.reduce(
            (sum, item) =>
              sum +
              item.congestion,
            0
          ) /
          bottlenecks.length
        );


  return {

    agents,

    bottlenecks,

    totalPeople:
      agents.length,

    evacuating,

    safe,

    trapped,

    averageCongestion
  };
}