import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Timer,
  Users,
} from 'lucide-react';
import { advanceCrowdSimulation, createCrowdSimulation, CrowdSimulation } from '../lib/crowdEngine';
import { DisasterScenario } from '../lib/disasterEngine';

interface EvacuationPlaybackPanelProps {
  scenario: DisasterScenario;
  simulation: CrowdSimulation;
  onSimulationChange: (simulation: CrowdSimulation) => void;
}

export default function EvacuationPlaybackPanel({
  scenario,
  simulation,
  onSimulationChange,
}: EvacuationPlaybackPanelProps) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);

  const total = simulation.totalPeople || simulation.agents.length;
  const safe = simulation.safe;
  const trapped = simulation.trapped;
  const evacuating = simulation.evacuating;
  const progress = total > 0 ? Math.round((safe / total) * 100) : 0;

  const status = useMemo(() => {
    if (safe === total && total > 0) return 'Evacuation complete';
    if (running) return 'Live evacuation in progress';
    if (step > 0) return 'Simulation paused';
    return 'Ready to simulate';
  }, [running, safe, step, total]);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      onSimulationChange(advanceCrowdSimulation(simulation, scenario));
      setStep((value) => value + 1);
    }, 700);

    return () => window.clearInterval(timer);
  }, [running, scenario, simulation, onSimulationChange]);

  useEffect(() => {
    if (safe === total && total > 0) {
      setRunning(false);
    }
  }, [safe, total]);

  const reset = () => {
    setRunning(false);
    setStep(0);
    onSimulationChange(simulation);
  };

  return (
    <div className="glass rounded-xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Activity className="w-5 h-5 text-cyan-300" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Live Evacuation Simulation</h2>
          </div>
          <p className="text-gray-300 text-sm mt-2">
            Watch the crowd evacuate step-by-step using the active disaster routes and congestion model.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setRunning((value) => !value)}
            disabled={safe === total && total > 0}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-5 py-3 rounded-lg flex items-center gap-2 transition-all"
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? 'Pause Simulation' : 'Run Evacuation'}
          </button>
          <button
            onClick={reset}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <div className="bg-slate-900/70 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm"><Timer className="w-4 h-4" /> Simulation Step</div>
          <div className="text-2xl font-bold text-white mt-1">{step}</div>
        </div>
        <div className="bg-slate-900/70 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm"><ShieldCheck className="w-4 h-4" /> Safe</div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{safe.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900/70 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm"><Users className="w-4 h-4" /> Evacuating</div>
          <div className="text-2xl font-bold text-blue-300 mt-1">{evacuating.toLocaleString()}</div>
        </div>
        <div className="bg-slate-900/70 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm"><Users className="w-4 h-4" /> Trapped</div>
          <div className="text-2xl font-bold text-red-300 mt-1">{trapped.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-lg p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-300">Evacuation progress</span>
          <span className="text-cyan-300 font-semibold">{progress}%</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-3 text-sm">
          <span className="text-cyan-200">{status}</span>
          <span className="text-gray-400">
            {scenario.type} • severity {scenario.severity}/5
          </span>
        </div>
      </div>
    </div>
  );
}
