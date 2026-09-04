import {
  buildings,
  campusZones,
  exits,
  roads
} from '../data/campusData';
import { getBuildingZoneId } from '../data/digitalTwinModel';

import {
  DisasterScenario
} from './disasterEngine';

import {
  CrowdSimulation
} from './crowdEngine';


/* =========================================================
   TYPES
========================================================= */

export type RiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';


export type RiskFactor = {
  name: string;
  value: number;
  weight: number;
  explanation: string;
};


export type RiskAssessment = {
  id: string;
  name: string;
  type: 'building' | 'zone' | 'road' | 'exit';

  score: number;
  level: RiskLevel;

  factors: RiskFactor[];

  reasons: string[];

  recommendations: string[];
};


export type RiskSummary = {
  overallScore: number;
  overallLevel: RiskLevel;

  critical: number;
  high: number;
  medium: number;
  low: number;

  assessments: RiskAssessment[];

  priorityActions: string[];
};


/* =========================================================
   MAIN RISK ENGINE
========================================================= */

/**
 * Runs the complete offline risk analysis.
 *
 * This is intentionally deterministic and explainable.
 * It combines disaster severity, infrastructure risk,
 * population exposure, crowd pressure and congestion.
 */
export function calculateRiskAssessment(
  scenario: DisasterScenario,
  crowdSimulation: CrowdSimulation
): RiskSummary {

  const assessments: RiskAssessment[] = [];


  /* -------------------------------------------------------
     BUILDING RISK
  ------------------------------------------------------- */

  buildings.forEach((building) => {

    const affected =
      scenario.affectedBuildings.includes(
        building.id
      );


    const zone = campusZones.find(
      (item) => item.id === getBuildingZoneId(building.id)
    );


    const zoneRisk =
      zone?.risk ?? 0;


    const populationPressure =
      Math.min(
        100,
        (
          building.occupants /
          building.capacity
        ) * 100
      );


    const crowdPressure =
      getBuildingCrowdPressure(
        building.id,
        crowdSimulation
      );


    const disasterExposure =
      affected
        ? scenario.severity * 20
        : scenario.severity * 6;


    const structuralRisk =
      building.risk;


    const score =
      Math.round(
        clamp(
          structuralRisk * 0.28 +
          zoneRisk * 0.15 +
          populationPressure * 0.17 +
          crowdPressure * 0.15 +
          disasterExposure * 0.25,
          0,
          100
        )
      );


    const factors: RiskFactor[] = [

      {
        name:
          'Structural vulnerability',

        value:
          structuralRisk,

        weight:
          28,

        explanation:
          building.risk >= 50
            ? 'Building has elevated vulnerability.'
            : 'Building has relatively low structural vulnerability.'
      },


      {
        name:
          'Zone exposure',

        value:
          zoneRisk,

        weight:
          15,

        explanation:
          zoneRisk >= 50
            ? 'Surrounding zone has elevated disaster risk.'
            : 'Surrounding zone has relatively low risk.'
      },


      {
        name:
          'Population pressure',

        value:
          Math.round(
            populationPressure
          ),

        weight:
          17,

        explanation:
          populationPressure >= 80
            ? 'Occupancy is close to building capacity.'
            : 'Occupancy is within available capacity.'
      },


      {
        name:
          'Crowd pressure',

        value:
          Math.round(
            crowdPressure
          ),

        weight:
          15,

        explanation:
          crowdPressure >= 70
            ? 'Large number of people require evacuation.'
            : 'Crowd pressure is manageable.'
      },


      {
        name:
          'Disaster exposure',

        value:
          Math.round(
            disasterExposure
          ),

        weight:
          25,

        explanation:
          affected
            ? 'Building is directly affected by the active disaster.'
            : 'Building has indirect exposure to the disaster.'
      }
    ];


    const reasons: string[] = [];


    if (affected) {
      reasons.push(
        `${capitalize(scenario.type)} directly affects this building.`
      );
    }


    if (building.risk >= 50) {
      reasons.push(
        'Building vulnerability is elevated.'
      );
    }


    if (populationPressure >= 80) {
      reasons.push(
        'Occupancy is close to maximum capacity.'
      );
    }


    if (zoneRisk >= 50) {
      reasons.push(
        'The surrounding zone has high risk.'
      );
    }


    if (crowdPressure >= 70) {
      reasons.push(
        'High evacuation demand is creating crowd pressure.'
      );
    }


    if (reasons.length === 0) {
      reasons.push(
        'No major risk factor currently dominates.'
      );
    }


    const recommendations =
      getBuildingRecommendations(
        score,
        affected,
        populationPressure,
        crowdPressure
      );


    assessments.push({

      id:
        building.id,

      name:
        building.name,

      type:
        'building',

      score,

      level:
        getRiskLevel(score),

      factors,

      reasons,

      recommendations
    });

  });


  /* -------------------------------------------------------
     ZONE RISK
  ------------------------------------------------------- */

  campusZones.forEach((zone) => {

    /*
     * disasterEngine stores zoneRisks as a keyed object:
     * { z1: number, z2: number, ... }
     *
     * Use the zone id directly instead of Array.find().
     */
    const scenarioRisk =
      scenario.zoneRisks[zone.id] ??
      zone.risk;


    const zonePeople =
      crowdSimulation.agents.filter(
        (agent) =>
          agent.zone === zone.id
      ).length;


    const trappedPeople =
      crowdSimulation.agents.filter(
        (agent) =>
          agent.zone === zone.id &&
          agent.status === 'trapped'
      ).length;


    const crowdRisk =
      zonePeople === 0
        ? 0
        : (
            trappedPeople /
            zonePeople
          ) * 100;


    const score =
      Math.round(
        clamp(
          scenarioRisk * 0.55 +
          crowdRisk * 0.30 +
          scenario.severity * 3,
          0,
          100
        )
      );


    const reasons: string[] = [];


    if (scenarioRisk >= 60) {
      reasons.push(
        'Zone has high disaster exposure.'
      );
    }


    if (crowdRisk >= 50) {
      reasons.push(
        'A significant portion of the zone population is trapped.'
      );
    }


    if (zonePeople > zone.population * 0.9) {
      reasons.push(
        'Population concentration is high.'
      );
    }


    if (reasons.length === 0) {
      reasons.push(
        'Zone currently has manageable risk.'
      );
    }


    assessments.push({

      id:
        zone.id,

      name:
        zone.name,

      type:
        'zone',

      score,

      level:
        getRiskLevel(score),

      factors: [

        {
          name:
            'Disaster exposure',

          value:
            scenarioRisk,

          weight:
            55,

          explanation:
            'Risk contributed by the active disaster.'
        },

        {
          name:
            'Crowd pressure',

          value:
            Math.round(crowdRisk),

          weight:
            30,

          explanation:
            'Risk caused by evacuation difficulty.'
        },

        {
          name:
            'Severity',

          value:
            scenario.severity * 20,

          weight:
            15,

          explanation:
            'Global disaster severity contribution.'
        }

      ],

      reasons,

      recommendations:
        getZoneRecommendations(
          score,
          trappedPeople
        )
    });

  });


  /* -------------------------------------------------------
     ROAD RISK
  ------------------------------------------------------- */

  roads.forEach((road) => {

    const blocked =
      scenario.blockedRoads.includes(
        road.id
      );


    const bottleneck =
      crowdSimulation.bottlenecks.find(
        (item) =>
          item.roadId === road.id
      );


    const congestion =
      bottleneck?.congestion ?? 0;


    const blockedRisk =
      blocked
        ? 100
        : 0;


    const congestionRisk =
      Math.min(
        100,
        congestion
      );


    const score =
      Math.round(
        clamp(
          blockedRisk * 0.60 +
          congestionRisk * 0.40,
          0,
          100
        )
      );


    const reasons: string[] = [];


    if (blocked) {
      reasons.push(
        'Road is blocked by the active disaster scenario.'
      );
    }


    if (congestion >= 100) {
      reasons.push(
        'Road demand exceeds available capacity.'
      );
    } else if (congestion >= 60) {
      reasons.push(
        'Road is experiencing significant congestion.'
      );
    }


    if (reasons.length === 0) {
      reasons.push(
        'Road is currently operational with manageable traffic.'
      );
    }


    assessments.push({

      id:
        road.id,

      name:
        road.name,

      type:
        'road',

      score,

      level:
        getRiskLevel(score),

      factors: [

        {
          name:
            'Blocked status',

          value:
            blockedRisk,

          weight:
            60,

          explanation:
            blocked
              ? 'Road cannot currently be used.'
              : 'Road is operational.'
        },

        {
          name:
            'Congestion',

          value:
            Math.round(
              congestionRisk
            ),

          weight:
            40,

          explanation:
            `${Math.round(congestionRisk)}% estimated demand pressure.`
        }

      ],

      reasons,

      recommendations:
        getRoadRecommendations(
          blocked,
          congestion
        )
    });

  });


  /* -------------------------------------------------------
     EXIT RISK
  ------------------------------------------------------- */

  exits.forEach((exit) => {

    const blocked =
      scenario.blockedExits.includes(
        exit.id
      );


    const peopleUsingExit =
      crowdSimulation.agents.filter(
        (agent) =>
          agent.targetExitId ===
          exit.id &&
          agent.status ===
          'evacuating'
      ).length;


    const exitPressure =
      Math.min(
        100,
        (
          peopleUsingExit /
          exit.capacity
        ) * 100
      );


    const score =
      Math.round(
        clamp(
          blocked
            ? 100
            : exitPressure,
          0,
          100
        )
      );


    const reasons: string[] = [];


    if (blocked) {

      reasons.push(
        'Emergency exit is blocked.'
      );

    } else if (
      exitPressure >= 80
    ) {

      reasons.push(
        'Exit is approaching evacuation capacity.'
      );

    } else if (
      exitPressure >= 50
    ) {

      reasons.push(
        'Exit has moderate evacuation pressure.'
      );

    } else {

      reasons.push(
        'Exit has available evacuation capacity.'
      );
    }


    assessments.push({

      id:
        exit.id,

      name:
        exit.name,

      type:
        'exit',

      score,

      level:
        getRiskLevel(score),

      factors: [

        {
          name:
            'Blocked status',

          value:
            blocked
              ? 100
              : 0,

          weight:
            60,

          explanation:
            blocked
              ? 'Exit is unavailable.'
              : 'Exit is operational.'
        },

        {
          name:
            'Evacuation pressure',

          value:
            Math.round(
              exitPressure
            ),

          weight:
            40,

          explanation:
            `${peopleUsingExit} people currently assigned to this exit.`
        }

      ],

      reasons,

      recommendations:
        getExitRecommendations(
          blocked,
          exitPressure
        )
    });

  });


  /* -------------------------------------------------------
     SUMMARY
  ------------------------------------------------------- */

  const critical =
    assessments.filter(
      (item) =>
        item.level ===
        'critical'
    ).length;


  const high =
    assessments.filter(
      (item) =>
        item.level ===
        'high'
    ).length;


  const medium =
    assessments.filter(
      (item) =>
        item.level ===
        'medium'
    ).length;


  const low =
    assessments.filter(
      (item) =>
        item.level ===
        'low'
    ).length;


  const overallScore =
    assessments.length === 0
      ? 0
      : Math.round(
          assessments.reduce(
            (sum, item) =>
              sum + item.score,
            0
          ) /
          assessments.length
        );


  const priorityActions =
    generatePriorityActions(
      assessments,
      scenario
    );


  return {

    overallScore,

    overallLevel:
      getRiskLevel(
        overallScore
      ),

    critical,

    high,

    medium,

    low,

    assessments,

    priorityActions
  };
}


