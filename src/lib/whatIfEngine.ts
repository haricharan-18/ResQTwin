import { DisasterType, simulateDisaster } from './disasterEngine';
import {
  CrowdSimulation,
  createCrowdSimulation,
} from './crowdEngine';
import {
  calculateEvacuationTime,
  EvacuationTimeSummary,
} from './evacuationTimeEngine';
import {
  calculateRiskAssessment,
  RiskSummary,
} from './riskEngine';

export type WhatIfResult = {
  severity: number;
  scenario: ReturnType<typeof simulateDisaster>;
  crowd: CrowdSimulation;
  risk: RiskSummary;
  evacuationTime: EvacuationTimeSummary;
};

export type WhatIfComparison = {
  disasterType: DisasterType;
  baseline: WhatIfResult;
  scenarios: WhatIfResult[];
  worstCase: WhatIfResult;
  bestCase: WhatIfResult;
};

export function calculateWhatIfComparison(
  disasterType: DisasterType,
  baselineSeverity: number
): WhatIfComparison {
  const safeSeverity = Math.max(
    1,
    Math.min(5, Math.round(baselineSeverity))
  );

  const scenarios = [1, 2, 3, 4, 5].map((severity) => {
    const scenario = simulateDisaster(disasterType, severity);
    const crowd = createCrowdSimulation(scenario);
    const risk = calculateRiskAssessment(scenario, crowd);
    const evacuationTime = calculateEvacuationTime(scenario, crowd);

    return {
      severity,
      scenario,
      crowd,
      risk,
      evacuationTime,
    };
  });

  const baseline =
    scenarios.find((item) => item.severity === safeSeverity) ??
    scenarios[0];

  const worstCase = scenarios.reduce((worst, current) =>
    getSeverityScore(current) > getSeverityScore(worst)
      ? current
      : worst
  );

  const bestCase = scenarios.reduce((best, current) =>
    getSeverityScore(current) < getSeverityScore(best)
      ? current
      : best
  );

  return {
    disasterType,
    baseline,
    scenarios,
    worstCase,
    bestCase,
  };
}

function getSeverityScore(result: WhatIfResult): number {
  return (
    result.crowd.trapped * 2 +
    result.risk.overallScore * 10 +
    result.evacuationTime.estimatedMinutes * 5 +
    result.crowd.bottlenecks.length * 20 +
    result.scenario.blockedRoads.length * 30 +
    result.scenario.blockedExits.length * 50
  );
}
