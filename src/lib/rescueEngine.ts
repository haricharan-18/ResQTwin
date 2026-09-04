import { buildings } from '../data/campusData';
import { DisasterScenario } from './disasterEngine';
import { CrowdSimulation } from './crowdEngine';
import { RiskSummary } from './riskEngine';

export type RescueResourceType =
  | 'rescue-team'
  | 'ambulance'
  | 'medical-team'
  | 'supply-unit';

export type RescueResource = {
  id: string;
  name: string;
  type: RescueResourceType;
  capacity: number;
  responseTime: number;
};

export type RescueAssignment = {
  resourceId: string;
  resourceName: string;
  resourceType: RescueResourceType;
  targetId: string;
  targetName: string;
  targetType: 'building' | 'zone';
  priority: number;
  trappedPeople: number;
  riskScore: number;
  estimatedResponseMinutes: number;
  reason: string;
  status: 'recommended';
};

export type RescueSummary = {
  assignments: RescueAssignment[];
  totalTrapped: number;
  criticalTargets: number;
  estimatedPeopleSupported: number;
  recommendations: string[];
};

const defaultResources: RescueResource[] = [
  {
    id: 'rescue-1',
    name: 'Rescue Team Alpha',
    type: 'rescue-team',
    capacity: 80,
    responseTime: 4,
  },
  {
    id: 'rescue-2',
    name: 'Rescue Team Bravo',
    type: 'rescue-team',
    capacity: 80,
    responseTime: 6,
  },
  {
    id: 'ambulance-1',
    name: 'Ambulance Unit 1',
    type: 'ambulance',
    capacity: 8,
    responseTime: 5,
  },
  {
    id: 'medical-1',
    name: 'Mobile Medical Team',
    type: 'medical-team',
    capacity: 40,
    responseTime: 7,
  },
  {
    id: 'supply-1',
    name: 'Emergency Supply Unit',
    type: 'supply-unit',
    capacity: 120,
    responseTime: 8,
  },
];

export function calculateRescueAllocation(
  scenario: DisasterScenario,
  crowdSimulation: CrowdSimulation,
  riskSummary: RiskSummary,
  resources: RescueResource[] = defaultResources
): RescueSummary {
  const trappedAgents = crowdSimulation.agents.filter(
    (agent) => agent.status === 'trapped'
  );

  const buildingTargets = buildings
    .map((building) => {
      const trappedPeople = trappedAgents.filter((agent) => {
        const nearest = findNearestBuilding(agent.x, agent.y);
        return nearest?.id === building.id;
      }).length;

      const risk = riskSummary.assessments.find(
        (assessment) =>
          assessment.type === 'building' && assessment.id === building.id
      );

      return {
        id: building.id,
        name: building.name,
        type: 'building' as const,
        trappedPeople,
        riskScore: risk?.score ?? building.risk,
      };
    })
    .filter((target) => target.trappedPeople > 0);

  const zoneTargets = new Map<
    string,
    { id: string; name: string; trappedPeople: number; riskScore: number }
  >();

  trappedAgents.forEach((agent) => {
    const existing = zoneTargets.get(agent.zone);

    const zoneRisk = riskSummary.assessments.find(
      (assessment) =>
        assessment.type === 'zone' && assessment.id === agent.zone
    );

    if (existing) {
      existing.trappedPeople += 1;
    } else {
      zoneTargets.set(agent.zone, {
        id: agent.zone,
        name: zoneRisk?.name ?? agent.zone,
        trappedPeople: 1,
        riskScore: zoneRisk?.score ?? 50,
      });
    }
  });

  const targets = [
    ...buildingTargets,
    ...Array.from(zoneTargets.values()).map((zone) => ({
      ...zone,
      type: 'zone' as const,
    })),
  ].sort(
    (a, b) =>
      getPriority(b.trappedPeople, b.riskScore) -
      getPriority(a.trappedPeople, a.riskScore)
  );

  const assignments: RescueAssignment[] = [];

  /*
   * Every resource can only be assigned once.
   * Targets are already sorted by priority, so the
   * highest-priority target receives the first resource,
   * the next target receives the second resource, etc.
   */
  targets.slice(0, resources.length).forEach((target, index) => {
    const resource = chooseResource(target, resources, index);
    const roadPenalty = getRoadPenalty(scenario);
    const responseTime = resource.responseTime + roadPenalty;

    assignments.push({
      resourceId: resource.id,
      resourceName: resource.name,
      resourceType: resource.type,
      targetId: target.id,
      targetName: target.name,
      targetType: target.type,
      priority: getPriority(target.trappedPeople, target.riskScore),
      trappedPeople: target.trappedPeople,
      riskScore: target.riskScore,
      estimatedResponseMinutes: responseTime,
      reason: buildReason(
        target.trappedPeople,
        target.riskScore,
        scenario
      ),
      status: 'recommended',
    });
  });

  const totalTrapped = trappedAgents.length;

  const criticalTargets = targets.filter(
    (target) => target.riskScore >= 80 || target.trappedPeople >= 50
  ).length;

  const estimatedPeopleSupported = assignments.reduce(
    (sum, assignment) =>
      sum +
      Math.min(
        assignment.trappedPeople,
        getResourceCapacity(assignment, resources)
      ),
    0
  );

  const recommendations = buildRecommendations(
    assignments,
    totalTrapped,
    scenario
  );

  return {
    assignments,
    totalTrapped,
    criticalTargets,
    estimatedPeopleSupported,
    recommendations,
  };
}

