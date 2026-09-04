import { exits } from '../data/campusData';

type RescueAgent = {
  id: string;
  status: 'safe' | 'evacuating' | 'trapped';
  targetExitId?: string;
  targetExitName?: string;
  route?: string[];
  progress?: number;
  [key: string]: unknown;
};

type RescueSimulation = {
  agents: RescueAgent[];
  bottlenecks: any[];
  totalPeople: number;
  evacuating: number;
  safe: number;
  trapped: number;
  averageCongestion: number;
  [key: string]: unknown;
};

export type RescueProgressResult = {
  simulation: RescueSimulation;
  rescuedNow: number;
  trappedRemaining: number;
  completed: boolean;
};

export function dispatchRescueBatch(
  simulation: RescueSimulation,
  batchSize = 25
): RescueProgressResult {
  const next: RescueSimulation = {
    ...simulation,
    agents: simulation.agents.map((agent) => ({ ...agent })),
    bottlenecks: simulation.bottlenecks.map((item) => ({ ...item })),
  };

  const availableExit = exits.find((exit) => exit.status === 'open');

  if (!availableExit) {
    return {
      simulation: next,
      rescuedNow: 0,
      trappedRemaining: next.trapped,
      completed: false,
    };
  }

  const trapped = next.agents.filter((agent) => agent.status === 'trapped');
  const batch = trapped.slice(0, Math.max(1, batchSize));

  batch.forEach((agent) => {
    agent.status = 'evacuating';
    agent.targetExitId = availableExit.id;
    agent.targetExitName = availableExit.name;
    agent.route = [];
    agent.progress = 20;
  });

  // Move previously rescued agents toward safety.
  next.agents.forEach((agent) => {
    if (agent.status !== 'evacuating') return;

    const current = typeof agent.progress === 'number' ? agent.progress : 0;
    agent.progress = Math.min(100, current + 20);

    if (agent.progress >= 100) {
      agent.status = 'safe';
    }
  });

  next.trapped = next.agents.filter((agent) => agent.status === 'trapped').length;
  next.evacuating = next.agents.filter((agent) => agent.status === 'evacuating').length;
  next.safe = next.agents.filter((agent) => agent.status === 'safe').length;

  return {
    simulation: next,
    rescuedNow: batch.length,
    trappedRemaining: next.trapped,
    completed: next.trapped === 0,
  };
}
