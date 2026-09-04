import React from 'react';
import { AlertTriangle, Flame, Gauge, Radio, ShieldAlert } from 'lucide-react';
import { DisasterScenario, simulateDisaster } from '../lib/disasterEngine';
import { createCrowdSimulation, CrowdSimulation } from '../lib/crowdEngine';

interface LiveEscalationPanelProps {
  scenario: DisasterScenario;
  onScenarioChange: (scenario: DisasterScenario) => void;
  onCrowdChange: (simulation: CrowdSimulation) => void;
}

export default function LiveEscalationPanel({
  scenario,
  onScenarioChange,
  onCrowdChange,
}: LiveEscalationPanelProps) {
  const nextSeverity = Math.min(5, scenario.severity + 1);
  const canEscalate = scenario.severity < 5;

  const applySeverity = (severity: number) => {
    const nextScenario = simulateDisaster(scenario.type, severity);
    const nextCrowd = createCrowdSimulation(nextScenario);

    onScenarioChange(nextScenario);
    onCrowdChange(nextCrowd);
  };

  return (
    <section className="mb-8 rounded-2xl border border-amber-400/20 bg-slate-900/70 p-5 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-amber-300" />
            <h2 className="text-xl font-bold text-white">
              Live Disaster Escalation
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            Escalate the active disaster and instantly rebuild routes, crowd,
            risk, rescue, shelter and ETA intelligence.
          </p>
        </div>

        <button
          type="button"
          disabled={!canEscalate}
          onClick={() => applySeverity(nextSeverity)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Gauge className="h-4 w-4" />
          {canEscalate
            ? `Escalate to Severity ${nextSeverity}`
            : 'Maximum Severity Reached'}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric
          icon={<Flame className="h-4 w-4" />}
          label="Disaster"
          value={scenario.type}
          capitalize
        />
        <Metric
          icon={<Gauge className="h-4 w-4" />}
          label="Severity"
          value={`${scenario.severity}/5`}
        />
        <Metric
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Blocked roads"
          value={scenario.blockedRoads.length.toString()}
        />
        <Metric
          icon={<ShieldAlert className="h-4 w-4" />}
          label="Blocked exits"
          value={scenario.blockedExits.length.toString()}
        />
      </div>

      <div className="mt-4 rounded-xl bg-slate-950/70 p-4 text-sm text-slate-300">
        <span className="font-semibold text-amber-200">Live response:</span>{' '}
        increasing severity rebuilds the disaster scenario and crowd from the
        new conditions. The dashboard's downstream intelligence then updates
        from the new state.
      </div>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  capitalize = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div
        className={`mt-1 text-lg font-bold text-white ${
          capitalize ? 'capitalize' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}
