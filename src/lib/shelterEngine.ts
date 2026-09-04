import { exits, assemblyPoints } from '../data/campusData';
import { DisasterScenario } from './disasterEngine';
import { CrowdSimulation } from './crowdEngine';
import { RiskSummary } from './riskEngine';

export type Shelter = {
  id: string;
  name: string;
  type: 'shelter' | 'hospital';
  x: number;
  y: number;
  capacity: number;
  occupied: number;
  medicalLevel: number;
};

export type ShelterAllocation = {
  targetId: string;
  targetName: string;
  targetType: 'shelter' | 'hospital';
  people: number;
  capacityAvailable: number;
  riskScore: number;
  routePenalty: number;
  priority: number;
  reason: string;
};

export type ShelterSummary = {
  allocations: ShelterAllocation[];
  totalPeopleToPlace: number;
  peopleAllocated: number;
  unallocatedPeople: number;
  recommendations: string[];
};

export const emergencyFacilities: Shelter[] = [
  {
    id: 's1',
    name: 'Central Assembly Shelter',
    type: 'shelter',
    x: assemblyPoints[0].x,
    y: assemblyPoints[0].y,
    capacity: 1800,
    occupied: 0,
    medicalLevel: 1,
  },
  {
    id: 's2',
    name: 'Sports Assembly Shelter',
    type: 'shelter',
    x: assemblyPoints[1].x,
    y: assemblyPoints[1].y,
    capacity: 1000,
    occupied: 0,
    medicalLevel: 1,
  },
  {
    id: 'h1',
    name: 'Emergency Field Hospital',
    type: 'hospital',
    x: 900,
    y: 560,
    capacity: 250,
    occupied: 0,
    medicalLevel: 5,
  },
  {
    id: 'h2',
    name: 'Campus Medical Center',
    type: 'hospital',
    x: 380,
    y: 540,
    capacity: 180,
    occupied: 0,
    medicalLevel: 4,
  },
];

export function calculateShelterAllocation(
  scenario: DisasterScenario,
  crowdSimulation: CrowdSimulation,
  riskSummary: RiskSummary,
  facilities: Shelter[] = emergencyFacilities
): ShelterSummary {
  /*
   * Shelter placement is intentionally based on SAFE agents only.
   *
   * trapped      = still needs rescue
   * evacuating   = moving toward an exit/assembly point
   * safe         = has completed evacuation and can be placed
   *
   * This keeps the shelter count physically meaningful instead of
   * claiming that trapped or moving people have already arrived.
   */
  const safePeople = crowdSimulation.agents.filter(
    (agent) => agent.status === 'safe'
  );

  const trappedCount = crowdSimulation.agents.filter(
    (agent) => agent.status === 'trapped'
  ).length;

  const evacuatingCount = crowdSimulation.agents.filter(
    (agent) => agent.status === 'evacuating'
  ).length;

  const totalPeopleToPlace = safePeople.length;

  if (totalPeopleToPlace === 0) {
    const recommendations: string[] = [];

    if (trappedCount > 0) {
      recommendations.push(
        `${trappedCount.toLocaleString()} trapped people require rescue before they can enter the shelter system.`
      );
    }

    if (evacuatingCount > 0) {
      recommendations.push(
        `${evacuatingCount.toLocaleString()} people are currently evacuating; shelter placement will begin automatically when they reach safety.`
      );
    }

    if (trappedCount === 0 && evacuatingCount === 0) {
      recommendations.push(
        'No evacuated population currently requires shelter placement.'
      );
    }

    return {
      allocations: [],
      totalPeopleToPlace: 0,
      peopleAllocated: 0,
      unallocatedPeople: 0,
      recommendations,
    };
  }

  const scoredFacilities = facilities
    .map((facility) => {
      const capacityAvailable = Math.max(
        0,
        facility.capacity - facility.occupied
      );

      const routePenalty = getRoutePenalty(facility, scenario);
      const riskScore = getFacilityRisk(
        facility,
        scenario,
        riskSummary
      );

      /*
       * Lower score = better destination.
       * Hospitals receive a preference for high-risk evacuees through
       * their medicalLevel, while normal shelters remain preferred
       * for the majority of the population.
       */
      const score =
        riskScore +
        routePenalty -
        facility.medicalLevel * 4;

      return {
        facility,
        capacityAvailable,
        routePenalty,
        riskScore,
        score,
      };
    })
    .filter((item) => item.capacityAvailable > 0)
    .sort((a, b) => a.score - b.score);

  let remaining = totalPeopleToPlace;
  const allocations: ShelterAllocation[] = [];

  for (const {
    facility,
    capacityAvailable,
    routePenalty,
    riskScore,
  } of scoredFacilities) {
    if (remaining <= 0) break;

    const people = Math.min(
      remaining,
      capacityAvailable
    );

    if (people <= 0) continue;

    allocations.push({
      targetId: facility.id,
      targetName: facility.name,
      targetType: facility.type,
      people,
      capacityAvailable,
      riskScore,
      routePenalty,
      priority: calculatePriority(
        facility,
        people,
        riskScore
      ),
      reason: buildReason(
        facility,
        people,
        riskScore,
        routePenalty
      ),
    });

    remaining -= people;
  }

  const peopleAllocated = totalPeopleToPlace - remaining;
  const recommendations: string[] = [];

  if (allocations.length > 0) {
    const primary = allocations[0];

    recommendations.push(
      `Primary placement: ${primary.targetName} receives ${primary.people.toLocaleString()} people using the safest available capacity.`
    );
  }

  if (allocations.length > 1) {
    recommendations.push(
      `Load balancing activated across ${allocations.length} facilities to prevent a single shelter from becoming overloaded.`
    );
  }

  if (remaining > 0) {
    recommendations.push(
      `${remaining.toLocaleString()} people exceed current facility capacity; activate additional emergency shelters.`
    );
  }

  if (scenario.blockedRoads.length > 0) {
    recommendations.push(
      `Access-aware allocation is active because ${scenario.blockedRoads.length} road(s) are blocked.`
    );
  }

  if (scenario.blockedExits.length > 0) {
    recommendations.push(
      `Exit-aware allocation is active because ${scenario.blockedExits.length} emergency exit(s) are blocked.`
    );
  }

  if (trappedCount > 0) {
    recommendations.push(
      `${trappedCount.toLocaleString()} trapped people remain outside shelter capacity until rescue is completed.`
    );
  }

  return {
    allocations,
    totalPeopleToPlace,
    peopleAllocated,
    unallocatedPeople: remaining,
    recommendations: recommendations.slice(0, 5),
  };
}