function chooseResource(
  target: {
    trappedPeople: number;
    riskScore: number;
  },
  resources: RescueResource[],
  index: number
): RescueResource {
  /*
   * Keep assignment unique while still matching the
   * resource type to the target where possible.
   */
  const preferredTypes: RescueResourceType[] =
    target.trappedPeople >= 20
      ? ['rescue-team', 'medical-team', 'ambulance', 'supply-unit']
      : target.riskScore >= 75
      ? ['medical-team', 'ambulance', 'rescue-team', 'supply-unit']
      : ['rescue-team', 'ambulance', 'medical-team', 'supply-unit'];

  const preferred = preferredTypes
    .map((type) => resources.find((resource) => resource.type === type))
    .filter((resource): resource is RescueResource => Boolean(resource));

  const resource = preferred[index];

  return resource ?? resources[index % resources.length];
}

function getResourceCapacity(
  assignment: RescueAssignment,
  resources: RescueResource[]
): number {
  return (
    resources.find(
      (resource) => resource.id === assignment.resourceId
    )?.capacity ?? 0
  );
}

function getPriority(
  trappedPeople: number,
  riskScore: number
): number {
  return Math.min(
    100,
    Math.round(
      trappedPeople * 0.55 +
        riskScore * 0.45
    )
  );
}

function getRoadPenalty(
  scenario: DisasterScenario
): number {
  const blocked = scenario.blockedRoads.length;

  if (blocked >= 4) return 12;
  if (blocked >= 2) return 7;
  if (blocked >= 1) return 3;

  return 0;
}

function buildReason(
  trappedPeople: number,
  riskScore: number,
  scenario: DisasterScenario
): string {
  const reasons: string[] = [];

  if (trappedPeople > 0) {
    reasons.push(
      `${trappedPeople} trapped people detected`
    );
  }

  if (riskScore >= 80) {
    reasons.push('critical risk');
  } else if (riskScore >= 60) {
    reasons.push('high risk');
  }

  if (scenario.severity >= 4) {
    reasons.push('high-severity disaster');
  }

  return reasons.length > 0
    ? reasons.join(' + ')
    : 'Priority based on current disaster conditions';
}

function buildRecommendations(
  assignments: RescueAssignment[],
  totalTrapped: number,
  scenario: DisasterScenario
): string[] {
  const recommendations: string[] = [];

  if (totalTrapped > 0) {
    recommendations.push(
      `Deploy rescue resources toward ${assignments.length} highest-priority targets.`
    );
  }

  if (scenario.blockedRoads.length > 0) {
    recommendations.push(
      `Use alternate access routes because ${scenario.blockedRoads.length} road(s) are blocked.`
    );
  }

  const medicalTarget = assignments.find(
    (assignment) =>
      assignment.resourceType === 'medical-team' ||
      assignment.resourceType === 'ambulance'
  );

  if (medicalTarget) {
    recommendations.push(
      `Position medical support near ${medicalTarget.targetName}.`
    );
  }

  if (scenario.blockedExits.length > 0) {
    recommendations.push(
      `Keep rescue access separate from ${scenario.blockedExits.length} blocked emergency exit(s).`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'No immediate rescue deployment required; continue monitoring.'
    );
  }

  return recommendations.slice(0, 5);
}

function findNearestBuilding(x: number, y: number) {
  let nearest = buildings[0];
  let nearestDistance = Infinity;

  buildings.forEach((building) => {
    const centerX = building.x + building.width / 2;
    const centerY = building.y + building.height / 2;

    const distance = Math.sqrt(
      Math.pow(x - centerX, 2) +
        Math.pow(y - centerY, 2)
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = building;
    }
  });

  return nearest;
}
