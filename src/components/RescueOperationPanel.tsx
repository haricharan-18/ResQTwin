import React, { useEffect, useRef, useState } from 'react';
import {
  Ambulance,
  CheckCircle2,
  MapPin,
  Play,
  RotateCcw,
  ShieldAlert,
  Users,
} from 'lucide-react';

type Agent = {
  id: string;
  status: 'safe' | 'evacuating' | 'trapped';
  progress?: number;
  targetExitId?: string;
  targetExitName?: string;
  route?: string[];
  [key: string]: unknown;
};

type Simulation = {
  agents: Agent[];
  totalPeople: number;
  evacuating: number;
  safe: number;
  trapped: number;
  [key: string]: unknown;
};

type Props = {
  trappedPeople: number;
  resourceCount: number;
  simulation?: Simulation;
  onCrowdChange?: (simulation: Simulation) => void;
};

const units = [
  ['RES-01', 'Rescue Team', 10, 1],
  ['RES-02', 'Ambulance', 10, 2],
  ['RES-03', 'Rescue Team', 15, 3],
  ['RES-04', 'Ambulance', 20, 4],
] as const;

export default function RescueOperationPanel({
  trappedPeople,
  resourceCount,
  simulation,
  onCrowdChange,
}: Props) {
  const [running, setRunning] = useState(false);
  const [rescued, setRescued] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Standby');

  const runningRef = useRef(false);
  const simulationRef = useRef(simulation);
  const startingTrappedRef = useRef(Math.max(0, trappedPeople));
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    simulationRef.current = simulation;
  }, [simulation]);

  useEffect(() => {
    if (!runningRef.current && trappedPeople > 0) {
      startingTrappedRef.current = trappedPeople;
      setRescued(0);
      setProgress(0);
      setStage('Standby');
    }
  }, [trappedPeople]);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const runRescueStep = () => {
    const current = simulationRef.current;

    if (!current) {
      setStage('Waiting for crowd simulation');
      return;
    }

    const trappedAgents = current.agents.filter(
      (agent) => agent.status === 'trapped'
    );

    if (trappedAgents.length === 0) {
      runningRef.current = false;
      setRunning(false);
      setStage('Operation complete');
      setProgress(100);
      stopTimer();
      return;
    }

    const unitCount = Math.max(1, resourceCount || units.length);
    const batchSize = Math.min(trappedAgents.length, unitCount * 8);
    let remaining = batchSize;

    const nextAgents = current.agents.map((agent) => {
      if (remaining <= 0 || agent.status !== 'trapped') {
        return agent;
      }

      remaining -= 1;

      return {
        ...agent,
        status: 'evacuating',
        progress: 0,
        targetExitId: agent.targetExitId || 'e2',
        targetExitName: agent.targetExitName || 'Main Gate',
        route: agent.route || [],
      };
    });

    const nextTrapped = nextAgents.filter(
      (agent) => agent.status === 'trapped'
    ).length;
    const nextEvacuating = nextAgents.filter(
      (agent) => agent.status === 'evacuating'
    ).length;
    const nextSafe = nextAgents.filter(
      (agent) => agent.status === 'safe'
    ).length;

    const initial = Math.max(
      1,
      startingTrappedRef.current || trappedPeople
    );
    const nextRescued = Math.max(0, initial - nextTrapped);
    const nextProgress = Math.min(
      100,
      Math.round((nextRescued / initial) * 100)
    );

    const nextSimulation: Simulation = {
      ...current,
      agents: nextAgents,
      trapped: nextTrapped,
      evacuating: nextEvacuating,
      safe: nextSafe,
    };

    simulationRef.current = nextSimulation;
    setRescued(nextRescued);
    setProgress(nextProgress);
    setStage(
      nextTrapped === 0
        ? 'Operation complete'
        : 'Recovering trapped people'
    );

    if (onCrowdChange) {
      onCrowdChange(nextSimulation);
    }

    if (nextTrapped === 0) {
      runningRef.current = false;
      setRunning(false);
      stopTimer();
    }
  };

  const start = () => {
    if (runningRef.current) return;

    const current = simulationRef.current;

    if (!current || current.trapped <= 0) {
      setStage('No trapped people');
      return;
    }

    startingTrappedRef.current = current.trapped;
    setRescued(0);
    setProgress(0);
    setStage('Deploying rescue units');

    runningRef.current = true;
    setRunning(true);

    runRescueStep();

    timerRef.current = window.setInterval(runRescueStep, 900);
  };

  const reset = () => {
    runningRef.current = false;
    stopTimer();
    setRunning(false);
    setRescued(0);
    setProgress(0);
    setStage('Standby');
  };

  useEffect(() => {
    return () => {
      runningRef.current = false;
      stopTimer();
    };
  }, []);

  const currentTrapped =
    simulation?.trapped ?? trappedPeople;

  return (
    <div className="mb-8 rounded-xl border border-red-400/20 bg-slate-950 p-5 shadow-xl">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-400/10 p-2">
              <ShieldAlert className="h-5 w-5 text-red-300" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  Live Rescue Operations
                </h2>
                <span className="rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-bold text-red-300">
                  COMMAND
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Rescue teams recover trapped people and return them to the live evacuation flow.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={start}
            disabled={running || currentTrapped <= 0}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {running ? 'Rescue Running' : 'Start Rescue'}
          </button>

          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 font-semibold text-slate-200 hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-900 p-4">
          <Users className="mb-2 h-4 w-4 text-red-300" />
          <div className="text-xs text-slate-400">Trapped Now</div>
          <div className="text-2xl font-bold text-white">
            {currentTrapped.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl bg-slate-900 p-4">
          <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" />
          <div className="text-xs text-slate-400">Rescued</div>
          <div className="text-2xl font-bold text-emerald-300">
            {rescued.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl bg-slate-900 p-4">
          <Ambulance className="mb-2 h-4 w-4 text-cyan-300" />
          <div className="text-xs text-slate-400">Units</div>
          <div className="text-2xl font-bold text-white">
            {resourceCount || units.length}
          </div>
        </div>

        <div className="rounded-xl bg-slate-900 p-4">
          <ShieldAlert className="mb-2 h-4 w-4 text-amber-300" />
          <div className="text-xs text-slate-400">Stage</div>
          <div className="text-lg font-bold text-white">{stage}</div>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-slate-700 bg-slate-900 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">
            Rescue operation progress
          </span>
          <span className="text-sm font-bold text-cyan-300">
            {progress}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <MapPin className="h-4 w-4" />
          {running
            ? 'Rescue units are recovering trapped people and moving them into evacuation flow.'
            : stage === 'Operation complete'
              ? 'Rescue cycle completed.'
              : 'Units are staged. Start the operation to affect the live Digital Twin.'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {units.map(([id, type, capacity, zone]) => (
          <div
            key={id}
            className="rounded-xl border border-slate-700 bg-slate-900 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-white">{id}</div>
              <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-300">
                {running ? 'DEPLOYED' : 'STANDBY'}
              </span>
            </div>

            <div className="mt-1 text-xs text-slate-400">{type}</div>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              Priority Zone {zone}
            </div>

            <div className="mt-2 text-xs text-slate-500">
              Recovery capacity: {capacity} people / cycle
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