/* =========================================================
   BUILDING CROWD PRESSURE
========================================================= */

function getBuildingCrowdPressure(
  buildingId: string,
  simulation: CrowdSimulation
): number {

  const buildingPeople =
    simulation.agents.filter(
      (agent) => {

        const building =
          findNearestBuilding(
            agent.x,
            agent.y
          );

        return (
          building?.id ===
          buildingId
        );
      }
    );


  if (
    buildingPeople.length === 0
  ) {
    return 0;
  }


  const trapped =
    buildingPeople.filter(
      (agent) =>
        agent.status ===
        'trapped'
    ).length;


  const evacuating =
    buildingPeople.filter(
      (agent) =>
        agent.status ===
        'evacuating'
    ).length;


  return Math.min(
    100,
    trapped *
      100 /
      buildingPeople.length +
      evacuating *
      30 /
      buildingPeople.length
  );
}


/* =========================================================
   RECOMMENDATIONS
========================================================= */

function getBuildingRecommendations(
  score: number,
  affected: boolean,
  populationPressure: number,
  crowdPressure: number
): string[] {

  const recommendations:
    string[] = [];


  if (
    affected &&
    score >= 70
  ) {
    recommendations.push(
      'Prioritize this building for immediate evacuation.'
    );
  }


  if (
    populationPressure >= 80
  ) {
    recommendations.push(
      'Deploy additional evacuation guidance personnel.'
    );
  }


  if (
    crowdPressure >= 70
  ) {
    recommendations.push(
      'Distribute evacuation flow across alternative exits.'
    );
  }


  if (
    score >= 80
  ) {
    recommendations.push(
      'Continuously monitor this location.'
    );
  }


  if (
    recommendations.length === 0
  ) {
    recommendations.push(
      'Maintain normal emergency monitoring.'
    );
  }


  return recommendations;
}


