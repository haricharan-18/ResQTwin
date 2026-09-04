import { CrowdSimulation } from './crowdEngine';
import { DisasterScenario } from './disasterEngine';

export type EvacuationTimeSummary = {
  estimatedSeconds: number;
  estimatedMinutes: number;
  evacuatedPeople: number;
  remainingPeople: number;
  trappedPeople: number;
  bottleneckDelaySeconds: number;
  disasterDelaySeconds: number;
  congestionDelaySeconds: number;
  confidence: 'high' | 'medium' | 'low';
  message: string;
};

export function calculateEvacuationTime(
  scenario: DisasterScenario,
  crowdSimulation: CrowdSimulation
): EvacuationTimeSummary {
  const agents = crowdSimulation.agents;

  const evacuatedPeople = agents.filter(
    (agent) => agent.status === 'safe'
  ).length;

  const remainingPeople = agents.filter(
    (agent) => agent.status === 'evacuating'
  ).length;

  const trappedPeople = agents.filter(
    (agent) => agent.status === 'trapped'
  ).length;

  const bottlenecks = crowdSimulation.bottlenecks ?? [];

  const totalPopulation = agents.length;

  if (totalPopulation === 0) {
    return {
      estimatedSeconds: 0,
      estimatedMinutes: 0,
      evacuatedPeople: 0,
      remainingPeople: 0,
      trappedPeople: 0,
      bottleneckDelaySeconds: 0,
      disasterDelaySeconds: 0,
      congestionDelaySeconds: 0,
      confidence: 'low',
      message: 'No crowd simulation data is available.',
    };
  }

  // Base evacuation flow time.
  const baseSecondsPerPerson = 0.8;

  // Higher disaster severity slows evacuation.
  const disasterDelayMultiplier =
    1 + scenario.severity * 0.12;

  // Blocked infrastructure creates additional delay.
  const infrastructureDelay =
    scenario.blockedRoads.length * 12 +
    scenario.blockedExits.length * 25;

  // Bottlenecks create crowd-flow delays.
  const bottleneckDelaySeconds =
    bottlenecks.length * 35;

  // People still moving or trapped require additional time.
  const movingPopulation =
    remainingPeople + trappedPeople;

  const baseTime =
    Math.max(1, movingPopulation) *
    baseSecondsPerPerson;

  const disasterDelaySeconds =
    baseTime * (disasterDelayMultiplier - 1);

  const congestionDelaySeconds =
    Math.max(
      0,
      movingPopulation - evacuatedPeople
    ) * 0.15;

  const estimatedSeconds =
    Math.round(
      baseTime +
      disasterDelaySeconds +
      infrastructureDelay +
      bottleneckDelaySeconds +
      congestionDelaySeconds
    );

  const estimatedMinutes =
    Math.max(
      1,
      Math.ceil(estimatedSeconds / 60)
    );

  let confidence: 'high' | 'medium' | 'low' = 'high';

  if (
    trappedPeople >
    totalPopulation * 0.25
  ) {
    confidence = 'low';
  } else if (
    bottlenecks.length > 2 ||
    scenario.blockedRoads.length >= 3
  ) {
    confidence = 'medium';
  }

  let message =
    'Evacuation flow is currently stable.';

  if (trappedPeople > 0) {
    message =
      `${trappedPeople.toLocaleString()} people remain trapped and require rescue.`;
  } else if (bottlenecks.length > 0) {
    message =
      `${bottlenecks.length} bottleneck(s) are increasing evacuation time.`;
  } else if (
    scenario.blockedRoads.length > 0
  ) {
    message =
      `${scenario.blockedRoads.length} blocked road(s) are increasing evacuation time.`;
  }

  return {
    estimatedSeconds,
    estimatedMinutes,
    evacuatedPeople,
    remainingPeople,
    trappedPeople,
    bottleneckDelaySeconds,
    disasterDelaySeconds:
      Math.round(disasterDelaySeconds),
    congestionDelaySeconds:
      Math.round(congestionDelaySeconds),
    confidence,
    message,
  };
}