function getFacilityRisk(
  facility: Shelter,
  scenario: DisasterScenario,
  riskSummary: RiskSummary
): number {
  const nearestExit = exits.reduce(
    (best, exit) =>
      distance(
        facility.x,
        facility.y,
        exit.x,
        exit.y
      ) <
      distance(
        facility.x,
        facility.y,
        best.x,
        best.y
      )
        ? exit
        : best,
    exits[0]
  );

  const exitRisk =
    riskSummary.assessments.find(
      (assessment) =>
        assessment.type === 'exit' &&
        assessment.id === nearestExit.id
    )?.score ?? 20;

  let disasterPenalty = 0;

  if (
    scenario.type === 'flood' &&
    facility.y > 300
  ) {
    disasterPenalty += 35;
  }

  if (
    scenario.type === 'cyclone' &&
    facility.y < 250
  ) {
    disasterPenalty += 20;
  }

  if (
    scenario.type === 'fire' &&
    facility.id === 'h2'
  ) {
    disasterPenalty += 15;
  }

  return Math.min(
    100,
    Math.round(
      exitRisk * 0.35 +
        disasterPenalty +
        facility.medicalLevel * 3
    )
  );
}

function getRoutePenalty(
  facility: Shelter,
  scenario: DisasterScenario
): number {
  let penalty = 0;

  if (
    scenario.blockedExits.includes('e2') &&
    facility.x < 500
  ) {
    penalty += 12;
  }

  if (
    scenario.blockedExits.includes('e3') &&
    facility.x > 700
  ) {
    penalty += 12;
  }

  if (
    scenario.blockedRoads.includes('r4') &&
    facility.y > 450
  ) {
    penalty += 8;
  }

  if (
    scenario.blockedRoads.includes('r7') &&
    facility.x > 700
  ) {
    penalty += 8;
  }

  return penalty;
}

function calculatePriority(
  facility: Shelter,
  people: number,
  riskScore: number
): number {
  const capacityPressure =
    (people / Math.max(1, facility.capacity)) * 100;

  return Math.min(
    100,
    Math.round(
      capacityPressure * 0.35 +
        (100 - riskScore) * 0.45 +
        facility.medicalLevel * 2
    )
  );
}

function buildReason(
  facility: Shelter,
  people: number,
  riskScore: number,
  routePenalty: number
): string {
  const reasons: string[] = [
    `${people.toLocaleString()} people allocated`,
  ];

  if (riskScore < 40) {
    reasons.push('low facility risk');
  } else if (riskScore < 65) {
    reasons.push('moderate facility risk');
  } else {
    reasons.push('elevated facility risk');
  }

  if (facility.type === 'hospital') {
    reasons.push(
      `medical level ${facility.medicalLevel}/5`
    );
  }

  if (routePenalty > 0) {
    reasons.push(`${routePenalty} access penalty`);
  }

  return reasons.join(' + ');
}

function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(
    Math.pow(x1 - x2, 2) +
      Math.pow(y1 - y2, 2)
  );
}