function getZoneRecommendations(
  score: number,
  trappedPeople: number
): string[] {

  const recommendations:
    string[] = [];


  if (score >= 75) {
    recommendations.push(
      'Prioritize this zone in the evacuation sequence.'
    );
  }


  if (trappedPeople > 0) {
    recommendations.push(
      `Coordinate rescue support for ${trappedPeople} trapped people.`
    );
  }


  if (
    recommendations.length === 0
  ) {
    recommendations.push(
      'Continue monitoring zone conditions.'
    );
  }


  return recommendations;
}


function getRoadRecommendations(
  blocked: boolean,
  congestion: number
): string[] {

  const recommendations:
    string[] = [];


  if (blocked) {

    recommendations.push(
      'Remove this road from evacuation routing.'
    );

    recommendations.push(
      'Use an alternative accessible route.'
    );

  } else if (
    congestion >= 100
  ) {

    recommendations.push(
      'Immediately reroute part of the evacuation flow.'
    );

  } else if (
    congestion >= 70
  ) {

    recommendations.push(
      'Monitor congestion and prepare alternate routing.'
    );

  } else {

    recommendations.push(
      'Road can continue supporting evacuation.'
    );
  }


  return recommendations;
}


function getExitRecommendations(
  blocked: boolean,
  pressure: number
): string[] {

  const recommendations:
    string[] = [];


  if (blocked) {

    recommendations.push(
      'Remove this exit from evacuation assignments.'
    );

  } else if (
    pressure >= 80
  ) {

    recommendations.push(
      'Redirect new evacuees to lower-pressure exits.'
    );

  } else {

    recommendations.push(
      'Exit is suitable for continued evacuation.'
    );
  }


  return recommendations;
}


/* =========================================================
   PRIORITY ACTIONS
========================================================= */

function generatePriorityActions(
  assessments: RiskAssessment[],
  scenario: DisasterScenario
): string[] {

  const actions:
    string[] = [];


  const criticalBuildings =
    assessments.filter(
      (item) =>
        item.type === 'building' &&
        item.level === 'critical'
    );


  const blockedRoads =
    assessments.filter(
      (item) =>
        item.type === 'road' &&
        item.score >= 80
    );


  const blockedExits =
    assessments.filter(
      (item) =>
        item.type === 'exit' &&
        item.score >= 80
    );


  criticalBuildings
    .slice(0, 3)
    .forEach(
      (building) => {

        actions.push(
          `Prioritize evacuation of ${building.name}.`
        );

      }
    );


  blockedRoads
    .slice(0, 2)
    .forEach(
      (road) => {

        actions.push(
          `Avoid ${road.name} and reroute evacuation traffic.`
        );

      }
    );


  blockedExits
    .slice(0, 2)
    .forEach(
      (exit) => {

        actions.push(
          `Do not assign new evacuees to ${exit.name}.`
        );

      }
    );


  if (
    scenario.severity >= 4
  ) {

    actions.push(
      'High-severity disaster detected: increase emergency response priority.'
    );

  }


  if (
    actions.length === 0
  ) {

    actions.push(
      'No critical intervention required. Continue monitoring live conditions.'
    );

  }


  return actions.slice(
    0,
    6
  );
}


/* =========================================================
   HELPERS
========================================================= */

function getRiskLevel(
  score: number
): RiskLevel {

  if (score >= 80) {
    return 'critical';
  }


  if (score >= 60) {
    return 'high';
  }


  if (score >= 35) {
    return 'medium';
  }


  return 'low';
}


function clamp(
  value: number,
  min: number,
  max: number
): number {

  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}


function capitalize(
  value: string
): string {

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}


/**
 * Same building association used by the
 * crowd generator / simulation.
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